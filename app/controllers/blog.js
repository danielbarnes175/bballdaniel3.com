const fs = require("fs").promises;
const path = require("path");
const { renderMarkdown } = require("../helpers/sanitizeMarkdown");
const matter = require("gray-matter");
const { getBlogList, getExcerpt } = require("../helpers/getBlogList");

const postsPath = path.join(__dirname, "../views/posts");
const siteUrl = "https://bballdaniel3.com";

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
        const slug = req.params.post;
        if (!/^[a-z0-9-]+$/.test(slug)) return res.status(404).send("Post not found");
        const postFile = path.join(postsPath, `${slug}.md`);
        const data = await fs.readFile(postFile, "utf8");

        const parsed = matter(data);
        const content = renderMarkdown(parsed.content);

        res.render("blogPost", {
            title: parsed.data.title || "Blog Post",
            description: parsed.data.description || getExcerpt(parsed.content),
            date: parsed.data.date || "Unknown date",
            tags: parsed.data.tags || [],
            content,
            canonicalUrl: `${siteUrl}/blog/${encodeURIComponent(req.params.post)}`,
            layout: "blog"
        });
    } catch (error) {
        console.error("Error loading post:", error);
        res.status(404).send("Post not found");
    }
};
