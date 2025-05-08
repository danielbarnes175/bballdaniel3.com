"use strict";
const fs = require("fs");
const path = require("path");
const sanitizeHtml = require("sanitize-html");

const GUESTBOOK_FILE = path.join(__dirname, "..", "data", "guestbook.json");

// Ensure the file exists
function getGuestbookEntries() {
    try {
        return JSON.parse(fs.readFileSync(GUESTBOOK_FILE, "utf8"));
    } catch {
        return [];
    }
}

function saveGuestbookEntries(entries) {
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(entries, null, 2));
}

function sanitize(input, maxLength) {
    return sanitizeHtml(input.trim().slice(0, maxLength), {
        allowedTags: [],
        allowedAttributes: {}
    });
}

exports.getGuestbookEntries = getGuestbookEntries;

exports.submitGuestbookEntry = (req, res) => {
    const name = sanitize(req.body.name || "", 100);
    const message = sanitize(req.body.message || "", 1000);

    if (!name || !message) {
        return res.status(400).send("Name and message are required.");
    }

    const entries = getGuestbookEntries();
    entries.unshift({
        name,
        message,
        date: new Date().toLocaleString()
    });

    saveGuestbookEntries(entries);
    res.redirect("/guestbook");
};
