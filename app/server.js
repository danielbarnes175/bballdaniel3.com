const express = require("express");
const { engine } = require("express-handlebars");
const fs = require("fs").promises;
const path = require("path");
const marked = require("marked");
const matter = require("gray-matter");
const Handlebars = require("handlebars");
const dotenv = require("dotenv");
const helmet = require("helmet");
const helpers = require('./helpers/handlebars.js');
const routes = require("./routes/index");
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const viewsPath = path.join(__dirname, "views");
const postsPath = path.join(viewsPath, "posts");

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
            connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
        }
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

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // For JSON body parsing
app.use(express.urlencoded({ extended: true }));

routes(app);

server.listen(1234, () => console.log("Server running on port 1234"));
