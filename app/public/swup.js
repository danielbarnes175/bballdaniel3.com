const options = {
    animateHistoryBrowsing: true,
    linkSelector: 'a[href^="' +
    window.location.origin +
    '"]:not([data-no-swup]):not([target="_blank"]), a[href^="/"]:not([data-no-swup]):not([target="_blank"]), a[href^="#"]:not([data-no-swup]):not([target="_blank"])',
    plugins: [new SwupFormsPlugin()]
}

const swup = new Swup(options);