"use strict";

module.exports = {
    home: (req, res) => res.render("index"),
    about: (req, res) => res.render("about"),
    blog: require("./blog").getBlog,
    post: require("./blog").getPost,
    tag: require("./tags").getTag,
    privacy: (req, res) => res.render("privacy"),
};
