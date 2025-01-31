const fs = require("fs").promises;
const path = require("path");
const marked = require("marked");
const matter = require("gray-matter");

const postsPath = path.join(__dirname, "../views/posts");

exports.getHome = async (req, res) => {
    try {
        const files = await fs.readdir(postsPath);
        let tagCounts = {};

        const posts = await Promise.all(
            files
                .filter(file => file.endsWith(".md"))
                .map(async file => {
                    const content = await fs.readFile(path.join(postsPath, file), "utf8");
                    const parsed = matter(content);

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

        posts.sort((a, b) => b.date - a.date);
        res.render("index", { title: "Home", posts, tags: tagCounts });
    } catch (error) {
        console.error("Error loading posts:", error);
        res.status(500).send("Error loading posts");
    }
};

exports.getPost = async (req, res) => {
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
    } catch (error) {
        console.error("Error loading post:", error);
        res.status(404).send("Post not found");
    }
};
