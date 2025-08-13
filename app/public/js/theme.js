// Handles light/dark theme toggle & persistence
(function () {
    const STORAGE_KEY = 'site-theme';
    const body = document.body;

    function systemPrefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            toggleBtn && (toggleBtn.textContent = '☀️');
        } else {
            body.classList.remove('dark-theme');
            toggleBtn && (toggleBtn.textContent = '🌙');
        }
    }

    function getStoredTheme() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    }

    function storeTheme(theme) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { }
    }

    function init() {
        // Ensure button exists (may be reloaded by Swup) each time
        const btn = document.getElementById('theme-toggle');
        if (!btn) return; // not present on page (unlikely)
        toggleBtn = btn;
        btn.addEventListener('click', () => {
            const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(newTheme);
            storeTheme(newTheme);
        });
    }

    let toggleBtn = null;
    // Determine initial theme
    const stored = getStoredTheme();
    const initial = stored || (systemPrefersDark() ? 'dark' : 'light');
    applyTheme(initial);

    // Initialize after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-run after Swup page transitions
    document.addEventListener('swup:contentReplaced', init);
})();
