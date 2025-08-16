const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

marked.setOptions({
    breaks: true
});

const ADD_TAGS = ['img', 'h1', 'h2', 'span'];
const ADD_ATTR = ['alt', 'title'];

function sanitizeMarkdownHtml(html) {
    return DOMPurify.sanitize(html, {
        ADD_TAGS,
        ADD_ATTR
    });
}

function renderMarkdown(markdownText) {
    if (!markdownText) return '';
    const raw = marked.parse(markdownText.toString());
    return sanitizeMarkdownHtml(raw);
}

module.exports = {
    renderMarkdown,
    sanitizeMarkdownHtml
};
