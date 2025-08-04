const rooms = {}; // In-memory storage for now

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
        const submission = room.submissions[player.name] || room.stories[storyIndex].content;

        room.stories[storyIndex].content = submission;
        room.stories[storyIndex].authors.push(player.name);
    });

    room.currentTurn++;

    if (room.currentTurn >= room.players.length) {
        room.state = "finished";
        io.to(code).emit("game-finished");
    } else {
        startTurn(room, code, io); // Schedule next turn
    }
}

module.exports = {
    createRoom: (req, res) => {
        const code = Math.random().toString(36).substr(2, 6).toUpperCase();
        rooms[code] = {
            host: req.query.username || "Host",
            settings: { turnTime: 60 },
            players: [],
            stories: [],
            state: "waiting"
        };
        res.redirect(`/games/story/${code}?username=${rooms[code].host}`);
    }
    ,

    joinRoom: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.query.username;
        const io = req.app.get('io');
        const room = rooms[code];

        if (!room) return res.status(404).render('404');

        if (!username) {
            return res.render("storyGame/enterName", { code });
        }

        const alreadyInRoom = room.players.some(p => p.name === username);
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


    startGame: (req, res) => {
        const code = req.params.code.toUpperCase();
        const io = req.app.get('io');
        const room = rooms[code];
        if (!room) return res.status(404).render('404');

        // Init game state
        room.currentTurn = 0;
        room.bufferTime = 5000;
        room.submissions = {};
        room.stories = room.players.map(p => ({ authors: [], content: "" }));
        room.state = "active";
        room.progress = {};
        room.players.forEach(player => {
            room.progress[player.name] = 0;
        });
        room.turnStartTime = Date.now();

        const submittedTime = parseInt(req.body.turnTime);
        const validatedTime = isNaN(submittedTime) || submittedTime < 10 ? 60 : submittedTime;
        room.settings.turnTime = validatedTime;
        room.turnLength = room.settings.turnTime * 1000;

        setTimeout(() => {
            startTurn(room, code, io);
        }, 1000);

        res.redirect(`/games/story/${code}?username=${room.host}`);
    },


    writeTurn: (req, res) => {
        const code = req.params.code.toUpperCase();
        const username = req.query.username;
        const turn = parseInt(req.query.turn);

        const room = rooms[code];
        if (!room || room.state !== "active") return res.status(404).render('404');

        const playerIndex = room.players.findIndex(p => p.name === username);
        if (playerIndex === -1) return res.status(404).render('404');

        const expectedTurn = room.progress[username];
        if (turn !== expectedTurn) {
            return res.status(403).send("Nice try, but you can’t skip turns!");
        }

        const storyIndex = (playerIndex + turn) % room.players.length;
        const story = room.stories[storyIndex];

        const now = Date.now();
        const elapsed = now - room.turnStartTime;
        const timeLeft = Math.max(0, Math.floor((room.turnLength - elapsed) / 1000));

        res.render("storyGame/write", {
            code,
            turn,
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

        const currentTurn = room.currentTurn;
        if (parseInt(turn) !== currentTurn) {
            return res.status(403).send("Wrong turn");
        }

        room.submissions[username] = content;
        room.progress[username]++;

        // Player gets a waiting screen
        res.render("storyGame/wait", { code, turn, username, message: "Waiting for other players..." });
    },



    results: (req, res) => {
        const code = req.params.code.toUpperCase();
        const room = rooms[code];
        if (!room || room.state !== "finished") return res.status(404).render('404');

        res.render("storyGame/results", {
            code,
            stories: room.stories
        });
    }
};
