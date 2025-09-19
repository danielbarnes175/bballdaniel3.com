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
        })
    ]
};

const swup = new Swup(options);

swup.hooks.on('link:click', (e) => {
    console.log('link click');
    swup.scrollTo(0, true);
});

swup.hooks.on('history:popstate', () => {
    console.log('popstate');
});

swup.hooks.on('visit:start', (visit) => {
    console.log(visit);
});

swup.hooks.on('scroll:start', () => console.log('Swup started scrolling'));
swup.hooks.on('scroll:end', () => console.log('Swup finished scrolling'));
