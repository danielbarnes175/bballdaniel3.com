const { projects } = require('../data/projectsData');

exports.getProjects = (req, res) => {
    try {
        res.render("projects", { projects });
    } catch (error) {
        console.error("[projects.getProjects] Error rendering projects page:", error);
        res.status(500).send("Error loading projects page");
    }
};
