// Summoning feature script
(function () {
    const isHome = () => location.pathname === '/' || location.pathname === '';

    function initSummoning() {
        if (!isHome()) return;
        const container = document.getElementById('summon-container');
        const btn = document.getElementById('summon-btn');
        const cat = document.getElementById('summon-cat');
        const audio = document.getElementById('summon-audio');

        if (!container || !btn || !cat || !audio) return;

        let started = false;
        let fadeTimer = null;
        let fadeComplete = false;

        function stopFade() {
            if (fadeTimer) {
                clearInterval(fadeTimer);
                fadeTimer = null;
            }
        }

        function startRave() {
            if (fadeComplete) return;
            fadeComplete = true;
            // Center and enlarge the cat
            cat.classList.add('center-stage');
            // Begin spinning
            cat.classList.add('spin');
            // Flashing background
            document.body.classList.add('rave-bg');
        }

        function cleanup() {
            // stop any fade and remove rave effect
            stopFade();
            document.body.classList.remove('rave-bg');
            cat.classList.remove('spin');
            // fade out visuals then remove
            cat.classList.add('fade-out');
            container.classList.add('fade-out');
            setTimeout(() => {
                container.remove();
            }, 600);
        }

        function startSummoning() {
            if (started) return;
            started = true;

            // show and animate cat
            cat.classList.remove('hidden');
            // delay a tick to allow transition
            requestAnimationFrame(() => {
                cat.classList.add('rise');
            });

            // set initial volume (0) and fade to max 0.3 over 33s
            try { audio.volume = 0.0; } catch (_) { }

            const targetVol = 0.3;
            const fadeDurationMs = 33000; // 33 seconds
            const stepMs = 100; // update every 100ms
            const steps = Math.max(1, Math.floor(fadeDurationMs / stepMs));
            const increment = targetVol / steps;

            // play audio
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    // If autoplay is blocked, require second click
                });
            }

            // begin fade-in ramp
            stopFade();
            fadeTimer = setInterval(() => {
                try {
                    const next = Math.min(targetVol, (audio.volume || 0) + increment);
                    audio.volume = next;
                    if (next >= targetVol) {
                        stopFade();
                        startRave();
                    }
                } catch (_) {
                    stopFade();
                }
            }, stepMs);

            audio.addEventListener('ended', () => {
                cleanup();
            }, { once: true });
        }

        btn.addEventListener('click', startSummoning, { once: true });
    }

    // Init on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initSummoning);

    // Re-init on Swup page change if present
    if (window.addEventListener) {
        document.addEventListener('swup:contentReplaced', initSummoning);
    }
})();
