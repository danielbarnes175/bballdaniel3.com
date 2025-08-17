// List of projects to display
const projects = [
    {
        name: "bballdaniel3.com",
        description: "This entire website is open source!",
        language: "Javascript",
        url: "https://github.com/danielbarnes175/bballdaniel3.com"
    },
    {
        name: "BossFightBattlegrounds",
        description: "Side Scrolling Multiplayer Action Game that won #1 best project of 78 in Com S 309 Fall 2019 at Iowa State University.",
        language: "C#",
        url: "https://github.com/danielbarnes175/BossFightBattlegrounds"
    },
    {
        name: "DanielBot",
        description: "A discord bot written in Javascript utilizing mainly Node.JS and Discord.JS",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/DanielBot"
    },
    {
        name: "FrameByFrame",
        description: "A simple animation program for creating frame by frame animations",
        language: "C#",
        url: "https://github.com/danielbarnes175/FrameByFrame"
    },
    {
        name: "happydaytwitterbot",
        description: "A (now defunct) Twitter bot that randomly generates what's special about the day.",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/happydaytwitterbot"
    },
    {
        name: "MinecraftRunningShoesMod",
        description: "A mod for Minecraft that adds running shoes.",
        language: "Java",
        url: "https://github.com/danielbarnes175/MinecraftRunningShoesMod"
    },
    {
        name: "OpenCV-Face-Tracker",
        description: "A camera that uses OpenCV to recognize and follow a face. Created for HackISU 2018.",
        language: "Java",
        url: "https://github.com/danielbarnes175/OpenCV-Face-Tracker"
    },
    {
        name: "RulersLegacy",
        description: "A ruler simulation game made with React Native and Expo (proof of concept)",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/RulersLegacy"
    },
    {
        name: "SonsOfOrdson",
        description: "A SugarCube 2 Twine game set in the magical world of Gerajyo",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/SonsOfOrdson"
    },
    {
        name: "torn-scripts",
        description: "Series of Node.js scripts for Torn, an online crime based MMO. If you have never heard of it and would like to play, please use my referral code: https://www.torn.com/1605235",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/torn-scripts"
    },
    {
        name: "Amazon Alexa E-Commerce Interface (Internship)",
        description: "A repo containing the project that I worked on for my 10 week internship at Zoro.com",
        language: "JavaScript",
        url: "https://github.com/danielbarnes175/Zoro.com-Internship"
    }
];

exports.getProjects = (req, res) => {
    res.render("projects", { projects });
};
