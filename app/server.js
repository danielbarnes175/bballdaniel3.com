const express = require("express");
const { engine } = require("express-handlebars");
const fs = require("fs");
const path = require("path");
const marked = require("marked");

const app = express();
const viewsPath = path.join(__dirname, "views");
const postsPath = path.join(viewsPath, "posts");

app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials")
}));
app.engine("hbs", engine({ extname: ".hbs" }));

app.set("view engine", "hbs");
app.set("views", viewsPath);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    fs.readdir(postsPath, (err, files) => {
        if (err) return res.status(500).send("Error loading posts");

        // Filter only .md files and remove ".md" extension
        const posts = files
            .filter(file => file.endsWith(".md"))
            .map(file => ({
                title: file.replace(".md", ""), // Use filename as title
                url: `/blog/${file.replace(".md", "")}` // Link to blog post
            }));

        res.render("index", { title: "Home", posts });
    });
});

app.get("/blog/:post", (req, res) => {
    const postFile = path.join(__dirname, "views", "posts", `${req.params.post}.md`);

    fs.readFile(postFile, "utf8", (err, data) => {
        if (err) return res.status(404).send("Post not found");
        
        const content = marked.parse(data);
        res.render("blog", { title: "My first post", content, layout: "blog" });
    });
});

app.listen(1234, () => console.log("Server running on port 1234"));
