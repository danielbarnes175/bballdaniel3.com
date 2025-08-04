module.exports = {
    eq: function (a, b) {
        return a === b
    },
    ifeq: function (a, b, options) {
        if (a === b) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    add: function (a, b) {
        console.log("Adding", a, b);
        return a + b;
    },
}