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
        new SwupScriptsPlugin()
    ]
};

const swup = new Swup(options);
