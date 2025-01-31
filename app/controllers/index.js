"use strict";

module.exports = {
    index: require("./blog").getHome,
    about: (req, res) => res.render("about"),
    blog: require("./blog").getPost,
    tag: require("./tags").getTag,
    privacy: (req, res) => res.render("privacy"),
};
