# PWA (Progressive Web App) Kurulum Rehberi

## 🚀 PWA Özellikleri

Yolmov artık tam bir Progressive Web App! Kullanıcılar uygulamasını masaüstüne veya telefona ekleyerek native app deneyimi yaşayabilir.

### ✨ Özellikler:
- ✅ Offline çalışma desteği
- ✅ Masaüstüne ekleme (Install)
- ✅ Push notifications hazır
- ✅ Fast loading with cache
- ✅ Native app look & feel
- ✅ iOS Safari & Android Chrome desteği

## 📱 Kullanıcı İçin Kurulum

### Android (Chrome):
1. Yolmov.com'u ziyaret edin
2. Ekranın altında "Yükle" banner'ı çıkacak
3. "Yükle" butonuna tıklayın
4. Uygulama ana ekrana eklenecek

### iOS (Safari):
1. Yolmov.com'u ziyaret edin
2. Paylaş butonuna (⬆️) tıklayın
3. "Ana Ekrana Ekle" seçeneğini seçin
4. Adı onaylayın ve "Ekle" deyin

### Desktop (Chrome/Edge):
1. Adres çubuğundaki yükle (➕) ikonuna tıklayın
2. "Yükle" butonunu onaylayın

## 🛠️ Geliştirici Kurulumu

### Dosya Yapısı:
```
/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   ├── offline.html           # Offline fallback page
│   └── icons/                 # PWA icons (TODO: oluşturulmalı)
│       ├── icon-72.png
│       ├── icon-96.png
│       ├── icon-128.png
│       ├── icon-144.png
│       ├── icon-152.png
│       ├── icon-192.png
│       ├── icon-384.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
├── services/
│   └── pwa.ts                 # PWA registration logic
└── index.tsx                  # PWA initialization
```

### Gerekli Güncellemeler:

#### 1. index.tsx'e PWA import ekleyin:
```typescript
import { registerServiceWorker, initPWAInstallPrompt } from './services/pwa';

// En altta çağırın:
registerServiceWorker();
initPWAInstallPrompt();
```

#### 2. Icon'ları hazırlayın:
Turuncu icon'u kullanarak şu boyutlarda PNG'ler oluşturun:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**Icon Kaynağı:**
```
https://raw.githubusercontent.com/yosoyorhan/YOLMOV---Roadside-Assistance/refs/heads/main/yolmov-icon-turuncu-removebg-preview.ico
```

#### 3. Icon'ları /public/icons/ klasörüne yerleştirin

#### 4. Build ve test edin:
```bash
npm run build
npm run preview
```

## 🧪 Test Etme

### Chrome DevTools:
1. F12 > Application tab
2. Manifest: Manifest.json'u kontrol edin
3. Service Workers: SW registered mi?
4. Storage: Cache'leri kontrol edin

### Lighthouse:
1. F12 > Lighthouse tab
2. "Progressive Web App" seçin
3. Raporu inceleyin (hedef 90+ score)

### Network Tab:
1. Offline moda geçin
2. Sayfayı yenileyin
3. Offline page görünmeli

## 📊 PWA Checklist

### index.html - PWA Meta Tags ✅
- [x] theme-color
- [x] apple-mobile-web-app-capable
- [x] apple-mobile-web-app-status-bar-style
- [x] manifest link
- [x] ICO favicon

### manifest.json ✅
- [x] name, short_name
- [x] icons (192x192, 512x512)
- [x] start_url
- [x] display: standalone
- [x] theme_color
- [x] background_color
- [x] shortcuts (quick actions)

### Service Worker ✅
- [x] sw.js created
- [x] Cache strategies
- [x] Offline fallback
- [x] Background sync ready
- [x] Push notifications ready

### PWA Registration ✅
- [x] services/pwa.ts created
- [x] Service worker registration
- [x] Install prompt handler
- [x] Custom install banner
- [ ] index.tsx import (TODO: manuel eklenmeli)

### Icons ⚠️
- [ ] 72x72 icon
- [ ] 96x96 icon
- [ ] 128x128 icon
- [ ] 144x144 icon
- [ ] 152x152 icon
- [ ] 192x192 icon (required)
- [ ] 384x384 icon
- [ ] 512x512 icon (required)
- [ ] apple-touch-icon.png (180x180)

### Testing 🧪
- [ ] Lighthouse PWA score 90+
- [ ] Offline mode works
- [ ] Install prompt shows
- [ ] iOS Safari install works
- [ ] Android Chrome install works
- [ ] Desktop install works
- [ ] Cache updates properly
- [ ] Service worker updates

## 🔧 Troubleshooting

### "Service Worker registration failed"
- SW dosyası /public/sw.js'de olmalı
- Build sonrası dist/ klasöründe olmalı
- HTTPS gerekli (localhost hariç)

### "Install prompt doesn't show"
- HTTPS gerekli
- manifest.json valid mi?
- Icon'lar mevcut mu?
- Daha önce dismiss edilmiş olabilir (localStorage temizle)

### "Offline page shows but content doesn't load"
- Service worker cache stratejisini kontrol et
- Network tab'dan cache'leri temizle
- Hard refresh (Ctrl+Shift+R)

### "Icons not showing"
- Icon path'leri doğru mu?
- Icon boyutları manifest.json ile uyumlu mu?
- Icon'lar public/ altında mı?

## 📱 Demo

Canlı demo: [yolmov.com](https://yolmov.com)

1. Siteyi ziyaret edin
2. Alt tarafta install banner'ı görün
3. "Yükle" butonuna tıklayın
4. Native app gibi çalışır!

## 🎯 Sonraki Adımlar

1. **Icon'ları oluştur ve ekle** (en önemli)
2. **index.tsx'e PWA import ekle** (2 satır)
3. **Build ve test et**
4. **Deploy et**
5. **Lighthouse ile test et** (90+ hedef)

## 💡 İpuçları

- Service worker güncellemeleri otomatik olur
- Cache version'ı değiştirince otomatik temizlenir
- Install banner sadece HTTPS'de çalışır
- iOS Safari'de manual install gerekir
- Android'de otomatik prompt çıkar

## 🔗 Kaynaklar

- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
