const { getBlogList } = require("../helpers/getBlogList");

exports.getTag = async (req, res) => {
    try {
        const tag = req.params.tag.toLowerCase();
        const { posts, tagCounts } = await getBlogList();

        const filteredPosts = posts.filter(post => 
            post.tags.some(t => t.toLowerCase() === tag)
        );

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
