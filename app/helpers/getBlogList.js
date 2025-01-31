const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const postsPath = path.join(__dirname, "../views/posts");

function getExcerpt(content, maxLength = 200) {
    let plainText = content.replace(/[#_*~>]/g, "");
    plainText = plainText.split("\n").find(line => line.trim().length > 0) || "";

    return plainText.length > maxLength
        ? plainText.substring(0, maxLength) + "..."
        : plainText;
}

async function getBlogList() {
    try {
        const files = await fs.readdir(postsPath);
        let tagCounts = {};

        const posts = await Promise.all(
            files
                .filter(file => file.endsWith(".md"))
                .map(async (file) => {
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
                        tags,
                        excerpt: getExcerpt(parsed.content, 200)
                    };
                })
        );

        posts.sort((a, b) => b.date - a.date);

        return { posts, tagCounts };
    } catch (error) {
        console.error("Error loading posts:", error);
        return { posts: [], tagCounts: {} };
    }
}

module.exports = { getBlogList };