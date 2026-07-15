const writingPrompts = [
    "Write about a time you overcame a challenge.",
    "Describe your favorite place in detail.",
    "What is your biggest dream and how do you plan to achieve it?",
    "Write a letter to your future self.",
    "If you could have dinner with any historical figure, who would it be and why?"
];

/**
 * Return a random prompt from the story game's prompt list.
 *
 * The random function is injectable to make the helper deterministic in tests.
 */
function getWritingPrompt(random = Math.random) {
    const promptIndex = Math.floor(random() * writingPrompts.length);
    return writingPrompts[promptIndex];
}

module.exports = { getWritingPrompt, writingPrompts };
