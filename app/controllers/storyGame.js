const rooms = {}; // In-memory storage for now
const { renderMarkdown } = require('../helpers/sanitizeMarkdown');

function startTurn(room, code, io) {
    room.turnStartTime = Date.now();
    room.submissions = {};

    io.to(code).emit('start-turn', {
        turn: room.currentTurn,
        endsIn: room.turnLength / 1000
    });

    setTimeout(() => {
        finishTurn(room, code, io);
    }, room.turnLength + room.bufferTime);
}

function finishTurn(room, code, io) {
    room.players.forEach((player, index) => {
        const storyIndex = (index + room.currentTurn) % room.players.length;
        const story = room.stories[storyIndex];
        const submission = room.submissions[player.name] || story.content;

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
        if (room.progress && typeof room.progress[player.name] === 'number') {
            if (room.progress[player.name] < justFinishedTurn) {
                room.progress[player.name] = justFinishedTurn;
            }
        }
    });

    // Reading phase logic
    if (room.settings.enableReadingPhase && room.currentTurn < room.players.length) {
        room.state = "reading";
        room.readingPhaseStartTime = Date.now();
        room.readingVotes = {};
        io.to(code).emit("start-reading-phase", {
            turn: room.currentTurn,
            endsIn: room.settings.readingPhaseTime,
            voters: room.players.map(p => p.name),
            votes: []
        });

        // Keep a reference so we can clear if everyone votes early
        if (room.readingPhaseTimer) clearTimeout(room.readingPhaseTimer);
        room.readingPhaseTimer = setTimeout(() => {
            // End reading phase and start next turn
            room.state = "active";
            startTurn(room, code, io);
        }, room.settings.readingPhaseTime * 1000);
    } else if (room.currentTurn >= room.players.length) {
        room.state = "finished";
        io.to(code).emit("game-finished");
    } else {
        startTurn(room, code, io); // Schedule next turn
    }
}

module.exports = {
    createRoom: (req, res) => {
        const username = req.query.username;

        if (!username) {
            return res.render("storyGame/enterName", { startGame: true });
        }

        const code = Math.random().toString(36).slice(2, 6).toUpperCase();
        rooms[code] = {
            host: req.query.username || "Host",
            settings: { turnTime: 60, keepHistory: false, enableReadingPhase: false, readingPhaseTime: 30 },
            players: [],
            stories: [],
            state: "waiting"
        };
        res.redirect(`/games/story/${code}?username=${rooms[code].host}`);
    },

    joinRoom: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.query.username;
        const io = req.app.get('io');
        const room = rooms[code];

        if (!room) return res.status(404).render('404');

        if (!username) {
            if (room.state !== "waiting") {
                return res.status(403).send("Game already started");
            }
            return res.render("storyGame/enterName", { code });
        }

        const alreadyInRoom = room.players.some(p => p.name === username);

        if (room.state !== "waiting" && !alreadyInRoom) {
            return res.status(403).send("Game already started");
        }

        if (!alreadyInRoom) {
            room.players.push({ name: username });
            io.to(code).emit('player-joined', room.players);
        }

        if (room.state === "active") {
            return res.render("storyGame/wait", {
                code,
                turn: room.currentTurn + 1,
                username,
                message: "Game in progress..."
            });
        }

        res.render("storyGame/lobby", {
            code,
            room,
            username,
            joinUrl: `${req.protocol}://${req.get('host')}/games/story/${code}`
        });

    },

    reading: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.query.username;
        const room = rooms[code];

        if (!room || room.state !== "reading") return res.status(404).render('404');

        const now = Date.now();
        const elapsed = Math.floor((now - (room.readingPhaseStartTime || now)) / 1000);
        const timeLeft = Math.max(0, (room.settings.readingPhaseTime || 0) - elapsed);
        const voters = room.players.map(p => p.name);
        const votes = Object.keys(room.readingVotes || {});
        // Determine the next story this player will write for
        const playerIndex = room.players.findIndex(p => p.name === username);
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
            nextContent: story ? story.content : ''
        });
    },

    voteReadingPhase: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.body.username;
        const room = rooms[code];
        const io = req.app.get('io');

        if (!room || room.state !== "reading") return res.status(404).send("No reading phase");

        if (!room.readingVotes) room.readingVotes = {};
        room.readingVotes[username] = true;
        const voters = room.players.map(p => p.name);
        const votes = Object.keys(room.readingVotes);
        io.to(code).emit("reading-phase-vote-update", { voters, votes });

        // End phase early if all have voted
        if (votes.length === voters.length) {
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

        // Apply host settings
        room.settings.keepHistory = !!req.body.keepHistory;
        room.settings.enableReadingPhase = !!req.body.enableReadingPhase;
        room.settings.readingPhaseTime = parseInt(req.body.readingPhaseTime) || 30;

        // Init game state
        room.currentTurn = 0;
        room.bufferTime = 5000;
        room.submissions = {};
        room.stories = room.players.map(p => ({ authors: [], content: "", history: room.settings.keepHistory ? [] : undefined }));
        room.state = "active";
        room.progress = {};

        // lastCompletedTurn semantics: -1 means none completed yet; writable turn is lastCompletedTurn + 1
        room.players.forEach(player => {
            room.progress[player.name] = -1;
        });
        room.turnStartTime = Date.now();

        const submittedTime = parseInt(req.body.turnTime);
        const validatedTime = isNaN(submittedTime) || submittedTime < 10 ? 60 : submittedTime;
        room.settings.turnTime = validatedTime;
        room.turnLength = room.settings.turnTime * 1000;

        setTimeout(() => {
            startTurn(room, code, io);
        }, 1000);

        io.to(code).emit('game-started');

        res.redirect(`/games/story/${code}?username=${room.host}`);
    },


    writeTurn: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.query.username;
        const requestedTurn = parseInt(req.query.turn);

        const room = rooms[code];
        if (!room || room.state !== "active") return res.status(404).render('404');

        const playerIndex = room.players.findIndex(p => p.name === username);
        if (playerIndex === -1) return res.status(404).render('404');

        const lastCompletedTurn = room.progress[username];
        // If player somehow fell more than one turn behind, fast-forward them (missed submissions are auto-filled)
        if (lastCompletedTurn < room.currentTurn - 1) {
            room.progress[username] = room.currentTurn - 1;
        }

        // After potential fast-forward
        const authoritativeWritableTurn = room.progress[username] + 1;

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

        res.render("storyGame/write", {
            code,
            turn: room.currentTurn,
            storyIndex: storyIndex + 1,
            username,
            time: room.settings.turnTime,
            totalTurns: room.players.length,
            previousContent: story.content,
            timeLeft
        });
    },


    submitTurn: (req, res) => {
        const { code, turn, username, content } = req.body;
        const room = rooms[code.toUpperCase()];
        if (!room || room.state !== "active") return res.status(404).render('404');

        const currentTurn = room.currentTurn; // active turn index
        if (parseInt(turn) !== currentTurn) {
            return res.status(403).send("Wrong turn");
        }

        room.submissions[username] = content;
        room.progress[username] = currentTurn; // mark this turn as completed

        // Player gets a waiting screen
        res.render("storyGame/wait", { code, turn: currentTurn, username, message: "Waiting for other players..." });
    },



    results: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        if (!room || room.state !== "finished") return res.status(404).render('404');

        res.render("storyGame/results", {
            code,
            stories: room.stories,
            keepHistory: room.settings.keepHistory
        });
    }
};
