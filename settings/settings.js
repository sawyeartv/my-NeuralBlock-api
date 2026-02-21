// NeuralBlock Settings Controller

document.addEventListener('DOMContentLoaded', () => {
    const whitelistInput = document.getElementById('whitelist-input');
    const addWhitelistBtn = document.getElementById('add-whitelist-btn');
    const whitelistList = document.getElementById('whitelist-list');
    const cosmeticToggle = document.getElementById('cosmetic-toggle');
    const resetStatsBtn = document.getElementById('reset-stats-btn');

    // Load initial settings
    chrome.storage.local.get(['whitelist', 'cosmeticEnabled', 'rulesCount'], (result) => {
        const list = result.whitelist || [];
        renderWhitelist(list);

        cosmeticToggle.checked = result.cosmeticEnabled !== false;

        if (result.rulesCount) {
            document.getElementById('rules-count').textContent = result.rulesCount;
        }
    });

    // Whitelist Add
    addWhitelistBtn.addEventListener('click', () => {
        const domain = whitelistInput.value.trim().toLowerCase();
        if (domain) {
            chrome.storage.local.get(['whitelist'], (result) => {
                const list = result.whitelist || [];
                if (!list.includes(domain)) {
                    const newList = [...list, domain];
                    chrome.storage.local.set({ whitelist: newList }, () => {
                        renderWhitelist(newList);
                        whitelistInput.value = '';
                    });
                }
            });
        }
    });

    function renderWhitelist(list) {
        whitelistList.innerHTML = '';
        list.forEach(domain => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${domain}</span>
                <span class="remove-action" data-domain="${domain}">Remove</span>
            `;
            whitelistList.appendChild(li);
        });

        document.querySelectorAll('.remove-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const domainToRemove = e.target.getAttribute('data-domain');
                chrome.storage.local.get(['whitelist'], (result) => {
                    const newList = result.whitelist.filter(d => d !== domainToRemove);
                    chrome.storage.local.set({ whitelist: newList }, () => {
                        renderWhitelist(newList);
                    });
                });
            });
        });
    }

    // Toggle Settings
    cosmeticToggle.addEventListener('change', () => {
        chrome.storage.local.set({ cosmeticEnabled: cosmeticToggle.checked });
    });

    // Reset Stats
    resetStatsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all neutralization statistics?')) {
            chrome.storage.local.set({ blockedCount: 0 }, () => {
                alert('Statistics have been reset.');
            });
        }
    });
});
