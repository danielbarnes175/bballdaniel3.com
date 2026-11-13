'use strict'

const controller = require('../controllers/index');
const gameController = require('../controllers/storyGame');
const apiRoutes = require('./api');
const { createRateLimiter, csrfProtection, sameOriginOnly } = require('../helpers/security');

const guestbookLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, key: req => `guestbook:${req.ip}` });
const roomCreateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, key: req => `room:${req.ip}` });
const gameMutationLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60, key: req => `game:${req.ip}` });

module.exports = function (app) {
    app.route('/')
        .get(controller.home);
    app.route('/about')
        .get(controller.about);
    app.route('/blog')
        .get(controller.blog);
    app.route('/blog/:post')
        .get(controller.post);
    app.route('/collections')
        .get(controller.collections);
    app.route('/games')
        .get(controller.games);
    app.route('/guestbook')
        .get(controller.guestbook)
        .post(sameOriginOnly, guestbookLimiter, csrfProtection, controller.submitGuestbookEntry);
    app.route('/ifGames')
        .get(controller.ifGames);
    app.route('/now')
        .get(controller.now);
    app.route('/tag/:tag')
        .get(controller.tag);
    app.route('/privacy')
        .get(controller.privacy);
    app.route('/politics')
        .get(controller.politics);
    app.route('/projects')
        .get(controller.projects);

    app.route('/games/story/create')
        .get(sameOriginOnly, roomCreateLimiter, gameController.createRoom);
    app.route('/games/story/:code')
        .get(gameController.joinRoom);
    app.route('/games/story/:code/start')
        .post(sameOriginOnly, gameMutationLimiter, gameController.startGame);
    app.route('/games/story/:code/write')
        .get(gameController.writeTurn)
        .post(sameOriginOnly, gameMutationLimiter, gameController.submitTurn);
    app.route('/games/story/:code/reading')
        .get(gameController.reading);
    app.route('/games/story/:code/reading/vote')
        .post(sameOriginOnly, gameMutationLimiter, gameController.voteReadingPhase);
    app.route('/games/story/:code/results')
        .get(gameController.results);
    app.route('/games/story/:code/results/vote')
        .post(sameOriginOnly, gameMutationLimiter, gameController.resultsVote);

    app.route('/health')
        .get((req, res) => {
            res.status(200).send("OK");
        });

    app.use('/api', apiRoutes);
    app.use((req, res, next) => {
        res.status(404).render('404.hbs');
    });
};
