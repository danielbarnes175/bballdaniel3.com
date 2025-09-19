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
        let analyser = null;
        let vizCanvas = null;
        let vizCtx = null;
        let vizRAF = null;
        // Spin speed control
        let lastSpinDur = 0.5; // seconds
        const minSpinDur = 0.2;
        const maxSpinDur = 2.0;
        const spinEase = 0.15; // EMA for duration changes

        function stopFade() {
            if (fadeRAF !== null) {
                cancelAnimationFrame(fadeRAF);
                fadeRAF = null;
            }
        }

        function stopVisualizer() {
            if (vizRAF !== null) {
                cancelAnimationFrame(vizRAF);
                vizRAF = null;
            }
            if (vizCanvas) {
                if (vizCanvas._onResize) {
                    window.removeEventListener('resize', vizCanvas._onResize);
                }
                vizCanvas.remove();
                vizCanvas = null;
                vizCtx = null;
            }
        }

        function startVisualizer() {
            if (!audioCtx || !analyser) return;
            // create canvas if not exists
            if (!vizCanvas) {
                vizCanvas = document.createElement('canvas');
                vizCanvas.id = 'audio-visualizer';
                document.body.appendChild(vizCanvas);
                vizCtx = vizCanvas.getContext('2d');
                vizCanvas.classList.add('active');
                const resize = () => {
                    const dpr = window.devicePixelRatio || 1;
                    vizCanvas.width = Math.floor(window.innerWidth * dpr);
                    vizCanvas.height = Math.floor(window.innerHeight * dpr);
                };
                resize();
                window.addEventListener('resize', resize, { passive: true });
                vizCanvas._onResize = resize;
            }

            // Configure analyser for time-domain waveform
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.85; // extra temporal smoothing from the analyser itself
            const bufferLength = analyser.fftSize;
            const dataArray = new Uint8Array(bufferLength);

            // Temporal smoothing buffer (EMA)
            const ema = new Float32Array(bufferLength);
            const emaAlpha = 0.22; // 0..1, higher = smoother
            const amp = 1.6; // amplitude boost for drawing

            const draw = () => {
                if (ended) return;
                analyser.getByteTimeDomainData(dataArray);

                const w = vizCanvas.width;
                const h = vizCanvas.height;
                vizCtx.clearRect(0, 0, w, h);

                // faint trail background for persistence
                vizCtx.fillStyle = 'rgba(0, 0, 0, 0.06)';
                vizCtx.fillRect(0, 0, w, h);

                const sliceWidth = w / (bufferLength - 1);
                const centerY = h * 0.5;

                // Build smoothed waveform values (-1..1), with temporal EMA and slight spatial smoothing
                const smoothed = new Float32Array(bufferLength);
                for (let i = 0; i < bufferLength; i++) {
                    const v = (dataArray[i] - 128) / 128; // -1..1
                    const prev = ema[i];
                    const next = prev + emaAlpha * (v - prev);
                    ema[i] = next;
                }
                for (let i = 0; i < bufferLength; i++) {
                    if (i === 0 || i === bufferLength - 1) {
                        smoothed[i] = ema[i];
                    } else {
                        smoothed[i] = (ema[i - 1] + ema[i] * 2 + ema[i + 1]) / 4; // light 3-tap spatial smoothing
                    }
                }

                // Compute RMS energy to drive spin speed
                let sumSq = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = smoothed[i];
                    sumSq += v * v;
                }
                const rms = Math.sqrt(sumSq / bufferLength); // 0..~0.7 typical
                const norm = Math.max(0, Math.min(1, rms / 0.35)); // normalize, clamp
                const targetDur = maxSpinDur - norm * (maxSpinDur - minSpinDur);
                // Smooth duration to avoid jitter
                lastSpinDur = lastSpinDur + spinEase * (targetDur - lastSpinDur);
                // Apply to cat even if spin not started yet; will take effect once it does
                cat.style.animationDuration = `${lastSpinDur.toFixed(3)}s`;

                // Primary neon gradient stroke
                const grad = vizCtx.createLinearGradient(0, 0, w, 0);
                grad.addColorStop(0.0, '#ff0040');
                grad.addColorStop(0.16, '#ff7a00');
                grad.addColorStop(0.33, '#ffee00');
                grad.addColorStop(0.5, '#00ff88');
                grad.addColorStop(0.66, '#00a2ff');
                grad.addColorStop(0.83, '#7a00ff');
                grad.addColorStop(1.0, '#ff00c8');

                // Draw primary line
                vizCtx.lineWidth = 3.5;
                vizCtx.strokeStyle = grad;
                vizCtx.shadowColor = 'rgba(255, 255, 255, 0.9)';
                vizCtx.shadowBlur = 14;
                vizCtx.beginPath();
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const y = centerY + smoothed[i] * amp * (h * 0.45);
                    if (i === 0) vizCtx.moveTo(x, y);
                    else vizCtx.lineTo(x, y);
                    x += sliceWidth;
                }
                vizCtx.stroke();

                // Secondary offset trace for depth
                vizCtx.lineWidth = 1.8;
                vizCtx.strokeStyle = 'rgba(255,255,255,0.55)';
                vizCtx.shadowBlur = 0;
                vizCtx.beginPath();
                x = 0;
                const t = performance.now() * 0.004;
                for (let i = 0; i < bufferLength; i++) {
                    const wobble = Math.sin(i * 0.04 + t) * 6;
                    const y = centerY + smoothed[i] * amp * (h * 0.4) + wobble;
                    if (i === 0) vizCtx.moveTo(x, y);
                    else vizCtx.lineTo(x, y);
                    x += sliceWidth;
                }
                vizCtx.stroke();

                vizRAF = requestAnimationFrame(draw);
            };
            vizRAF = requestAnimationFrame(draw);
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
            // stop any loops/effects
            stopFade();
            stopVisualizer();
            document.body.classList.remove('rave-bg');
            cat.classList.remove('spin');
            // reset any inline overrides
            cat.style.removeProperty('animation-duration');
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

            // Web Audio API for reliable gain control and visualizer
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
                    analyser = audioCtx.createAnalyser();
                    // Connect: source -> gain -> analyser -> destination
                    src.connect(gainNode);
                    gainNode.connect(analyser);
                    analyser.connect(audioCtx.destination);
                }
            } catch (_) {
                audioCtx = null;
                gainNode = null;
                analyser = null;
            }

            // play audio
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.then(() => {
                    startVisualizer();
                }).catch(() => {
                    // If autoplay is blocked, require second click
                });
            } else {
                startVisualizer();
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
