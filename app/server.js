const express = require("express");
const { engine } = require("express-handlebars");
const fs = require("fs").promises;
const path = require("path");
const marked = require("marked");
const matter = require("gray-matter");
const Handlebars = require("handlebars");
const helpers = require('./helpers/handlebars.js');

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

app.get("/", async (req, res) => {
    try {
        const files = await fs.readdir(postsPath);
        let tagCounts = {};

        const posts = await Promise.all(
            files
                .filter(file => file.endsWith(".md"))
                .map(async (file) => {
                    const content = await fs.readFile(path.join(postsPath, file), "utf8");
                    const parsed = matter(content);

                    // Count tags
                    const tags = parsed.data.tags || [];
                    tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });

                    return {
                        title: parsed.data.title || file.replace(".md", ""),
                        date: parsed.data.date ? new Date(parsed.data.date) : new Date(0),
                        formattedDate: parsed.data.date || "Unknown date",
                        url: `/blog/${file.replace(".md", "")}`,
                        tags
                    };
                })
        );

        // Sort posts by date (newest first)
        posts.sort((a, b) => b.date - a.date);

        res.render("index", { title: "Home", posts, tags: tagCounts });
    } catch (err) {
        console.error("Error loading posts:", err);
        res.status(500).send("Error loading posts");
    }
});

app.get("/blog/:post", async (req, res) => {
    try {
        const postFile = path.join(postsPath, `${req.params.post}.md`);
        const data = await fs.readFile(postFile, "utf8");
        
        const parsed = matter(data);
        const content = marked.parse(parsed.content);

        res.render("blog", {
            title: parsed.data.title || "Blog Post",
            date: parsed.data.date || "Unknown date",
            tags: parsed.data.tags || [],
            content,
            layout: "blog"
        });
    } catch (err) {
        console.error("Post not found:", err);
        res.status(404).send("Post not found");
    }
});

app.get("/tag/:tag", async (req, res) => {
    try {
        const tag = req.params.tag.toLowerCase();
        const files = await fs.readdir(postsPath);
        let tagCounts = {};

        const filteredPosts = (
            await Promise.all(
                files
                    .filter(file => file.endsWith(".md"))
                    .map(async file => {
                        const content = await fs.readFile(path.join(postsPath, file), "utf8");
                        const parsed = matter(content);

                        const tags = parsed.data.tags || [];
                        tags.forEach(t => {
                            tagCounts[t] = (tagCounts[t] || 0) + 1;
                        });

                        return {
                            title: parsed.data.title || file.replace(".md", ""),
                            url: `/blog/${file.replace(".md", "")}`,
                            tags
                        };
                    })
            )
        ).filter(post => post.tags.some(t => t.toLowerCase() === tag));

        res.render("tag", {
            title: `Posts tagged: ${tag}`,
            tag,
            posts: filteredPosts,
            tags: tagCounts
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading tags");
    }
});

app.listen(1234, () => console.log("Server running on port 1234"));
