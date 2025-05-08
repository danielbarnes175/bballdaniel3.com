'use strict'

const controller = require('../controllers/index');

module.exports = function(app) {
    app.route('/')
        .get(controller.home);
    app.route('/about')
        .get(controller.about);
    app.route('/blog')
        .get(controller.blog);
    app.route('/blog/:post')
        .get(controller.post);
    app.route('/guestbook')
        .get(controller.guestbook)
        .post(controller.submitGuestbookEntry);
    app.route('/tag/:tag')
        .get(controller.tag);
    app.route('/privacy')
        .get(controller.privacy);


    app.use((req, res, next) => {
        res.status(404).render('404.hbs');
    });
};