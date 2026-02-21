// NeuralBlock Popup Controller

document.addEventListener('DOMContentLoaded', () => {
    const counterEl = document.getElementById('counter');
    const powerToggle = document.getElementById('power-toggle');
    const statusDot = document.getElementById('status-dot');

    const settingsBtn = document.getElementById('settings-btn');

    // Load initial state
    chrome.storage.local.get(['blockedCount', 'isEnabled', 'systemVersion'], (result) => {
        animateValue(counterEl, 0, result.blockedCount || 0, 1000);
        powerToggle.checked = result.isEnabled !== false;
        updateStatusUI(powerToggle.checked);

        // Update dynamic version display
        const versionEl = document.querySelector('.version');
        if (versionEl) {
            versionEl.textContent = result.systemVersion || `v${chrome.runtime.getManifest().version}`;
        }
    });

    // Listen for changes in storage (live updates)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.blockedCount) {
            counterEl.textContent = changes.blockedCount.newValue;
        }
        if (changes.systemVersion) {
            const versionEl = document.querySelector('.version');
            if (versionEl) {
                versionEl.textContent = changes.systemVersion.newValue;
            }
        }
    });

    // Open Settings
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });

    // Toggle protection
    powerToggle.addEventListener('change', () => {
        const isEnabled = powerToggle.checked;
        chrome.storage.local.set({ isEnabled });
        updateStatusUI(isEnabled);

        // In a real extension, you'd also toggle rulesets here
        // chrome.declarativeNetRequest.updateEnabledRulesets(...)
    });

    // Blacklist Management Logic
    const blacklistInput = document.getElementById('blacklist-input');
    const addBtn = document.getElementById('add-btn');
    const blacklistList = document.getElementById('blacklist-list');

    // Load existing blacklist
    chrome.storage.local.get(['blacklist'], (result) => {
        const list = result.blacklist || [];
        renderBlacklist(list);
    });

    addBtn.addEventListener('click', () => {
        const domain = blacklistInput.value.trim().toLowerCase();
        if (domain) {
            chrome.storage.local.get(['blacklist'], (result) => {
                const list = result.blacklist || [];
                if (!list.includes(domain)) {
                    const newList = [...list, domain];
                    chrome.storage.local.set({ blacklist: newList }, () => {
                        renderBlacklist(newList);
                        updateDynamicRules(newList);
                        blacklistInput.value = '';
                    });
                }
            });
        }
    });

    function renderBlacklist(list) {
        blacklistList.innerHTML = '';
        list.forEach(domain => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${domain}</span>
                <span class="remove-btn" data-domain="${domain}">&times;</span>
            `;
            blacklistList.appendChild(li);
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const domainToRemove = e.target.getAttribute('data-domain');
                chrome.storage.local.get(['blacklist'], (result) => {
                    const newList = result.blacklist.filter(d => d !== domainToRemove);
                    chrome.storage.local.set({ blacklist: newList }, () => {
                        renderBlacklist(newList);
                        updateDynamicRules(newList);
                    });
                });
            });
        });
    }

    function updateDynamicRules(list) {
        // Convert domains/patterns to MV3 declarativeNetRequest rules
        const rules = list.map((pattern, index) => {
            let urlFilter = pattern;

            // If it doesn't start with * or a fixed scheme, make it a broad match
            if (!pattern.includes('*') && !pattern.startsWith('http')) {
                urlFilter = `*://*.${pattern}/*`;
            } else if (pattern.startsWith('.')) {
                urlFilter = `*://*${pattern}/*`;
            }

            return {
                id: index + 100, // Reserve IDs 100+ for dynamic rules
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: urlFilter,
                    resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
                }
            };
        });

        // Get current dynamic rules to remove them first
        chrome.declarativeNetRequest.getDynamicRules(oldRules => {
            const oldRuleIds = oldRules.map(r => r.id);
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: oldRuleIds,
                addRules: rules
            });
        });
    }

    function updateStatusUI(isEnabled) {
        if (isEnabled) {
            statusDot.classList.remove('disabled');
            counterEl.style.filter = 'drop-shadow(0 0 10px rgba(0, 242, 255, 0.3))';
        } else {
            statusDot.classList.add('disabled');
            counterEl.style.filter = 'grayscale(1) opacity(0.5)';
        }
    }

    // Smooth counter animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
