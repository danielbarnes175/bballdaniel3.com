const rules = require('../data/medievalRules.json');

function convertToMedieval(text) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    let result = text;

    // Context rules first
    for (const rule of rules.contextRules) {
        for (const word of rule.words) {
            const regex = new RegExp(
                `\\b${escapeRegex(rule.prev)}\\s+${escapeRegex(word)}\\b`,
                "gi"
            );

            result = result.replace(regex, match => {
                if (
                    rule.chance &&
                    Math.floor(Math.random() * rule.chance) !== 0
                ) {
                    return match;
                }

                return pick(rule.replacements);
            });
        }
    }

    // Single pass token replacement
    result = result.replace(/\b[\w']+\b/g, token => {
        const rule = rules.wordMap[token.toLowerCase()];

        if (!rule) return token;

        if (
            rule.chance &&
            Math.floor(Math.random() * rule.chance) !== 0
        ) {
            return token;
        }

        let replacement = pick(rule.replacements);

        if (
            token[0] === token[0].toUpperCase()
        ) {
            replacement =
                replacement.charAt(0).toUpperCase() +
                replacement.slice(1);
        }

        return replacement;
    });

    // Prefix
    if (
        rules.prefixes.length &&
        Math.random() < 0.25
    ) {
        result = pick(rules.prefixes) + result;
    }

    // Suffix
    if (
        rules.suffixes.length &&
        Math.random() < 0.15
    ) {
        result += " " + pick(rules.suffixes);
    }

    // Macro expansion
    result = result.replace(
        /&([a-zA-Z_]+)/g,
        (_, key) => {
            const values = rules.macros[key];

            if (!values?.length) {
                return key;
            }

            return pick(values);
        }
    );

    return result;
}

function escapeRegex(str) {
    return str.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

exports.convertToMedieval = convertToMedieval;
