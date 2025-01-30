const options = {
    animateHistoryBrowsing: true,
    linkSelector: 'a[href^="' +
    window.location.origin +
    '"]:not([data-no-swup]):not([target="_blank"]), a[href^="/"]:not([data-no-swup]):not([target="_blank"]), a[href^="#"]:not([data-no-swup]):not([target="_blank"])'
}

const swup = new Swup(options);