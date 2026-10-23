"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const politics = require("../app/data/politics");
const politicsController = require("../app/controllers/politics");

test("politics data contains 51 complete, uniquely addressable beliefs", () => {
    const categoryIds = new Set();
    const beliefIds = new Set();
    const allBeliefs = politics.categories.flatMap((category) => {
        assert.match(category.id, /^[a-z0-9-]+$/);
        assert.ok(category.title.trim());
        assert.equal(categoryIds.has(category.id), false, `duplicate category id: ${category.id}`);
        categoryIds.add(category.id);
        return category.beliefs;
    });

    assert.equal(allBeliefs.length, 51);

    for (const item of allBeliefs) {
        assert.match(item.id, /^[a-z0-9-]+$/);
        assert.equal(beliefIds.has(item.id), false, `duplicate belief id: ${item.id}`);
        beliefIds.add(item.id);
        assert.ok(item.title.trim());
        assert.ok(item.takeaway.trim());
        assert.ok(item.details.trim());
        assert.equal(item.reviewedDate, "2026-08-30");
        assert.equal(Number.isNaN(Date.parse(`${item.reviewedDate}T00:00:00Z`)), false);
    }
});

test("politics controller renders ordered data with readable dates", () => {
    let renderedView;
    let renderedContext;
    const response = {
        render(view, context) {
            renderedView = view;
            renderedContext = context;
        }
    };

    politicsController.getPolitics({}, response);

    assert.equal(renderedView, "politics");
    assert.equal(renderedContext.title, "Politics | bballdaniel3.com");
    assert.equal(renderedContext.categories[0].id, "democracy");
    assert.equal(renderedContext.categories.at(-1).id, "social-support");
    assert.equal(renderedContext.categories[0].beliefs[0].reviewedLabel, "August 30, 2026");
});

test("route registry exposes GET /politics through the politics controller", () => {
    const routes = fs.readFileSync(path.join(__dirname, "../app/routes/index.js"), "utf8");

    assert.match(routes, /app\.route\('\/politics'\)\s*\.get\(controller\.politics\)/);
});

test("politics view provides native disclosure cards and the navbar stays unchanged", () => {
    const view = fs.readFileSync(path.join(__dirname, "../app/views/politics.hbs"), "utf8");
    const navbar = fs.readFileSync(path.join(__dirname, "../app/views/partials/navbar.hbs"), "utf8");

    assert.match(view, /<details class="politics-belief"/);
    assert.match(view, /<nav class="politics-index"/);
    assert.match(view, /<time datetime="{{reviewedDate}}">/);
    assert.doesNotMatch(navbar, /\/politics/);
});
