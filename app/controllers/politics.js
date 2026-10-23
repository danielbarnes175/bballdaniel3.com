"use strict";

const politics = require("../data/politics");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
});

const getPolitics = (req, res) => {
    const categories = politics.categories.map((category) => ({
        ...category,
        beliefs: category.beliefs.map((item) => ({
            ...item,
            reviewedLabel: dateFormatter.format(new Date(`${item.reviewedDate}T00:00:00Z`))
        }))
    }));

    res.render("politics", {
        title: "Politics | bballdaniel3.com",
        categories
    });
};

module.exports = { getPolitics };
