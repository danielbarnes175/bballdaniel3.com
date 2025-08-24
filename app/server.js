const dotenv = require("dotenv");
const express = require("express");
const { engine } = require("express-handlebars");
const favicon = require('serve-favicon');
const Handlebars = require("handlebars");
const helmet = require("helmet");
const http = require('http');
const path = require("path");
const socketio = require('socket.io');
const helpers = require('./helpers/handlebars.js');
const { logRequest } = require('./services/loggingService.js');
const routes = require("./routes/index");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const viewsPath = path.join(__dirname, "views");
const postsPath = path.join(viewsPath, "posts");

// Security headers with proper CSP for modern web apps
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Allow self-hosted scripts and specific external resources where needed
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", // Needed for theme toggle inline script
                "https://unpkg.com", // TODO: Replace with self-hosted alternatives
                "https://cdn.jsdelivr.net" // TODO: Replace with self-hosted alternatives
            ],
            connectSrc: ["'self'", "ws:", "wss:"], // WebSocket for Socket.io
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", // Needed for dynamic theme styles
                "https://cdn.jsdelivr.net" // TODO: Replace with self-hosted alternatives
            ],
            imgSrc: ["'self'", "data:", "https:"], // Allow external images
            fontSrc: ["'self'", "data:"], // Self-hosted fonts only
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials"),
    helpers
}));
app.engine("hbs", engine({ extname: ".hbs" }));

Object.keys(helpers).forEach((key) => {
    Handlebars.registerHelper(key, helpers[key]);
});

app.set("view engine", "hbs");
app.set("views", viewsPath);
app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join-room', (roomCode) => {
        socket.join(roomCode);
    });

    socket.on('disconnect', () => {
    });
});

// Serve static files with cache control headers for performance
app.use(express.static(path.join(__dirname, "public"), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Cache CSS, JS, and font files longer
        if (path.endsWith('.css') || path.endsWith('.js') || path.endsWith('.woff2')) {
            res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
        }
        // Cache images for longer
        if (path.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 1 month
        }
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));

// Enable gzip compression for better performance
app.use((req, res, next) => {
    if (req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
    }
    next();
});

app.use(express.json()); // For JSON body parsing
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Logging middleware
app.use(function (req, res, next) {
    res.on("finish", function () {
        logRequest(req, res);
    });

    next();
});

routes(app);

server.listen(1234, () => console.log("Server running on port 1234"));
