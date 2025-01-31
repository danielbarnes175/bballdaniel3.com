const express = require("express");
const { engine } = require("express-handlebars");
const fs = require("fs").promises;
const path = require("path");
const marked = require("marked");
const matter = require("gray-matter");
const Handlebars = require("handlebars");
const helpers = require('./helpers/handlebars.js');
const routes = require("./routes/index");

const app = express();

const viewsPath = path.join(__dirname, "views");
const postsPath = path.join(viewsPath, "posts");

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

app.use(express.static(path.join(__dirname, "public")));

routes(app);

app.listen(1234, () => console.log("Server running on port 1234"));
