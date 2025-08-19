"use strict";

const guestbookController = require("./guestbook");
const projectsController = require("./projects");
const { getBlog, getPost } = require("./blog");
const { getTag } = require("./tags")

module.exports = {
    home: (req, res) => res.render("index"),
    about: (req, res) => res.render("about"),
    blog: getBlog,
    post: getPost,
    tag: getTag,
    privacy: (req, res) => res.render("privacy"),
    guestbook: (req, res) => {
        res.render("guestbook", { entries: guestbookController.getGuestbookEntries() });
    },
    submitGuestbookEntry: guestbookController.submitGuestbookEntry,
    now: (req, res) => res.render("now"),
    games: (req, res) => res.render("games"),
    ifGames: (req, res) => res.render("ifGames"),
    projects: (req, res) => projectsController.getProjects(req, res)
};
