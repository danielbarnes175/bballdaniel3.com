const axios = require('axios');

module.exports = {
    logRequest: async function (req, res) {
        let current_datetime = new Date();
        let formatted_date =
            current_datetime.getFullYear() +
            "-" +
            (current_datetime.getMonth() + 1) +
            "-" +
            current_datetime.getDate() +
            " " +
            current_datetime.getHours() +
            ":" +
            current_datetime.getMinutes() +
            ":" +
            current_datetime.getSeconds();

        let method = req.method;
        let url = req.url;
        let status = res.statusCode;
        let ip = req.headers['x-forwarded-for']?.split(',').shift() || req.ip || req.connection?.remoteAddress;

        let logMsg = `[${formatted_date}] (IP: ${ip}): ${status} ${method} ${url} `;
        console.log(logMsg);

        // Discord Webhook Log
        let log = {
            "embeds": [
                {
                    "description": `**[${formatted_date}]** [${ip}]:\n **${status} ${method} ${url}**`,
                    "color": 15258703,
                }
            ]
        }

        try {
            if (url !== "/health") {
                await axios.post(process.env.DISCORD_REQUESTS_WEBHOOK_URL, log);
            }
        } catch (error) {
            console.error("Error exporting request log to Discord:", error);
        }
    },
    logError: async (error) => {
        // Discord Webhook Log
        log = {
            "embeds": [
                {
                    "title": error.message,
                    "description": `**${error}**`,
                    "color": 16711680,
                }
            ]
        }

        try {
            await axios.post(process.env.DISCORD_REQUESTS_WEBHOOK_URL, log);
        } catch (error) {
            console.error("Error exporting error log to Discord:", error);
        }
    }
}