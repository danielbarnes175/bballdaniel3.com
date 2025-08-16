const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');
const Handlebars = require('handlebars');

// Configure marked (lightweight config; can extend if needed)
marked.setOptions({
    breaks: true
});

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
        if (!text) return '';
        const raw = marked.parse(text.toString());
        const clean = sanitizeHtml(raw, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img', 'span']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ['src', 'alt', 'title']
            }
        });
        return new Handlebars.SafeString(clean);
    }
};