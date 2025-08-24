const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

marked.setOptions({
    breaks: true
});

// Allowed HTML tags for markdown rendering on the blog
// - Standard text formatting: p, strong, em, u, s, del, ins
// - Headers: h1, h2, h3, h4, h5, h6 (for document structure)
// - Lists: ul, ol, li (for organized content)  
// - Links: a (for external references and internal navigation)
// - Code: code, pre (for code snippets and examples)
// - Media: img (for images in blog posts)
// - Misc: br, hr, blockquote, span (for layout and quotes)
const ADD_TAGS = [
    'p', 'strong', 'em', 'u', 's', 'del', 'ins',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'code', 'pre',
    'img', 'br', 'hr', 'blockquote', 'span'
];

// Allowed HTML attributes for markdown rendering
// - href: for links (a tags)
// - src, alt, title: for images (img tags)  
// - class: for styling (various tags)
const ADD_ATTR = ['href', 'src', 'alt', 'title', 'class'];

function sanitizeMarkdownHtml(html) {
    try {
        return DOMPurify.sanitize(html, {
            ADD_TAGS,
            ADD_ATTR
        });
    } catch (error) {
        console.error('[sanitizeMarkdown.sanitizeMarkdownHtml] Error sanitizing HTML:', error);
        return ''; // Return empty string on error to prevent XSS
    }
}

function renderMarkdown(markdownText) {
    if (!markdownText) return '';
    
    try {
        const raw = marked.parse(markdownText.toString());
        return sanitizeMarkdownHtml(raw);
    } catch (error) {
        console.error('[sanitizeMarkdown.renderMarkdown] Error rendering markdown:', error);
        return ''; // Return empty string on error
    }
}

module.exports = {
    renderMarkdown,
    sanitizeMarkdownHtml
};
