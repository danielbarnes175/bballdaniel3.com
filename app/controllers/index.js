"use strict";

const guestbookController = require("./guestbook");

module.exports = {
    home: (req, res) => res.render("index"),
    about: (req, res) => res.render("about"),
    blog: require("./blog").getBlog,
    post: require("./blog").getPost,
    tag: require("./tags").getTag,
    privacy: (req, res) => res.render("privacy"),
    guestbook: (req, res) => {
        let scripts = [{ script: 'https://www.google.com/recaptcha/api.js?render=6Le7JK0bAAAAADV3P6ZDDOXJHJImPrefIVghEs_7' }];
        res.render("guestbook", { entries: guestbookController.getGuestbookEntries(), scripts: scripts });
    },
    submitGuestbookEntry: guestbookController.submitGuestbookEntry,
    now: (req, res) => res.render("now"),
    games: (req, res) => res.render("games"),
};