const axios = require('axios');

module.exports = {
    sendToDiscord: (entry) => {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("Discord webhook URL is not set.");
    
        const content = `**New Guestbook Entry**
        **Name**: ${entry.name}
        **Date**: ${entry.date}
        **Message**:\n${entry.message}`;
    
        axios.post(webhookUrl, {
            content
        }).catch(err => {
            console.error("Failed to send to Discord:", err.message);
        });
  }
}