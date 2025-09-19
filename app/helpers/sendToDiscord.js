const axios = require('axios');

function getWebhookUrl() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("Discord webhook URL is not set.");
    return webhookUrl;
}

async function sendToDiscord(entry) {
    const webhookUrl = getWebhookUrl();

    const content = `**New Guestbook Entry**\n**Name**: ${entry.name}\n**Date**: ${entry.date}\n**Message**:\n${entry.message}`;

    try {
        await axios.post(webhookUrl, { content });
    } catch (err) {
        console.error("Failed to send to Discord:", err.message);
    }
}

// Utility: split long text to multiple Discord-safe chunks
function splitForDiscord(text, maxLen) {
    const limit = maxLen || 1900; // leave headroom for headers
    const chunks = [];
    let remaining = text || '';

    while (remaining.length > limit) {
        let idx = remaining.lastIndexOf('\n', limit);
        if (idx <= 0) idx = limit; // hard cut if no newline
        chunks.push(remaining.slice(0, idx));
        remaining = remaining.slice(idx);
    }

    if (remaining.length) chunks.push(remaining);
    return chunks;
}

async function sendStoryGameToDiscord(payload) {
    try {
        const webhookUrl = getWebhookUrl();
        const { code, stories } = payload || {};
        if (!code || !Array.isArray(stories)) return;

        // Header message
        const header = `Story Game Finished (Code: ${code})\nTotal stories: ${stories.length}`;
        await axios.post(webhookUrl, { content: header });

        // Post each story separately to avoid hitting content limits
        for (let i = 0; i < stories.length; i++) {
            const story = stories[i] || {};
            const authors = Array.isArray(story.authors) && story.authors.length
                ? story.authors.join(' → ')
                : 'Unknown';
            const title = `Story ${i + 1} — Authors: ${authors}`;

            const content = String(story.content || '');
            const parts = splitForDiscord(content, 1800);

            if (parts.length === 0) {
                await axios.post(webhookUrl, { content: `**${title}**\n(No content)` });
                continue;
            }

            // First chunk includes the title
            await axios.post(webhookUrl, { content: `**${title}**\n${parts[0]}` });

            // Remaining chunks as follow-ups
            for (let p = 1; p < parts.length; p++) {
                await axios.post(webhookUrl, { content: parts[p] });
            }
        }
    } catch (err) {
        console.error("Failed to send story game results to Discord:", err.message);
    }
}

module.exports = {
    sendToDiscord,
    sendStoryGameToDiscord
};
