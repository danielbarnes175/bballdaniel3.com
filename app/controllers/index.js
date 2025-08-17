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
        let scripts = [{ script: 'https://www.google.com/recaptcha/api.js?render=6Le7JK0bAAAAADV3P6ZDDOXJHJImPrefIVghEs_7' }];
        res.render("guestbook", { entries: guestbookController.getGuestbookEntries(), scripts: scripts });
    },
    submitGuestbookEntry: guestbookController.submitGuestbookEntry,
    now: (req, res) => res.render("now"),
    games: (req, res) => res.render("games"),
    ifGames: (req, res) => res.render("ifGames"),
    projects: (req, res) => projectsController.getProjects(req, res)
};
