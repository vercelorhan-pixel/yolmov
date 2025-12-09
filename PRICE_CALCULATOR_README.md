# 🚀 Yolmov Dinamik Fiyatlandırma Motoru - Kurulum ve Kullanım Kılavuzu

**Versiyon:** 1.0  
**Tarih:** 05.12.2025  
**Altyapı:** OpenStreetMap (OSM) + OSRM + React-Leaflet  
**Maliyet:** ₺0 (Tamamen Açık Kaynak)

---

## 📋 İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Kurulum Adımları](#kurulum-adımları)
3. [Supabase Migration](#supabase-migration)
4. [Kullanım Senaryoları](#kullanım-senaryoları)
5. [Admin Panel Yönetimi](#admin-panel-yönetimi)
6. [API Referansı](#api-referansı)
7. [Performans ve Cache](#performans-ve-cache)
8. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Proje Özeti

Yolmov platformu için geliştirilen **sıfır maliyetli** dinamik fiyatlandırma motoru:

### ✨ Özellikler

- ✅ **OSRM ile Rota Hesaplama** - Gerçek sürüş mesafesi (kuş uçuşu değil)
- ✅ **Nominatim Geocoding** - Adres → Koordinat dönüşümü
- ✅ **React-Leaflet Harita** - İnteraktif pin sürükleme
- ✅ **Kademeli Fiyatlama** - 0-15 KM, 16-100 KM, 100+ KM
- ✅ **Dinamik Çarpanlar** - Gece, hafta sonu, araç tipi, aciliyet
- ✅ **Supabase Cache** - 30 günlük route cache (OSRM yükünü azaltır)
- ✅ **Admin Panel** - Kod yazmadan fiyat güncelleme

### 📐 Fiyat Formülü

```
Fiyat = (Baz Ücret + Mesafe Ücreti) × Çarpanlar
```

**Örnek Hesaplama:**
- **Mesafe:** 45 KM (İstanbul Kadıköy → Beşiktaş → Çatalca)
- **Araç:** SUV
- **Durum:** Arızalı
- **Zaman:** Gece 23:00

```
Baz Ücret: 1.500 TL
Mesafe:    (15 KM × 0 TL) + (30 KM × 50 TL) + (0 KM × 33 TL) = 1.500 TL
Ara Toplam: 3.000 TL

Çarpanlar:
  - SUV:          x1.15
  - Arızalı:      x1.15  
  - Gece:         x1.25
  - Toplam:       x1.65

Final: 3.000 × 1.65 = 4.950 TL
Aralık: 4.700 - 5.200 TL (±%5)
```

---

## 🛠️ Kurulum Adımları

### 1. Dependencies Kurulumu

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

**package.json güncellemesi zaten yapıldı:**
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

### 2. Supabase Migration

SQL dosyasını Supabase Dashboard'da çalıştırın:

```bash
# Dosya yolu
/workspaces/yolmov/migrations/004_pricing_config.sql
```

**Migration İçeriği:**
- `pricing_config` tablosu (baz ücretler, çarpanlar)
- `route_cache` tablosu (OSRM sonuçlarını önbellek)
- RLS policies (public read, admin write)
- Auto-cleanup function (eski cache temizleme)

**Supabase SQL Editor'de:**
1. Dashboard → SQL Editor
2. New Query
3. `004_pricing_config.sql` içeriğini yapıştır
4. Run (Çalıştır)

### 3. Leaflet CSS Ekleme

`index.html`'e ekleyin:

```html
<!-- Leaflet CSS -->
<link 
  rel="stylesheet" 
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin=""
/>
```

### 4. RouteMap Component'i Aktif Etme

`components/shared/RouteMap.tsx` dosyasında:

1. Placeholder bölümü yoruma al (satır 24-70)
2. Gerçek implementasyonu aktif et (satır 75-180)

```tsx
// PLACEHOLDER'ı yoruma al
/*
export function RouteMap({...}) {
  return <div>Placeholder...</div>
}
*/

// Gerçek kodu aktif et
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
// ... (satır 75'ten itibaren)
```

---

## 🗄️ Supabase Migration

### pricing_config Tablosu

| Alan | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `base_fee` | DECIMAL | 1500.00 | Açılış ücreti |
| `short_distance_limit` | INT | 15 | Kısa mesafe KM |
| `medium_distance_limit` | INT | 100 | Orta mesafe KM |
| `medium_distance_rate` | DECIMAL | 50.00 | 16-100 KM arası ₺/KM |
| `long_distance_rate` | DECIMAL | 33.00 | 100+ KM ₺/KM |
| `night_multiplier` | DECIMAL | 1.25 | Gece saati (+%25) |
| `suv_multiplier` | DECIMAL | 1.15 | SUV araç (+%15) |
| `ditch_multiplier` | DECIMAL | 2.00 | Şarampol (+%100) |

**İlk Veri Ekleme:**
Migration otomatik ekler, ancak manuel eklemek için:

```sql
INSERT INTO pricing_config (base_fee, medium_distance_rate, long_distance_rate)
VALUES (1500, 50, 33);
```

### route_cache Tablosu

OSRM sonuçlarını 30 gün saklayan cache:

```sql
SELECT * FROM route_cache WHERE expires_at > NOW() ORDER BY hit_count DESC LIMIT 10;
```

**Cache Temizleme:**
```sql
SELECT cleanup_expired_route_cache(); -- Süresi dolmuş kayıtları sil
```

---

## 🎮 Kullanım Senaryoları

### Senaryo 1: Kullanıcı Tarafında Fiyat Hesaplama

**Sayfa:** `/fiyat-hesapla`

1. **Adres Girişi:** Kullanıcı başlangıç/bitiş adreslerini girer
   - **Tek Sonuç:** Direkt koordinat bulunur (örn: "Kadıköy, İstanbul")
   - **Çoklu Sonuç:** Dropdown liste görünür (örn: "Gömeç" → Balıkesir Gömeç, Çorum Gömeç)
   - **Not:** Kullanıcı şehir bilgisi ekleyerek netleştirebilir (örn: "Balıkesir, Gömeç")

2. **Rota Hesaplama:** OSRM rota hesaplar (veya cache'den)
3. **Detay Seçimi:** Araç tipi, durum, zamanlama seçilir
4. **Fiyat Gösterimi:** Dinamik fiyat aralığı gösterilir
5. **Teklif Alma:** "Teklif Al" butonu ile QuoteWizard'a yönlendirilir

**URL Erişim:**
```
https://yolmov.com/fiyat-hesapla
```

**Geocoding Disambiguation:**
- Sistem otomatik ", Turkey" ekler → "Gömeç" → "Gömeç, Turkey"
- Nominatim 5 sonuç döndürür (limit=5)
- Kullanıcı dropdown'dan doğru lokasyonu seçer

### Senaryo 2: Admin Fiyat Güncelleme

**Yol:** Admin Panel → Fiyatlandırma Tab'ı

1. Admin paneline giriş (`/admin`)
2. "Fiyatlandırma" tab'ına tıkla
3. Baz ücreti veya çarpanları değiştir
4. "Kaydet" butonu
5. Cache otomatik temizlenir

**Örnek Güncelleme:**
```
Gece Çarpanı: 1.25 → 1.35 (Yaz sezonu için %10 ek zam)
Minibüs Çarpanı: 1.30 → 1.40 (Akaryakıt zamları)
```

### Senaryo 3: QuoteWizard Entegrasyonu

**Pre-fill ile teklif alma:**

```tsx
// PriceCalculatorWizard.tsx - Line 664
<button onClick={() => {
  const params = new URLSearchParams({
    from: startLocation.address,
    to: endLocation.address,
    distance: route.distance.toString(),
    vehicleType: vehicleType
  });
  window.location.href = `/teklif?${params.toString()}`;
}}>
  ✅ Teklif Al
</button>
```

---

## 🔧 Admin Panel Yönetimi

### Fiyatlandırma Tab'ı

**Erişim:** Admin Dashboard → Fiyatlandırma

#### Bölümler:

1. **Baz Ücretler**
   - Açılış ücreti
   - Mesafe limitleri (KM)
   - Esneklik marjı (%)

2. **KM Başı Ücretler**
   - Kısa mesafe (0-15 KM)
   - Orta mesafe (16-100 KM)
   - Uzun mesafe (100+ KM)

3. **Zaman Çarpanları**
   - Gece hizmeti (22:00-06:00)
   - Hafta sonu (Cumartesi/Pazar)

4. **Araç Tipi Çarpanları**
   - Sedan (x1.00)
   - SUV (x1.15)
   - Minibüs (x1.30)
   - Lüks araç (x1.20)

5. **Durum Çarpanları**
   - Arızalı (x1.15)
   - Kaza (x1.25)
   - Şarampol (x2.00)

6. **Ek Hizmet Çarpanları**
   - Yük taşıma (x1.10)
   - Acil hizmet (x1.30)

#### Önemli Notlar:

⚠️ **Dikkat:** Yapılan değişiklikler **anında** etkili olur  
🔄 **Cache:** Kaydetme sonrası otomatik temizlenir  
📊 **Yetki:** Sadece SUPER_ADMIN ve FINANCE rolleri erişebilir

---

## 📚 API Referansı

### routingService.ts

#### calculateRoute()

**Kullanım:**
```typescript
import { calculateRoute } from '../services/routingService';

const route = await calculateRoute(
  { latitude: 41.0082, longitude: 28.9784 }, // İstanbul
  { latitude: 39.9334, longitude: 32.8597 }, // Ankara
  true // useCache
);

console.log(route.distance); // 352.4 KM
console.log(route.duration); // 15840 saniye (~4.4 saat)
console.log(route.fromCache); // true/false
```

#### geocodeAddress()

**Kullanım (Tek Sonuç):**
```typescript
import { geocodeAddress } from '../services/routingService';

const location = await geocodeAddress('Kadıköy, İstanbul');

console.log(location.coords); // { latitude: 40.9926, longitude: 29.0251 }
console.log(location.address); // "Kadıköy, İstanbul, Türkiye"
```

#### geocodeAddressMultiple()

**Kullanım (Çoklu Sonuç - Disambiguation):**
```typescript
import { geocodeAddressMultiple } from '../services/routingService';

const locations = await geocodeAddressMultiple('Gömeç', 'tr', 5);

console.log(locations.length); // 2-3 sonuç
console.log(locations[0].address); // "Gömeç, Balıkesir, Türkiye"
console.log(locations[1].address); // "Gömeç, Çorum, Türkiye"
```

**Parametreler:**
- `address`: Arama terimi
- `countryCode`: Ülke kodu (default: 'tr')
- `limit`: Maksimum sonuç sayısı (default: 5)

**Not:** Sistem otomatik ", Turkey" ekler → Nominatim disambiguation için 
// { latitude: 40.9896, longitude: 29.0254 }
console.log(location.address);
// "Kadıköy, İstanbul, Türkiye"
```

⚠️ **Rate Limit:** 1 istek/saniye (Nominatim TOS)

### priceCalculator.ts

#### calculatePrice()

**Kullanım:**
```typescript
import { calculatePrice } from '../services/priceCalculator';

const input: PriceCalculationInput = {
  startLocation: { /* ... */ },
  endLocation: { /* ... */ },
  distance: 45,
  vehicleType: 'suv',
  vehicleCondition: 'broken',
  timing: 'now',
  hasLoad: false,
  requestTime: new Date(),
  isWeekend: false
};

const estimate = await calculatePrice(input, route);

console.log(estimate.finalPrice); // 4950
console.log(estimate.minPrice);   // 4700
console.log(estimate.maxPrice);   // 5200
console.log(estimate.breakdown);  // Detaylı açıklama
```

#### quickPriceEstimate()

**Hızlı tahmini fiyat (UI preview için):**

```typescript
import { quickPriceEstimate } from '../services/priceCalculator';

const { min, max } = await quickPriceEstimate(45); // KM

console.log(`${min} - ${max} TL`); // "4200 - 4800 TL"
```

---

## ⚡ Performans ve Cache

### OSRM Cache Stratejisi

**Problem:** Public OSRM demo sunucusu yavaşlayabilir  
**Çözüm:** Supabase `route_cache` tablosu

**Cache Hit Oranı:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE hit_count > 1) * 100.0 / COUNT(*) AS cache_hit_rate
FROM route_cache;
```

**En Çok Kullanılan Rotalar:**
```sql
SELECT 
  start_lat, start_lng, end_lat, end_lng,
  distance_km, hit_count
FROM route_cache
ORDER BY hit_count DESC
LIMIT 20;
```

### Pricing Config Cache

**TTL:** 5 dakika (kod içi)  
**Temizleme:** Admin panel "Cache Temizle" butonu

```typescript
// services/priceCalculator.ts
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 dakika
```

**Manuel Cache Temizleme:**
```typescript
import { clearPricingCache } from '../services/priceCalculator';

clearPricingCache(); // Anlık güncelleme için
```

---

## 🔍 Sorun Giderme

### Problem 1: "Adres bulunamadı" Hatası

**Sebep:** Nominatim API çok genel sorguları bulamıyor

**Çözüm:**
```
❌ Kötü: "Kadıköy"
✅ İyi: "Kadıköy, İstanbul"
✅ Çok İyi: "Kadıköy Belediyesi, İstanbul, Türkiye"
```

### Problem 2: Harita Görünmüyor

**Kontrol Listesi:**
1. `leaflet` CSS eklenmiş mi? (index.html)
2. RouteMap placeholder kaldırıldı mı?
3. `npm install leaflet react-leaflet` çalıştırıldı mı?
4. Browser console'da hata var mı?

**Debug:**
```bash
# Console'da
window.L // Leaflet yüklendi mi?
```

### Problem 3: OSRM "No route found"

**Sebep:** Koordinatlar deniz üzerinde veya ulaşılamaz bölge

**Çözüm:**
```typescript
// Türkiye sınırları kontrolü
import { isInTurkey } from '../services/routingService';

if (!isInTurkey(coords)) {
  alert('Sadece Türkiye içi hizmet verilmektedir');
}
```

### Problem 4: Fiyat Çok Yüksek/Düşük

**Admin Panel Kontrolü:**
1. Baz ücret mantıklı mı? (1.500 TL default)
2. KM fiyatları doğru mu? (50 TL orta, 33 TL uzun)
3. Çarpanlar çok yüksek mi? (ditch_multiplier: 2.0)

**Test:**
```sql
-- Mevcut config'i göster
SELECT base_fee, medium_distance_rate, long_distance_rate
FROM pricing_config
WHERE is_active = TRUE;
```

---

## 🚀 Production Checklist

### Supabase Migration
- [ ] `004_pricing_config.sql` çalıştırıldı
- [ ] İlk veri (INSERT) başarılı
- [ ] RLS policies aktif

### Frontend
- [ ] `npm install` tamamlandı
- [ ] Leaflet CSS index.html'de
- [ ] RouteMap placeholder kaldırıldı
- [ ] `/fiyat-hesapla` route çalışıyor

### Admin Panel
- [ ] Pricing tab görünüyor
- [ ] Fiyat güncellemesi test edildi
- [ ] Cache temizleme çalışıyor

### API Test
- [ ] OSRM route hesaplama OK
- [ ] Nominatim geocoding OK
- [ ] Cache insert/read OK
- [ ] Fiyat hesaplama doğru

---

## 📞 Destek ve Katkı

**Dokümantasyon:** Bu README  
**Code Location:**
- Services: `/services/routingService.ts`, `/services/priceCalculator.ts`
- Components: `/components/PriceCalculatorWizard.tsx`
- Admin: `/components/admin/tabs/AdminPricingTab.tsx`
- Types: `/types.ts`
- SQL: `/migrations/004_pricing_config.sql`

**Önemli Linkler:**
- OSRM Demo: https://router.project-osrm.org
- Nominatim: https://nominatim.openstreetmap.org
- Leaflet Docs: https://leafletjs.com
- React-Leaflet: https://react-leaflet.js.org

---

## 🎉 Tamamlandı!

Yolmov Dinamik Fiyatlandırma Motoru **tamamen açık kaynak** teknolojilerle,  
**sıfır maliyet**le çalışacak şekilde kuruldu.

**İyi çekimler! 🚗💨**
