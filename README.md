# 🧠 NeuralBlock AdBlocker v2.0
**Premium, Neural-Design & High-Performance AdBlocker for Opera (MV3)**

NeuralBlock, sadece reklamları engellemekle kalmayan, aynı zamanda gelişmiş analitik ve bulut senkronizasyonu sunan yeni nesil bir reklam engelleyicidir.

## ✨ Öne Çıkan Özellikler

### 🛡️ Gelişmiş Filtreleme Engine
- **Neural Cloud Sync**: Kuralları doğrudan GitHub üzerinden (`rules.json`) anlık olarak senkronize edin.
- **Aggressive Procedural Filtering**: Sadece CSS ile değil, metin içeriği (`innerText`) ve Regex (rastgele sınıflar) ile reklamları tespit edip DOM'dan siler.
- **Script Injection (Defuser)**: Anti-adblock sistemlerini ve reklam yeniden ekleme scriptlerini etkisiz hale getirir.

### 📊 Neural Analytics (Admin Panel)
- **Canlı Yayın (Live Feed)**: Engellenen her isteği ve prosedürel işlemi saniyesi saniyesine izleyin.
- **Dinamik Sürüm Kontrolü**: Admin panelinden uzantı sürümünü anında override edin.
- **Raporlama**: Engelleme verilerini JSON olarak dışa aktarın.

### 🎨 Tasarım & Kullanıcı Deneyimi
- **Glassmorphism UI**: Modern cam efekti ve neon vurgularla süslenmiş premium Popup ve Admin arayüzü.
- **Akıllı Beyaz Liste**: İstediğiniz siteleri tek tıkla koruma dışında bırakın.

## 🚀 Kurulum (Opera / Chrome)
1. Bu projeyi bir dosya olarak indirin.
2. Opera'da `opera://extensions` adresine gidin.
3. "Geliştirici Modu"nu (Developer Mode) açın.
4. "Paketlenmemiş yükle" (Load unpacked) butonuna tıklayın ve bu klasörü seçin.

## ☁️ GitHub Kurallarını Güncelleme
Kuralları güncellemek için şu adımları izleyin:
1. GitHub'daki `my-NeuralBlock-api` deposuna gidin.
2. `rules.json` dosyasını düzenleyin.
3. Dosya formatının şu şekilde olduğundan emin olun:
   ```json
   [
     {
       "id": 1,
       "priority": 1,
       "action": { "type": "block" },
       "condition": { "urlFilter": "*://*.site.com/*", "resourceTypes": ["script"] }
     }
   ]
   ```
4. Kaydettikten sonra NeuralBlock Admin Panel'den **"Sync Now"** butonuna basın.

## 🛠️ Klasör Yapısı
- `/admin`: Analitik ve yönetim merkezi.
- `/popup`: Ana kontrol paneli.
- `/content`: Sayfa içi temizlik scriptleri.
- `/background`: Ana Neural Engine servis işçisi.

## ❓ Sıkça Karşılaşılan Hatalar

### "Sync failed: Cannot read properties of undefined (reading 'getDynamicRules')"
Bu hata, uzantının Chrome/Opera API'lerine erişemediği anlamına gelir. Nedenleri:
1. **Dosya Olarak Açma**: Admin panelini klasörden çift tıklayarak (`file://`) açıyor olabilirsiniz. Paneli mutlaka Uzantı Popup'ı üzerindeki **"Admin"** butonuna tıklayarak açmalısınız.
2. **Yenileme Gerekli**: `manifest.json` üzerindeki izinler değiştiğinde eklentinin `opera://extensions` sayfasından **Yenile (Reload)** yapılması gerekir.
3. **Eksik İzin**: `manifest.json` dosyasında `declarativeNetRequest` izninin olduğundan emin olun.

---
Created by **Antigravity & Neural Labs** 🚀
