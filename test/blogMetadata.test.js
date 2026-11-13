"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const blogController = require("../app/controllers/blog");

test("blog post controller provides social metadata", async () => {
    let renderedView;
    let renderedContext;
    const response = {
        render(view, context) {
            renderedView = view;
            renderedContext = context;
        },
        status() {
            return this;
        },
        send() {}
    };

    await blogController.getPost(
        { params: { post: "homelab-adventures" } },
        response
    );

    assert.equal(renderedView, "blogPost");
    assert.ok(renderedContext.description);
    assert.equal(
        renderedContext.canonicalUrl,
        "https://bballdaniel3.com/blog/homelab-adventures"
    );
});

test("blog layout renders description and Open Graph tags", () => {
    const layout = fs.readFileSync(
        path.join(__dirname, "../app/views/layouts/blog.hbs"),
        "utf8"
    );

    assert.match(layout, /<meta name="description" content="{{description}}">/);
    assert.match(layout, /<meta property="og:title" content="{{title}}">/);
    assert.match(layout, /<meta property="og:description" content="{{description}}">/);
    assert.match(layout, /<meta property="og:url" content="{{canonicalUrl}}">/);
});
