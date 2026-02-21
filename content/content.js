// NeuralBlock Cosmetic Filter Script

(function () {
    const adSelectors = [
        '.ad-container', '.ad-unit', '[id*="google_ads"]',
        '[class*="sponsored-content"]', '.banner-ads',
        '.sidebar-ad', '#ad-header'
    ];

    function hideAds() {
        chrome.storage.local.get(['isEnabled', 'cosmeticEnabled', 'whitelist'], (result) => {
            if (result.isEnabled === false) return;
            if (result.cosmeticEnabled === false) return;

            // Whitelist check
            const currentHost = window.location.hostname;
            const isWhitelisted = (result.whitelist || []).some(domain =>
                currentHost === domain || currentHost.endsWith('.' + domain)
            );
            if (isWhitelisted) return;

            let foundCount = 0;

            // 1. Selector-based filtering (Static)
            adSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    if (el.style.display !== 'none') {
                        el.style.display = 'none';
                        foundCount++;
                    }
                });
            });

            // 2. Aggressive Procedural Filtering (Content & Regex Scanning)
            const adKeywords = ['sponsored', 'advertisement', 'promoted', 'reklam', 'ads by', 'sponsorlu'];
            const randomClassRegex = /[a-z]{2,3}-\d{4,}/i; // Matches patterns like pl-7598, ad-1234

            const allElements = document.querySelectorAll('div, span, section, aside, article');

            allElements.forEach(el => {
                // Skip if already removed or hidden
                if (!el.isConnected) return;

                // A. Regex-based class detection (pl-7598...)
                const hasRandomClass = Array.from(el.classList).some(cls => randomClassRegex.test(cls));

                // B. Content-based detection (innerText)
                // We look at small elements (labels) or the element itself if it has specific keywords
                const text = el.innerText ? el.innerText.trim().toLowerCase() : '';
                const isAdLabel = adKeywords.some(keyword => text === keyword);

                if (hasRandomClass || isAdLabel) {
                    // Find the nearest logical container to remove
                    // We look for a wrapper that looks like a card or a list item
                    const container = el.closest('article, section, [class*="card"], [class*="item"], [class*="wrapper"]') || el;

                    if (container && container.isConnected) {
                        console.log('NeuralBlock: Neutralizing advanced ad container', container);
                        container.remove(); // Direct DOM removal as requested
                        foundCount++;
                    }
                }
            });

            // 3. Structural Cleaning (Cleanup empty parent spaces)
            document.querySelectorAll('div:empty, section:empty').forEach(el => {
                if (el.classList.length > 0) el.remove();
            });
            if (foundCount > 0) {
                chrome.runtime.sendMessage({ type: 'AD_BLOCKED', count: foundCount });
            }
        });
    }

    // Initial run
    hideAds();

    // Watch for dynamic content
    const observer = new MutationObserver((mutations) => {
        hideAds();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
