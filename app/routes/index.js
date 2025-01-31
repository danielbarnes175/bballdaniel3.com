'use strict'

const controller = require('../controllers/index');

module.exports = function(app) {
    app.route('/')
        .get(controller.index);
    app.route('/about')
        .get(controller.about);
    app.route('/blog/:post')
        .get(controller.blog);
    app.route('/tag/:tag')
        .get(controller.tag);
    app.route('/privacy')
        .get(controller.privacy);

    app.use((req, res, next) => {
        res.status(404).render('404.hbs');
    });
};