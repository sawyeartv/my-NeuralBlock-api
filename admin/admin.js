// Neural Analytics Controller

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are running in extension context
    const isExtension = typeof chrome !== 'undefined' && chrome.declarativeNetRequest;
    
    if (!isExtension) {
        console.warn("NeuralBlock: Operating in Remote Management Mode (No extension-level APIs available).");
        document.body.classList.add('remote-mode');
        // Inject a notice banner if it doesn't exist
        const banner = document.createElement('div');
        banner.className = 'context-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <span class="icon">🌐</span>
                <span class="text"><strong>REMOTE MODE:</strong> You are managing rules for GitHub publication. Direct browser interaction is disabled.</span>
            </div>
        `;
        document.querySelector('.container').prepend(banner);
    }

    const logBody = document.getElementById('log-body');
    const totalCountEl = document.getElementById('total-count');
    const proceduralCountEl = document.getElementById('procedural-count');
    const proceduralPercentEl = document.getElementById('procedural-percent');
    const targetList = document.getElementById('target-list');
    const clearBtn = document.getElementById('clear-logs-btn');
    const exportBtn = document.getElementById('export-btn');

    const tierBtns = document.querySelectorAll('.tier-btn');
    const activeTierEl = document.getElementById('active-tier');
    const globalBlacklistInput = document.getElementById('global-blacklist-input');
    const syncBlacklistBtn = document.getElementById('sync-blacklist-btn');
    const systemVersionInput = document.getElementById('system-version-input');
    const applyVersionBtn = document.getElementById('apply-version-btn');
    const cloudUrlInput = document.getElementById('cloud-url-input');
    const syncCloudBtn = document.getElementById('sync-cloud-btn');
    const syncStatusEl = document.getElementById('sync-status');

    function updateDashboard() {
        if (!isExtension) {
            // Mock data or static read-only for Remote Mode
            totalCountEl.textContent = "CONNECTED";
            activeTierEl.textContent = "REMOTE";
            syncStatusEl.textContent = `Target: sawyeartv/my-NeuralBlock-api`;
            
            logBody.innerHTML = '<tr><td colspan="4" style="text-align: center; opacity: 0.5;">Logs only visible in Extension Mode</td></tr>';
            targetList.innerHTML = '<li style="opacity: 0.5;">Connect extension to see stats</li>';
            
            // Set default cloud URL for convenient copying/checking
            if (!cloudUrlInput.value) {
                cloudUrlInput.value = "https://raw.githubusercontent.com/sawyeartv/my-NeuralBlock-api/refs/heads/main/rules.json";
            }
            return;
        }

        chrome.storage.local.get(['blockedCount', 'logs', 'blacklist', 'ruleTier', 'systemVersion', 'cloudSyncUrl', 'lastSync'], (result) => {
            const logs = result.logs || [];
            const total = result.blockedCount || 0;
            const blacklist = result.blacklist || [];
            const tier = result.ruleTier || 'standard';
            const version = result.systemVersion || chrome.runtime.getManifest().version;
            const cloudUrl = result.cloudSyncUrl || '';
            const lastSync = result.lastSync || 'Never';

            totalCountEl.textContent = total.toLocaleString();
            activeTierEl.textContent = tier.toUpperCase();
            syncStatusEl.textContent = `Last sync: ${lastSync}`;

            // Update version input
            if (!systemVersionInput.matches(':focus')) {
                systemVersionInput.value = version;
            }

            // Update cloud URL input
            if (!cloudUrlInput.matches(':focus')) {
                cloudUrlInput.value = cloudUrl;
            }

            // Update active tier UI
            tierBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tier === tier);
            });

            // Update blacklist input
            if (!globalBlacklistInput.matches(':focus')) {
                globalBlacklistInput.value = blacklist.join('\n');
            }

            // Calculate Procedural vs Total
            const proceduralCount = logs.filter(l => l.method === 'Procedural').length;
            proceduralCountEl.textContent = proceduralCount.toLocaleString();

            const percent = total > 0 ? (proceduralCount / logs.length) * 100 : 0;
            proceduralPercentEl.style.width = `${percent}%`;

            renderLogs(logs);
            renderTopTargets(logs);
        });
    }

    function renderLogs(logs) {
        logBody.innerHTML = '';
        logs.slice(0, 100).forEach(log => {
            const row = document.createElement('tr');
            const time = new Date(log.timestamp).toLocaleTimeString();

            row.innerHTML = `
        <td>${time}</td>
        <td style="color: white; font-weight: 500;">${log.domain}</td>
        <td><span class="method-badge method-${log.method.toLowerCase()}">${log.method}</span></td>
        <td style="color: #00ffaa;">NEUTRALIZED</td>
      `;
            logBody.appendChild(row);
        });
    }

    function renderTopTargets(logs) {
        const counts = {};
        logs.forEach(log => {
            counts[log.domain] = (counts[log.domain] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        targetList.innerHTML = '';
        sorted.forEach(([domain, count]) => {
            const li = document.createElement('li');
            li.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${domain}</span>
        <span style="color: var(--accent-cyan); font-weight: 700;">${count}</span>
      `;
            targetList.appendChild(li);
        });
    }

    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to purge all mission logs?')) {
            chrome.storage.local.set({ logs: [] }, () => {
                updateDashboard();
            });
        }
    });

    exportBtn.addEventListener('click', () => {
        chrome.storage.local.get(['logs'], (result) => {
            const data = JSON.stringify(result.logs || [], null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `neuralblock-report-${Date.now()}.json`;
            a.click();
        });
    });

    // Tier Switching
    tierBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tier = btn.dataset.tier;
            chrome.storage.local.set({ ruleTier: tier }, () => {
                updateDashboard();
            });
        });
    });

    // Blacklist Sync
    syncBlacklistBtn.addEventListener('click', () => {
        const list = globalBlacklistInput.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        chrome.storage.local.set({ blacklist: list }, () => {
            updateDynamicRules(list);
            alert('Blacklist synchronized with engine.');
        });
    });

    // Version Update
    applyVersionBtn.addEventListener('click', () => {
        const newVersion = systemVersionInput.value.trim();
        if (newVersion) {
            chrome.storage.local.set({ systemVersion: newVersion }, () => {
                alert(`Engine target version updated to ${newVersion}`);
                updateDashboard();
            });
        }
    });


    // Cloud Sync logic
    syncCloudBtn.addEventListener('click', async () => {
        const url = cloudUrlInput.value.trim();
        if (!url) return alert('Please enter a valid GitHub RAW URL.');

        syncCloudBtn.disabled = true;
        syncCloudBtn.textContent = 'Syncing...';
        syncStatusEl.textContent = 'Syncing from cloud...';

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const rules = await response.json();

            // Apply rules to DNR
            // Rules from GitHub are expected to be in MV3 DNR format
            if (!chrome.declarativeNetRequest) {
                throw new Error("DNR API is not available. Please ensure the extension is loaded correctly with 'declarativeNetRequest' permission.");
            }

            chrome.declarativeNetRequest.getDynamicRules(oldRules => {
                const oldRuleIds = oldRules.map(r => r.id);
                // We keep IDs from the JSON or assign them starting from 1000 to avoid clash with local blacklist (100+)
                const processedRules = rules.map((r, i) => ({
                    ...r,
                    id: r.id || (i + 1000)
                }));

                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: oldRuleIds.filter(id => id >= 1000), // Only remove previously synced cloud rules
                    addRules: processedRules
                }, () => {
                    const now = new Date().toLocaleString();
                    chrome.storage.local.set({
                        cloudSyncUrl: url,
                        lastSync: now
                    }, () => {
                        alert('Neural Cloud Rules Synchronized!');
                        updateDashboard();
                        syncCloudBtn.disabled = false;
                        syncCloudBtn.textContent = 'Sync Now';
                    });
                });
            });
        } catch (error) {
            console.error('Sync failed:', error);
            alert('Sync failed: ' + error.message);
            syncCloudBtn.disabled = false;
            syncCloudBtn.textContent = 'Sync Now';
            syncStatusEl.textContent = 'Last sync failed';
        }
    });

    function updateDynamicRules(list) {
        if (!chrome.declarativeNetRequest) {
            console.error("DNR API not available");
            return;
        }

        const rules = list.map((pattern, index) => {
            let urlFilter = pattern;
            if (!pattern.includes('*') && !pattern.startsWith('http')) {
                urlFilter = `*://*.${pattern}/*`;
            } else if (pattern.startsWith('.')) {
                urlFilter = `*://*${pattern}/*`;
            }

            return {
                id: index + 100,
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: urlFilter,
                    resourceTypes: ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
                }
            };
        });

        chrome.declarativeNetRequest.getDynamicRules(oldRules => {
            const oldRuleIds = oldRules.map(r => r.id);
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: oldRuleIds,
                addRules: rules
            });
        });
    }

    // Initial load
    updateDashboard();

    // Real-time updates
    if (isExtension) {
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.logs || changes.blockedCount || changes.systemVersion) {
                updateDashboard();
            }
        });
    }
});
