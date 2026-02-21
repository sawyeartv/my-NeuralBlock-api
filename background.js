// NeuralBlock Background Service Worker

// Initialize stats if they don't exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['blockedCount', 'isEnabled'], (result) => {
    if (result.blockedCount === undefined) {
      chrome.storage.local.set({ blockedCount: 0 });
    }
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  });
});

const MAX_LOGS = 500;

function logBlockEvent(domain, method) {
  chrome.storage.local.get(['blockedCount', 'logs'], (result) => {
    const currentCount = result.blockedCount || 0;
    const logs = result.logs || [];

    const newEntry = {
      timestamp: Date.now(),
      domain: domain || 'unknown',
      method: method, // 'Network' or 'Procedural'
      url: domain // Using domain as url for simplicity in logs
    };

    logs.unshift(newEntry);
    if (logs.length > MAX_LOGS) logs.pop();

    chrome.storage.local.set({
      blockedCount: currentCount + 1,
      logs: logs
    });
  });
}

// Listen for network requests being blocked
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  const url = new URL(info.request.url);
  logBlockEvent(url.hostname, 'Network');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AD_BLOCKED') {
    const domain = sender.tab ? new URL(sender.tab.url).hostname : 'unknown';
    logBlockEvent(domain, 'Procedural');
  }
});

// Advanced: Script Injection (Defusing anti-adblock)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    chrome.storage.local.get(['isEnabled'], (result) => {
      if (result.isEnabled !== false) {
        // Example: Injecting a script to disable common anti-adblock detectable functions
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN', // Run in the execution world of the page
          func: () => {
            try {
              // Basic defuser: disable self-detecting loops or property checks
              // This is a placeholder for more advanced site-specific defusers
              console.log('NeuralBlock: Defusing script active.');
              // window.adsBlocked = false; 
            } catch (e) { }
          }
        }).catch(err => console.log('Scripting error:', err));
      }
    });
  }
});
