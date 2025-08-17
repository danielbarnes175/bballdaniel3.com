'use strict'

const controller = require('../controllers/index');
const gameController = require('../controllers/storyGame');

module.exports = function (app) {
    app.route('/')
        .get(controller.home);
    app.route('/about')
        .get(controller.about);
    app.route('/blog')
        .get(controller.blog);
    app.route('/blog/:post')
        .get(controller.post);
    app.route('/games')
        .get(controller.games);
    app.route('/guestbook')
        .get(controller.guestbook)
        .post(controller.submitGuestbookEntry);
    app.route('/ifGames')
        .get(controller.ifGames);
    app.route('/now')
        .get(controller.now);
    app.route('/tag/:tag')
        .get(controller.tag);
    app.route('/privacy')
        .get(controller.privacy);
    app.route('/projects')
        .get(controller.projects);

    app.route('/games/story/create')
        .get(gameController.createRoom);
    app.route('/games/story/:code')
        .get(gameController.joinRoom);
    app.route('/games/story/:code/start')
        .post(gameController.startGame);
    app.route('/games/story/:code/write')
        .get(gameController.writeTurn)
        .post(gameController.submitTurn);
    app.route('/games/story/:code/results')
        .get(gameController.results);

    app.route('/health')
        .get((req, res) => {
            res.status(200).send("OK");
        });

    app.use((req, res, next) => {
        res.status(404).render('404.hbs');
    });
};
