const fs = require("fs").promises;
const path = require("path");
const { renderMarkdown } = require("../helpers/sanitizeMarkdown");
const matter = require("gray-matter");
const { getBlogList } = require("../helpers/getBlogList");

const postsPath = path.join(__dirname, "../views/posts");

exports.getBlog = async (req, res) => {
    try {
        const { posts, tagCounts } = await getBlogList();
        res.render("blog", { title: "Blog", posts, tags: tagCounts });
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
        const content = renderMarkdown(parsed.content);

        res.render("blogPost", {
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
