const dotenv = require("dotenv");
const express = require("express");
const { engine } = require("express-handlebars");
const favicon = require('serve-favicon');
const Handlebars = require("handlebars");
const helmet = require("helmet");
const http = require('http');
const crypto = require('crypto');
const path = require("path");
const socketio = require('socket.io');
const helpers = require('./helpers/handlebars.js');
const { logRequest } = require('./services/loggingService.js');
const routes = require("./routes/index");
const { getStoryToken } = require('./helpers/security');
const { canJoinSocketRoom } = require('./controllers/storyGame');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const viewsPath = path.join(__dirname, "views");

app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
            scriptSrcAttr: ["'none'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    helpers
}));
Object.keys(helpers).forEach((key) => {
    Handlebars.registerHelper(key, helpers[key]);
});

app.set("view engine", "hbs");
app.set("views", viewsPath);
app.set('io', io);

// Mastodon / Fediverse redirects
app.get('/.well-known/webfinger', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.redirect(301, `https://mastodon.bballdaniel3.com${req.originalUrl}`);
});

app.get('/.well-known/host-meta', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.redirect(301, `https://mastodon.bballdaniel3.com${req.originalUrl}`);
});

app.get('/.well-known/nodeinfo', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.redirect(301, `https://mastodon.bballdaniel3.com${req.originalUrl}`);
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomCode) => {
        const code = String(roomCode || '').toUpperCase();
        if (canJoinSocketRoom(code, getStoryToken(socket.request, code))) socket.join(code);
    });

    socket.on('disconnect', () => {
    });
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Logging middleware
app.use(function (req, res, next) {
    res.on("finish", function () {
        logRequest(req, res);
    });

    next();
});

routes(app);

app.use((err, req, res, next) => {
    console.error('Unhandled request error:', err && err.message ? err.message : err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).send(err.status === 413 ? 'Request too large' : 'Internal server error');
});

server.listen(1234, () => console.log("Server running on port 1234"));
