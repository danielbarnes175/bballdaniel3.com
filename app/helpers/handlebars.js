const Handlebars = require('handlebars');
const { renderMarkdown } = require('./sanitizeMarkdown');

module.exports = {
    eq: function (a, b) {
        return a === b;
    },
    ifeq: function (a, b, options) {
        if (a === b) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    add: function (a, b) {
        return a + b;
    },
    currentYear: function () {
        return new Date().getFullYear();
    },
    markdown: function (text) {
        const clean = renderMarkdown(text);
        return new Handlebars.SafeString(clean);
    },
    JSONstringify: function (context) {
        try {
            return JSON.stringify(context || [])
                .replace(/</g, '\\u003c')
                .replace(/\u2028/g, '\\u2028')
                .replace(/\u2029/g, '\\u2029');
        } catch (e) {
            return '[]';
        }
    },
    includes: function (arr, item) {
        if (!Array.isArray(arr)) return false;
        return arr.includes(item);
    }
};
