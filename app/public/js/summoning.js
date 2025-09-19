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
            const amp = 1.6; // amplitude boost

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

            // Start tracking for majestic float at 1:01
            startMajesticFloatTracking();
        }

        let floatRAF = null;
        let isFloating = false;
        let isShaking = false;
        let isViolentShaking = false;
        let isStill = false;
        let floatStartTime = 0;
        let floatStartPos = { x: 0, y: 0 };
        let floatEndPos = { x: 0, y: 0 };
        let shakeStartTime = 0;

        function startMajesticFloatTracking() {
            const trackAnimations = () => {
                if (ended) return;

                const currentTime = audio.currentTime * 1000; // convert to milliseconds
                const floatStartMs = 61000; // 1:01
                const floatEndMs = 75000; // 1:15
                const shakeStartMs = 75000; // 1:15
                const shakeEndMs = 88000; // 1:28
                const violentShakeStartMs = 88000; // 1:28
                const violentShakeEndMs = 101000; // 1:41
                const stillStartMs = 101000; // 1:41
                const stillEndMs = 107000; // 1:47
                const spinResumeMs = 107000; // 1:47

                // Handle floating phase (1:01-1:15)
                if (currentTime >= floatStartMs && currentTime <= floatEndMs && !isFloating) {
                    startMajesticFloat();
                } else if (currentTime > floatEndMs && isFloating) {
                    endMajesticFloat();
                }

                // Handle gentle shake phase (1:15-1:28)
                if (currentTime >= shakeStartMs && currentTime <= shakeEndMs && !isShaking) {
                    startGentleShake();
                } else if (currentTime > shakeEndMs && isShaking && !isViolentShaking) {
                    endGentleShake();
                }

                // Handle violent shake phase (1:28-1:41)
                if (currentTime >= violentShakeStartMs && currentTime <= violentShakeEndMs && !isViolentShaking) {
                    startViolentShake();
                } else if (currentTime > violentShakeEndMs && isViolentShaking) {
                    endViolentShake();
                }

                // Handle still phase (1:41-1:47)
                if (currentTime >= stillStartMs && currentTime <= stillEndMs && !isStill) {
                    startStillPhase();
                } else if (currentTime > stillEndMs && isStill) {
                    endStillPhase();
                }

                // Resume spinning (1:47+)
                if (currentTime >= spinResumeMs && !cat.classList.contains('spin') && !isFloating && !isShaking && !isViolentShaking && !isStill) {
                    resumeSpinning();
                }

                // Update animations
                if (isFloating) {
                    updateMajesticFloat(currentTime - floatStartMs);
                }
                if (isShaking) {
                    updateGentleShake(currentTime - shakeStartMs);
                }
                if (isViolentShaking) {
                    updateViolentShake(currentTime - violentShakeStartMs);
                }

                floatRAF = requestAnimationFrame(trackAnimations);
            };
            floatRAF = requestAnimationFrame(trackAnimations);
        }

        function startMajesticFloat() {
            if (isFloating) return;
            isFloating = true;
            floatStartTime = performance.now();

            // Remove spinning animation
            cat.classList.remove('spin');

            // Calculate floating path (shorter, slower movement)
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const catWidth = 96;

            // Shorter distance
            floatStartPos.x = screenWidth * 0.05; // start 5% from left
            floatStartPos.y = screenHeight * 0.3; // upper third of screen
            floatEndPos.x = screenWidth * 0.3; // end at 60% across
            floatEndPos.y = screenHeight * 0.25; // slightly higher end position

            // Position cat at start
            cat.style.left = floatStartPos.x + 'px';
            cat.style.top = floatStartPos.y + 'px';
            cat.style.transform = 'none'; // remove center-stage transform
        }

        function updateMajesticFloat(elapsedMs) {
            const floatDuration = 14000; // 14 seconds (1:01 to 1:15) - back to original timing
            const progress = Math.min(1, elapsedMs / floatDuration);

            // Smooth easing function for majestic movement
            const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
            const easedProgress = easeInOutSine(progress);

            // Calculate position
            const x = floatStartPos.x + (floatEndPos.x - floatStartPos.x) * easedProgress;
            const y = floatStartPos.y + (floatEndPos.y - floatStartPos.y) * easedProgress;

            // Add gentle vertical floating motion
            const floatOffset = Math.sin(elapsedMs * 0.002) * 15; // gentle up/down motion

            cat.style.left = x + 'px';
            cat.style.top = (y + floatOffset) + 'px';
        }

        function endMajesticFloat() {
            if (!isFloating) return;
            isFloating = false;

            // Return to center stage but don't start spinning yet
            cat.style.left = '';
            cat.style.top = '';
            cat.style.transform = '';
            cat.classList.add('center-stage');
            // Don't add spin class yet - will be handled by shake phases
        }

        function startGentleShake() {
            if (isShaking) return;
            isShaking = true;
            shakeStartTime = performance.now();

            // Remove spinning if present
            cat.classList.remove('spin');

            // Ensure center-stage positioning
            if (!cat.classList.contains('center-stage')) {
                cat.classList.add('center-stage');
            }
        }

        function updateGentleShake(elapsedMs) {
            // Very gentle shake - small amplitude, slow frequency
            const shakeX = Math.sin(elapsedMs * 0.01) * 54; // 54px amplitude (4px + 50px)
            const shakeY = Math.cos(elapsedMs * 0.012) * 53; // 53px amplitude (3px + 50px)

            cat.style.transform = `translate(-50%, -50%) translate(${shakeX}px, ${shakeY}px)`;
        }

        function endGentleShake() {
            if (!isShaking) return;
            isShaking = false;
            cat.style.transform = 'translate(-50%, -50%)';
        }

        function startViolentShake() {
            if (isViolentShaking) return;
            isViolentShaking = true;
            isShaking = false; // End gentle shake
            shakeStartTime = performance.now();
        }

        function updateViolentShake(elapsedMs) {
            // Increasingly violent shake over 13 seconds (1:28-1:41)
            const duration = 13000; // 13 seconds
            const progress = Math.min(1, elapsedMs / duration);

            // Intensity grows from gentle to very violent
            const baseIntensity = 54; // 4 + 50
            const maxIntensity = 100; // 50 + 50
            const intensity = baseIntensity + (maxIntensity - baseIntensity) * progress;

            // Higher frequency and amplitude as time progresses
            const frequency = 0.02 + (progress * 0.08); // 0.02 to 0.1
            const shakeX = Math.sin(elapsedMs * frequency) * intensity;
            const shakeY = Math.cos(elapsedMs * frequency * 1.1) * intensity;

            cat.style.transform = `translate(-50%, -50%) translate(${shakeX}px, ${shakeY}px)`;
        }

        function endViolentShake() {
            if (!isViolentShaking) return;
            isViolentShaking = false;
            cat.style.transform = 'translate(-50%, -50%)';
        }

        function startStillPhase() {
            if (isStill) return;
            isStill = true;

            // Completely still - reset transform to center position
            cat.style.transform = 'translate(-50%, -50%)';
        }

        function endStillPhase() {
            if (!isStill) return;
            isStill = false;
        }

        function resumeSpinning() {
            // Resume the original spinning animation
            cat.classList.add('spin');
        }

        function stopMajesticFloat() {
            if (floatRAF !== null) {
                cancelAnimationFrame(floatRAF);
                floatRAF = null;
            }
            if (isFloating) {
                endMajesticFloat();
            }
            if (isShaking) {
                endGentleShake();
            }
            if (isViolentShaking) {
                endViolentShake();
            }
            if (isStill) {
                endStillPhase();
            }
        }

        function cleanup() {
            ended = true;
            // stop any loops/effects
            stopFade();
            stopVisualizer();
            stopMajesticFloat();
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
            let lastFadeTime = 0;
            let currentFadeState = 'visible'; // 'visible', 'fading-out', 'hidden', 'fading-in'
            let fadeStartTime = 0;
            let currentPosition = { x: 0, y: 0 };
            let targetPosition = { x: 0, y: 0 };
            let baseY = 0; // starting Y position for upward drift
            let teleportCount = 0; // track number of teleports for scaling

            const tick = (now) => {
                if (ended) return; // stop if ended
                const elapsed = now - startTime;
                const fraction = Math.min(1, elapsed / fadeDurationMs);
                const vol = startVol + (targetVol - startVol) * fraction;
                try { audio.volume = vol; } catch (_) { }
                if (gainNode) {
                    try { gainNode.gain.value = vol; } catch (_) { }
                }

                // Random fade in/out and position changes during first 33 seconds
                if (elapsed < fadeDurationMs) {
                    // Random fade timing (every 1.5-4 seconds)
                    const timeSinceLastFade = now - lastFadeTime;
                    const shouldTriggerFade = timeSinceLastFade > (1500 + Math.random() * 2500);

                    if (shouldTriggerFade && currentFadeState === 'visible') {
                        // Start fading out and move to new position
                        currentFadeState = 'fading-out';
                        fadeStartTime = now;
                        lastFadeTime = now;

                        // Generate new random position
                        const screenWidth = window.innerWidth;
                        const screenHeight = window.innerHeight;
                        const catWidth = 96; // cat width from CSS

                        targetPosition.x = Math.random() * (screenWidth - catWidth);
                        targetPosition.y = Math.random() * (screenHeight * 0.7); // keep in upper 70% of screen
                        baseY = targetPosition.y; // reset base Y for upward drift
                    }

                    // Handle fade states
                    const fadeElapsed = now - fadeStartTime;
                    const fadeDuration = 400; // 400ms fade duration

                    if (currentFadeState === 'fading-out') {
                        const fadeProgress = Math.min(1, fadeElapsed / fadeDuration);
                        cat.style.opacity = 1 - fadeProgress;

                        if (fadeProgress >= 1) {
                            currentFadeState = 'hidden';
                            fadeStartTime = now;

                            // Move cat to new position while hidden and increase scale
                            teleportCount++;
                            currentPosition.x = targetPosition.x;
                            currentPosition.y = targetPosition.y;
                            cat.style.left = currentPosition.x + 'px';
                            cat.style.top = currentPosition.y + 'px';

                            // Gradually increase scale with each teleport (5% bigger each time, max 2x)
                            const scaleIncrease = Math.min(1 + (teleportCount * 0.05), 2.0);
                            cat.style.transform = `scale(${scaleIncrease})`;
                        }
                    } else if (currentFadeState === 'hidden') {
                        // Stay hidden for 200-800ms
                        const hiddenDuration = 200 + Math.random() * 600;
                        if (fadeElapsed >= hiddenDuration) {
                            currentFadeState = 'fading-in';
                            fadeStartTime = now;
                        }
                    } else if (currentFadeState === 'fading-in') {
                        const fadeProgress = Math.min(1, fadeElapsed / fadeDuration);
                        cat.style.opacity = fadeProgress;

                        if (fadeProgress >= 1) {
                            currentFadeState = 'visible';
                            cat.style.opacity = 1;
                        }
                    }

                    // Continuous upward movement
                    if (currentFadeState === 'visible' || currentFadeState === 'fading-in') {
                        const upwardSpeed = 0.2; // slower consistent upward movement
                        currentPosition.y -= upwardSpeed; // simple consistent upward movement
                        cat.style.top = currentPosition.y + 'px';

                        // Reset position if cat moved too far up
                        if (currentPosition.y < -100) {
                            currentPosition.y = window.innerHeight * 0.8;
                            baseY = currentPosition.y;
                        }
                    }
                }

                if (fraction >= 1) {
                    // Reset cat styles before starting rave
                    cat.style.left = '';
                    cat.style.top = '';
                    cat.style.opacity = '';
                    cat.style.transform = ''; // reset scale
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
