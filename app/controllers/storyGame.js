const { renderMarkdown } = require('../helpers/sanitizeMarkdown');
const { sendStoryGameToDiscord } = require('../helpers/sendToDiscord');
const { convertToMedieval } = require('../helpers/convertToMedieval');
const { getWritingPrompt } = require('../helpers/getWritingPrompt');
const {
    getStoryToken,
    normalizeName,
    publicOrigin,
    randomToken,
    safeEqual,
    setStoryToken
} = require('../helpers/security');
const crypto = require('crypto');

const rooms = Object.create(null); // Single-process ephemeral game state
const MAX_PLAYERS = 12;
const MAX_CONTENT_LENGTH = 20000;
const MAX_PROMPT_LENGTH = 2000;
const MAX_ROOMS = 1000;
const ROOM_IDLE_TTL = 24 * 60 * 60 * 1000;

// Periodic safety sweep: remove finished games older than 60 minutes
const ONE_HOUR = 60 * 60 * 1000;
function clearRoomTimers(room) {
    for (const timer of ['turnTimer', 'readingPhaseTimer', 'cleanupTimeout', 'startDelayTimer']) {
        if (room[timer]) clearTimeout(room[timer]);
    }
}

function deleteRoom(code) {
    const room = rooms[code];
    if (room) clearRoomTimers(room);
    delete rooms[code];
}

setInterval(() => {
    const now = Date.now();
    try {
        for (const [code, room] of Object.entries(rooms)) {
            if (!room) continue;
            const expiredFinishedRoom = room.state === 'finished' && now - (room.completedAt || 0) > ONE_HOUR;
            const expiredIdleRoom = now - (room.lastActivity || room.createdAt || 0) > ROOM_IDLE_TTL;
            if (expiredFinishedRoom || expiredIdleRoom) deleteRoom(code);
        }
    } catch (e) {
        // Non-fatal; continue next sweep
        console.error('StoryGame cleanup sweep error:', e && e.message ? e.message : e);
    }
}, 60 * 1000).unref();

function findPlayerByToken(room, token) {
    if (!room || !token) return null;
    return room.players.find(player => safeEqual(player.token, token)) || null;
}

function getAuthenticatedPlayer(req, room, code) {
    return findPlayerByToken(room, getStoryToken(req, code));
}

function generateRoomCode() {
    let code;
    do code = crypto.randomBytes(8).toString('hex').toUpperCase(); while (rooms[code]);
    return code;
}

function publicRoom(room) {
    return {
        currentTurn: room.currentTurn,
        host: room.host,
        players: room.players.map(({ name }) => ({ name })),
        settings: room.settings
    };
}

function startTurn(room, code, io) {
    if (room.state !== 'active' || room.currentTurn >= room.players.length) return;
    room.turnStartTime = Date.now();
    room.lastActivity = Date.now();
    room.submissions = Object.create(null);

    io.to(code).emit('start-turn', {
        turn: room.currentTurn,
        endsIn: room.turnLength / 1000
    });

    const expectedTurn = room.currentTurn;
    if (room.turnTimer) clearTimeout(room.turnTimer);
    room.turnTimer = setTimeout(() => {
        if (rooms[code] === room && room.state === 'active' && room.currentTurn === expectedTurn) {
            finishTurn(room, code, io);
        }
    }, room.turnLength + room.bufferTime);
}

function finishTurn(room, code, io) {
    room.players.forEach((player, index) => {
        const storyIndex = (index + room.currentTurn) % room.players.length;
        const story = room.stories[storyIndex];
        const submission = room.submissions[player.id] || story.content;

        story.content = submission;
        story.authors.push(player.name);
        if (room.settings.keepHistory && Array.isArray(story.history)) {
            story.history.push({
                turn: room.currentTurn,
                author: player.name,
                content: submission,
                html: renderMarkdown(submission)
            });
        }
    });

    room.currentTurn++;

    // Advance any players who missed submitting so their lastCompletedTurn isn't stale.
    const justFinishedTurn = room.currentTurn - 1;
    room.players.forEach(player => {
        if (room.progress && typeof room.progress[player.id] === 'number') {
            if (room.progress[player.id] < justFinishedTurn) {
                room.progress[player.id] = justFinishedTurn;
            }
        }
    });

    // Reading phase logic
    if (room.settings.enableReadingPhase && room.currentTurn < room.players.length) {
        room.state = "reading";
        room.readingPhaseStartTime = Date.now();
        room.readingVotes = Object.create(null);
        io.to(code).emit("start-reading-phase", {
            turn: room.currentTurn,
            endsIn: room.settings.readingPhaseTime,
            voters: room.players.map(p => p.name),
            votes: []
        });

        // Keep a reference so we can clear if everyone votes early
        if (room.readingPhaseTimer) clearTimeout(room.readingPhaseTimer);
        room.readingPhaseTimer = setTimeout(() => {
            if (rooms[code] === room && room.state === 'reading') {
                room.state = "active";
                startTurn(room, code, io);
            }
        }, room.settings.readingPhaseTime * 1000);
    } else if (room.currentTurn >= room.players.length) {
        room.state = "finished";

        // If Medieval Mode is enabled, convert body to medieval speech
        if (room.settings.enableMedievalMode) {
            room.stories = room.stories.map(story => {
                story.content = convertToMedieval(story.content);
                return story;
            });
        }

        // Initialize per-story like/dislike vote buckets
        room.resultVotes = room.stories.map(() => ({ likes: [], dislikes: [] }));

        // Mark completion time and schedule cleanup to free memory after 60 minutes
        room.completedAt = Date.now();
        const completionMarker = room.completedAt;

        // Clear any prior cleanup timer before scheduling a fresh one
        if (room.cleanupTimeout) {
            clearTimeout(room.cleanupTimeout);
        }
        room.cleanupTimeout = setTimeout(() => {
            const current = rooms[code];
            // Only delete if the room still represents the same finished game
            if (current && current.state === 'finished' && current.completedAt === completionMarker) {
                deleteRoom(code);
            }
        }, ONE_HOUR);

        io.to(code).emit("game-finished");
        try {
            sendStoryGameToDiscord({
                code,
                stories: room.stories,
                players: room.players.map(({ name }) => ({ name })),
                keepHistory: room.settings.keepHistory
            });
        } catch (e) {
            console.error('Discord notify failed:', e && e.message ? e.message : e);
        }
    } else {
        startTurn(room, code, io); // Schedule next turn
    }
}

module.exports = {
    createRoom: (req, res) => {
        const username = normalizeName(req.query.username);

        if (!username) {
            return res.render("storyGame/enterName", { startGame: true, layout: "storyGame" });
        }
        if (Object.keys(rooms).length >= MAX_ROOMS) return res.status(503).send('No room capacity available');

        const code = generateRoomCode();
        const hostToken = randomToken();
        rooms[code] = {
            host: username,
            hostToken,
            settings: { turnTime: 60, keepHistory: false, enableReadingPhase: false, readingPhaseTime: 30 },
            players: [],
            stories: [],
            state: "waiting",
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        setStoryToken(res, code, hostToken, publicOrigin(req).startsWith('https://'));
        res.redirect(`/games/story/${code}?username=${encodeURIComponent(rooms[code].host)}`);
    },

    joinRoom: (req, res) => {
        const code = req.params.code.toUpperCase();
        let username = normalizeName(req.query.username);
        const io = req.app.get('io');
        const room = rooms[code];

        if (!room || !/^[A-F0-9]{16}$/.test(code)) return res.status(404).render('404');

        const presentedToken = getStoryToken(req, code);
        let player = findPlayerByToken(room, presentedToken);
        if (player) username = player.name;

        if (!username && !player) {
            if (room.state !== "waiting") {
                return res.status(403).send("Game already started");
            }
            return res.render("storyGame/enterName", { code, layout: "storyGame" });
        }

        if (room.state !== "waiting" && !player) {
            return res.status(403).send("Game already started");
        }

        if (!player) {
            if (room.players.length >= MAX_PLAYERS) return res.status(409).send("Room is full");
            if (room.players.some(p => p.name.toLowerCase() === username.toLowerCase())) {
                return res.status(409).send("That name is already in use");
            }
            const token = safeEqual(presentedToken, room.hostToken) ? room.hostToken : randomToken();
            player = { id: randomToken(12), name: username, token };
            room.players.push(player);
            setStoryToken(res, code, token, publicOrigin(req).startsWith('https://'));
            room.lastActivity = Date.now();
            io.to(code).emit('player-joined', room.players.map(({ name }) => ({ name })));
        }

        if (room.state === "active") {
            return res.render("storyGame/wait", {
                code,
                turn: room.currentTurn + 1,
                username,
                message: "Game in progress...",
                layout: "storyGame"
            });
        }
        if (room.state === 'reading') {
            return res.redirect(`/games/story/${code}/reading`);
        }
        if (room.state === 'finished') {
            return res.redirect(`/games/story/${code}/results`);
        }

        res.render("storyGame/lobby", {
            code,
            room: publicRoom(room),
            username,
            joinUrl: `${publicOrigin(req)}/games/story/${code}`,
            layout: "storyGame"
        });

    },

    reading: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        const participant = room && getAuthenticatedPlayer(req, room, code);
        const username = participant ? participant.name : '';

        if (!room || room.state !== "reading") return res.status(404).render('404');

        const now = Date.now();
        const elapsed = Math.floor((now - (room.readingPhaseStartTime || now)) / 1000);
        const timeLeft = Math.max(0, (room.settings.readingPhaseTime || 0) - elapsed);
        const voters = room.players.map(p => p.name);
        const votes = room.players.filter(p => room.readingVotes && room.readingVotes[p.id]).map(p => p.name);
        // Determine the next story this player will write for
        if (!participant) return res.status(403).send('Not a player');
        const playerIndex = room.players.findIndex(p => p.id === participant.id);
        if (playerIndex === -1) return res.status(404).render('404');
        const storyIndex = (playerIndex + room.currentTurn) % room.players.length;
        const story = room.stories[storyIndex];

        res.render("storyGame/read", {
            code,
            username,
            timeLeft,
            voters,
            votes,
            nextStoryIndex: storyIndex + 1,
            nextContent: story ? story.content : '',
            layout: "storyGame"
        });
    },

    voteReadingPhase: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        const io = req.app.get('io');

        if (!room || room.state !== "reading") return res.status(404).send("No reading phase");
        const player = getAuthenticatedPlayer(req, room, code);
        if (!player) return res.status(403).send("Not a player");

        if (!room.readingVotes) room.readingVotes = Object.create(null);
        room.readingVotes[player.id] = true;
        const voters = room.players.map(p => p.name);
        const votes = room.players.filter(p => room.readingVotes[p.id]).map(p => p.name);
        io.to(code).emit("reading-phase-vote-update", { voters, votes });

        // End phase early if all have voted
        if (room.players.every(p => room.readingVotes[p.id])) {
            if (room.readingPhaseTimer) clearTimeout(room.readingPhaseTimer);
            room.state = "active";
            startTurn(room, code, io);
        }

        res.json({ voters, votes });
    },

    startGame: (req, res) => {
        const code = req.params.code.toUpperCase();
        const io = req.app.get('io');
        const room = rooms[code];
        if (!room) return res.status(404).render('404');
        const token = getStoryToken(req, code);
        if (!safeEqual(token, room.hostToken)) return res.status(403).send("Host authorization required");
        if (room.state !== 'waiting') return res.status(409).send("Game already started");
        if (room.players.length === 0) return res.status(409).send("At least one player is required");

        // Apply host settings
        room.settings.keepHistory = !!req.body.keepHistory;
        room.settings.enableReadingPhase = !!req.body.enableReadingPhase;
        room.settings.readingPhaseTime = Math.min(300, Math.max(5, parseInt(req.body.readingPhaseTime) || 30));
        room.settings.enableScotlandMode = !!req.body.enableScotlandMode;
        room.settings.enableMedievalMode = !!req.body.enableMedievalMode;
        const startingPrompt = !!req.body.startingPromptEnabled ? String(req.body.startingPrompt || '').slice(0, MAX_PROMPT_LENGTH) : "";

        // Init game state
        room.currentTurn = 0;
        room.bufferTime = 5000;
        room.submissions = Object.create(null);
        room.stories = room.players.map(p => ({ authors: [], content: startingPrompt, history: room.settings.keepHistory ? [] : undefined }));
        room.state = "active";
        room.progress = Object.create(null);

        // lastCompletedTurn semantics: -1 means none completed yet; writable turn is lastCompletedTurn + 1
        room.players.forEach(player => {
            room.progress[player.id] = -1;
        });
        room.turnStartTime = Date.now();

        const submittedTime = parseInt(req.body.turnTime);
        const validatedTime = isNaN(submittedTime) ? 60 : Math.min(600, Math.max(10, submittedTime));
        room.settings.turnTime = validatedTime;
        room.turnLength = room.settings.turnTime * 1000;

        room.startDelayTimer = setTimeout(() => {
            startTurn(room, code, io);
        }, 1000);

        io.to(code).emit('game-started');

        res.redirect(`/games/story/${code}?username=${encodeURIComponent(room.host)}`);
    },

    writeTurn: (req, res) => {
        const code = req.params.code.toUpperCase();
        const requestedTurn = parseInt(req.query.turn);

        const room = rooms[code];
        if (!room || room.state !== "active") return res.status(404).render('404');

        const player = getAuthenticatedPlayer(req, room, code);
        if (!player) return res.status(403).send('Not a player');
        const username = player.name;
        const playerIndex = room.players.findIndex(p => p.id === player.id);
        if (playerIndex === -1) return res.status(404).render('404');

        const lastCompletedTurn = room.progress[player.id];
        // If player somehow fell more than one turn behind, fast-forward them (missed submissions are auto-filled)
        if (lastCompletedTurn < room.currentTurn - 1) {
            room.progress[player.id] = room.currentTurn - 1;
        }

        // After potential fast-forward
        const authoritativeWritableTurn = room.progress[player.id] + 1;

        // Writable turn must be the room.currentTurn; otherwise redirect to server authoritative URL
        if (authoritativeWritableTurn !== room.currentTurn) {
            return res.status(302).redirect(`/games/story/${code}/write?username=${encodeURIComponent(username)}&turn=${room.currentTurn}`);
        }

        if (isNaN(requestedTurn) || requestedTurn !== room.currentTurn) {
            return res.status(302).redirect(`/games/story/${code}/write?username=${encodeURIComponent(username)}&turn=${room.currentTurn}`);
        }

        const storyIndex = (playerIndex + room.currentTurn) % room.players.length;
        const story = room.stories[storyIndex];

        const now = Date.now();
        const elapsed = now - room.turnStartTime;
        const timeLeft = Math.max(0, Math.floor((room.turnLength - elapsed) / 1000));

        const showGeneratePromptButton = room.currentTurn === 0 && (!story.content || !story.content.trim());

        res.render("storyGame/write", {
            code,
            storyIndex: storyIndex + 1,
            username,
            showGeneratePromptButton,
            previousContent: story.content,
            timeLeft,
            layout: "storyGame",
            room: publicRoom(room)
        });
    },


    submitTurn: (req, res) => {
        const code = req.params.code.toUpperCase();
        const { turn, content } = req.body;
        const room = rooms[code];
        if (!room || room.state !== "active") return res.status(404).render('404');
        const player = getAuthenticatedPlayer(req, room, code);
        if (!player) return res.status(403).send('Not a player');
        if (typeof content !== 'string' || !content.trim() || content.length > MAX_CONTENT_LENGTH) {
            return res.status(400).send('Story content must be between 1 and 20,000 characters');
        }

        const currentTurn = room.currentTurn; // active turn index
        if (parseInt(turn) !== currentTurn) {
            return res.status(403).send("Wrong turn");
        }

        room.submissions[player.id] = content;
        room.progress[player.id] = currentTurn; // mark this turn as completed
        room.lastActivity = Date.now();

        // Player gets a waiting screen
        res.render("storyGame/wait", { code, turn: currentTurn, username: player.name, message: "Waiting for other players...", layout: "storyGame" });
    },

    results: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        if (!room || room.state !== "finished") return res.status(404).render('404');
        const player = getAuthenticatedPlayer(req, room, code);

        res.render("storyGame/results", {
            code,
            username: player ? player.name : '',
            stories: room.stories,
            keepHistory: room.settings.keepHistory,
            votes: room.resultVotes || room.stories.map(() => ({ likes: [], dislikes: [] })),
            layout: "storyGame"
        });
    },

    // Record a like/dislike for a story on the results screen
    resultsVote: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        const io = req.app.get('io');
        if (!room || room.state !== "finished") return res.status(404).send("Voting unavailable");

        const { storyIndex, voteType } = req.body || {};
        const player = getAuthenticatedPlayer(req, room, code);
        if (!player) return res.status(403).send("Not a player");
        const username = player.name;
        const sIdx = parseInt(storyIndex);
        if (!Number.isInteger(sIdx) || sIdx < 0 || sIdx >= room.stories.length) {
            return res.status(400).send("Bad request");
        }

        if (!room.resultVotes) {
            room.resultVotes = room.stories.map(() => ({ likes: [], dislikes: [] }));
        }
        const bucket = room.resultVotes[sIdx];
        if (!bucket) return res.status(400).send("Invalid story");

        // Ensure arrays exist
        bucket.likes = Array.isArray(bucket.likes) ? bucket.likes : [];
        bucket.dislikes = Array.isArray(bucket.dislikes) ? bucket.dislikes : [];

        function remove(arr, name) {
            const i = arr.indexOf(name);
            if (i !== -1) arr.splice(i, 1);
        }

        if (voteType === 'like') {
            // Toggle like; mutually exclusive with dislike
            if (bucket.likes.includes(username)) {
                remove(bucket.likes, username);
            } else {
                remove(bucket.dislikes, username);
                bucket.likes.push(username);
            }
        } else if (voteType === 'dislike') {
            if (bucket.dislikes.includes(username)) {
                remove(bucket.dislikes, username);
            } else {
                remove(bucket.likes, username);
                bucket.dislikes.push(username);
            }
        } else {
            return res.status(400).send("Unknown vote type");
        }

        const payload = { storyIndex: sIdx, likes: bucket.likes, dislikes: bucket.dislikes };
        io.to(code).emit('results-vote-update', payload);
        res.json(payload);
    },

    getWritingPrompt: (req, res) => {
        res.json({ prompt: getWritingPrompt() });
    },

    canJoinSocketRoom: (code, token) => {
        const room = rooms[String(code || '').toUpperCase()];
        return Boolean(room && findPlayerByToken(room, token));
    }
};
