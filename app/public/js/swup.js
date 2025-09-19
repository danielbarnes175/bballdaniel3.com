const options = {
    animateHistoryBrowsing: true,
    plugins: [
        new SwupFormsPlugin(),
        new SwupHeadPlugin({
            awaitAssets: true
        }),
        new SwupScrollPlugin({
            animateScroll: true,
            doScrollingRightAway: true,
            scrollContainers: `[data-swup-scroll-container]`,
        }),
        new SwupScriptsPlugin(),
    ],
};

const swup = new Swup(options);

// Bridge Swup v4 hooks to legacy DOM events
const dispatch = (name, detail) => {
    try {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (_) {
        // Fallback for very old browsers
        const evt = document.createEvent('Event');
        evt.initEvent(name, true, true);
        document.dispatchEvent(evt);
    }
};

// Fire after new content is in the DOM (good point for re-initializing UI)
swup.hooks.on('page:view', (ctx) => {
    dispatch('swup:contentReplaced', ctx);
    dispatch('swup:pageView', ctx);
});
