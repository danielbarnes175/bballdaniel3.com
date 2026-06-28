// List of projects to display
const projects = [
    {
        name: "bballdaniel3.com",
        description: "This entire website is open source!",
        language: "Javascript",
        url: "https://github.com/danielbarnes175/bballdaniel3.com"
    },
    {
        name: "Frame By Frame",
        description: "A simple animation program for creating frame by frame animations",
        language: "C#",
        url: "https://github.com/danielbarnes175/FrameByFrame"
    },
    {
        name: "Minecraft Running Shoes Mod",
        description: "A mod for Minecraft that adds running shoes",
        language: "Java",
        url: "https://github.com/danielbarnes175/MinecraftRunningShoesMod"
    },
    {
        name: "OpenCV Face Tracker",
        description: "A camera that uses OpenCV to recognize and follow a face. Created for HackISU 2018",
        language: "Java",
        url: "https://github.com/danielbarnes175/OpenCV-Face-Tracker"
    },
];

exports.getProjects = (req, res) => {
    res.render("projects", { projects });
};
