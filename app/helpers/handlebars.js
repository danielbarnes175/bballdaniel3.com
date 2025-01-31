console.log("✅ Handlebars helpers loaded!");

module.exports = {
    eq: function (a, b) {
        console.log(`Comparing ${a} and ${b}`);
        return a === b
    },
}