"use strict";
const fs = require("fs");
const path = require("path");
const sanitizeHtml = require("sanitize-html");
const { nameToColor } = require("../helpers/nameToColor.js");
const { sendToDiscord } = require("../helpers/sendToDiscord.js");

const GUESTBOOK_FILE = path.join(__dirname, "..", "data", "guestbook.json");

// Ensure the file exists
function getGuestbookEntries() {
    try {
        const rawEntries = JSON.parse(fs.readFileSync(GUESTBOOK_FILE, "utf8"));
        if (!Array.isArray(rawEntries)) return [];
        const entries = rawEntries.map(entry => ({
            ...entry,
            color: nameToColor(entry.name)
        }));

        return entries;
    } catch {
        return [];
    }
}

function saveGuestbookEntries(entries) {
    const temporaryFile = `${GUESTBOOK_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(entries.slice(0, 500), null, 2), { mode: 0o600 });
    fs.renameSync(temporaryFile, GUESTBOOK_FILE);
}

function sanitize(input, maxLength) {
    if (typeof input !== "string") return "";
    return sanitizeHtml(input.trim().slice(0, maxLength), {
        allowedTags: [],
        allowedAttributes: {}
    });
}

exports.submitGuestbookEntry = (req, res) => {
    const name = sanitize(req.body.name || "", 100);
    const message = sanitize(req.body.message || "", 1000);

    if (!name || !message) {
        return res.status(400).send("Name and message are required.");
    }

    const newEntry = {
        name,
        message,
        date: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    }

    void sendToDiscord(newEntry);

    const entries = getGuestbookEntries();
    entries.unshift(newEntry);

    saveGuestbookEntries(entries);
    res.redirect("/guestbook");
};

exports.getGuestbookEntries = getGuestbookEntries;
