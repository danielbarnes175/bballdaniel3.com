// Summoning feature script
(function () {
    const isHome = () => location.pathname === '/' || location.pathname === '';
    const isDesktop = () => window.matchMedia('(min-width: 751px)').matches;

    function initSummoning() {
        if (!isHome() || !isDesktop()) return;
        const container = document.getElementById('summon-container');
        const btn = document.getElementById('summon-btn');
        const cat = document.getElementById('summon-cat');
        const audio = document.getElementById('summon-audio');

        if (!container || !btn || !cat || !audio) return;

        let started = false;
        let fadeRAF = null;
        let fadeComplete = false;
        let ended = false;
        let audioCtx = null;
        let gainNode = null;

        function stopFade() {
            if (fadeRAF !== null) {
                cancelAnimationFrame(fadeRAF);
                fadeRAF = null;
            }
        }

        function startRave() {
            if (fadeComplete || ended) return;
            fadeComplete = true;
            // Center and enlarge the cat
            cat.classList.add('center-stage');
            // Begin spinning
            cat.classList.add('spin');
            // Flashing background
            document.body.classList.add('rave-bg');
        }

        function cleanup() {
            ended = true;
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

            const startVol = 0.15; // 15%
            const targetVol = 0.3; // 30%
            const fadeDurationMs = 33000; // 33 seconds

            // try to set initial volume (some browsers ignore this)
            try { audio.volume = startVol; } catch (_) { }

            // Web Audio API for reliable gain control on iOS
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) {
                    audioCtx = new Ctx();
                    if (audioCtx.state === 'suspended' && audioCtx.resume) {
                        audioCtx.resume().catch(() => { /* ignore */ });
                    }
                    const src = audioCtx.createMediaElementSource(audio);
                    gainNode = audioCtx.createGain();
                    gainNode.gain.value = startVol;
                    src.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                }
            } catch (_) {
                audioCtx = null;
                gainNode = null;
            }

            // play audio
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {
                    // If autoplay is blocked, require second click
                });
            }

            // time-based fade independent of audio.volume reads
            const startTime = performance.now();
            const tick = (now) => {
                if (ended) return; // stop if ended
                const elapsed = now - startTime;
                const fraction = Math.min(1, elapsed / fadeDurationMs);
                const vol = startVol + (targetVol - startVol) * fraction;
                try { audio.volume = vol; } catch (_) { }
                if (gainNode) {
                    try { gainNode.gain.value = vol; } catch (_) { }
                }
                if (fraction >= 1) {
                    stopFade();
                    startRave();
                    return;
                }
                fadeRAF = requestAnimationFrame(tick);
            };
            fadeRAF = requestAnimationFrame(tick);

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
