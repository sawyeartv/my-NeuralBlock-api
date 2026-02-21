// NeuralBlock Pro - Background Service Worker
const FALLBACK_RULES_URL = "https://raw.githubusercontent.com/sawyeartv/my-NeuralBlock-api/refs/heads/main/rules.json";
const MAX_LOGS = 500;

// 1. GITHUB SENKRONİZASYON MEKANİZMASI
async function fetchAndApplyRules() {
  if (!chrome.declarativeNetRequest) {
    console.error("NeuralBlock: DNR API henüz hazır değil veya izinler eksik.");
    return;
  }

  try {
    console.log("NeuralBlock: Güncelleme kontrol ediliyor...");
    // Get dynamic URL if set in storage, otherwise use fallback
    const result = await chrome.storage.local.get(['cloudSyncUrl']);
    const url = result.cloudSyncUrl || FALLBACK_RULES_URL;

    const response = await fetch(url);
    if (!response.ok) throw new Error("GitHub erişim hatası");

    const rules = await response.json();

    // Assign IDs starting from 1000 for cloud rules to avoid clash with local blacklist (100+)
    const processedRules = rules.map((r, i) => ({
      ...r,
      id: r.id || (i + 1000)
    }));

    // Get current dynamic rules to clean up only cloud rules (ID >= 1000)
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map(r => r.id).filter(id => id >= 1000);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldRuleIds,
      addRules: processedRules
    });

    const now = new Date().toLocaleString();
    await chrome.storage.local.set({ lastSync: now });

    console.log('NeuralBlock: GitHub senkronizasyonu başarılı. Toplam kural:', rules.length);
  } catch (err) {
    console.error('NeuralBlock: Senkronizasyon hatası:', err);
  }
}

// 2. İLK KURULUM VE ALARM YÖNETİMİ
chrome.runtime.onInstalled.addListener(() => {
  fetchAndApplyRules();

  // Her 60 dakikada bir güncelleme kontrolü yap
  chrome.alarms.create("periodicUpdate", {
    periodInMinutes: 60
  });

  // İstatistikleri başlat
  chrome.storage.local.get(['blockedCount', 'isEnabled'], (result) => {
    if (result.blockedCount === undefined) chrome.storage.local.set({ blockedCount: 0 });
    if (result.isEnabled === undefined) chrome.storage.local.set({ isEnabled: true });
  });
});

// Alarm tetiklendiğinde güncelle
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicUpdate") {
    fetchAndApplyRules();
  }
});

// 3. LOGLAMA VE İSTATİSTİK FONKSİYONU
function logBlockEvent(domain, method) {
  chrome.storage.local.get(['blockedCount', 'logs'], (result) => {
    const currentCount = result.blockedCount || 0;
    const logs = result.logs || [];

    const newEntry = {
      timestamp: Date.now(),
      domain: domain || 'unknown',
      method: method, // 'Network' veya 'Procedural'
      url: domain
    };

    logs.unshift(newEntry);
    if (logs.length > MAX_LOGS) logs.pop();

    chrome.storage.local.set({
      blockedCount: currentCount + 1,
      logs: logs
    });
  });
}

// Network engellemelerini dinle
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    try {
      const url = new URL(info.request.url);
      logBlockEvent(url.hostname, 'Network');
    } catch (e) {
      logBlockEvent("Zararlı Kaynak", 'Network');
    }
  });
}

// Content Script'ten gelen mesajları yakala
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'AD_BLOCKED') {
    const domain = sender.tab ? new URL(sender.tab.url).hostname : 'unknown';
    logBlockEvent(domain, 'Procedural');
  }
});

// 4. ANTI-ADBLOCK DEFUSER (SCRİPT ENJEKSİYONU)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
    chrome.storage.local.get(['isEnabled'], (result) => {
      if (result.isEnabled !== false) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN',
          func: () => {
            try {
              // Anti-Adblock sistemlerini yanıltmak için global değişkenleri düzenle
              window.adsBlocked = false;
              window.canRunAds = true;
              console.log('NeuralBlock: Defusing script active.');
            } catch (e) { }
          }
        }).catch(() => { /* Errors are silent for restricted pages */ });
      }
    });
  }
});
