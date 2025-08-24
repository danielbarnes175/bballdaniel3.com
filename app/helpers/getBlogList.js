const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const postsPath = path.join(__dirname, "../views/posts");

function getExcerpt(content, maxLength = 200) {
    // Remove markdown syntax and get a true excerpt of first N visible characters
    let plainText = content
        .replace(/[#_*~>`\[\]()]/g, "") // Remove markdown formatting
        .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image syntax
        .replace(/\[.*?\]\(.*?\)/g, "") // Remove link syntax
        .replace(/\n+/g, " ") // Replace line breaks with spaces
        .trim();

    return plainText.length > maxLength
        ? plainText.substring(0, maxLength).trim() + "..."
        : plainText;
}

async function getBlogList() {
    try {
        const files = await fs.readdir(postsPath);

        const posts = await Promise.all(
            files
                .filter(file => file.endsWith(".md"))
                .map(async (file) => {
                    try {
                        const content = await fs.readFile(path.join(postsPath, file), "utf8");
                        const parsed = matter(content);

                        return {
                            title: parsed.data.title || file.replace(".md", ""),
                            date: parsed.data.date ? new Date(parsed.data.date) : new Date(0),
                            formattedDate: parsed.data.date || "Unknown date",
                            url: `/blog/${file.replace(".md", "")}`,
                            tags: parsed.data.tags || [],
                            excerpt: getExcerpt(parsed.content, 200)
                        };
                    } catch (fileError) {
                        console.error(`[getBlogList] Error processing file ${file}:`, fileError);
                        return null;
                    }
                })
        );

        // Filter out any failed posts
        const validPosts = posts.filter(post => post !== null);
        validPosts.sort((a, b) => b.date - a.date);

        // Calculate tag counts functionally, without mutation
        const tagCounts = validPosts
            .flatMap(post => post.tags)
            .reduce((counts, tag) => {
                counts[tag] = (counts[tag] || 0) + 1;
                return counts;
            }, {});

        return { posts: validPosts, tagCounts };
    } catch (error) {
        console.error("[getBlogList] Error loading posts:", error);
        return { posts: [], tagCounts: {} };
    }
}

module.exports = { getBlogList };
