const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const postsPath = path.join(__dirname, "../views/posts");

exports.getTag = async (req, res) => {
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
        console.error("Error loading tags:", error);
        res.status(500).send("Error loading tags");
    }
};
