"use strict";

const guestbookController = require("./guestbook");

module.exports = {
    home: (req, res) => res.render("index"),
    about: (req, res) => res.render("about"),
    blog: require("./blog").getBlog,
    post: require("./blog").getPost,
    tag: require("./tags").getTag,
    privacy: (req, res) => res.render("privacy"),
    guestbook: (req, res) => res.render("guestbook", { entries: guestbookController.getGuestbookEntries() }),
    submitGuestbookEntry: guestbookController.submitGuestbookEntry,
    now: (req, res) => res.render("now"),
    games: (req, res) => res.render("games"),
};