# 📍 Mesafe & ETA (Tahmini Varış Süresi) Özelliği

## Genel Bakış

Bu özellik, B2C son kullanıcılara partner listeleme ekranında her partner için gerçek zamanlı **mesafe (km)** ve **tahmini varış süresi (ETA)** gösterir.

### Kullanıcı Senaryosu
Kütahya / Tavşanlı'da bulunan bir kullanıcı, nakliye hizmeti aradığında Kütahya Merkez'deki bir partnerin ~40 km uzaklıkta ve yaklaşık ~35 dakikada ulaşabileceğini görür.

---

## 🏗️ Teknik Mimari

### 1. Yeni Dosyalar

#### `/services/distanceService.ts`
OSRM (Open Source Routing Machine) API kullanarak mesafe ve ETA hesaplayan servis.

**Fonksiyonlar:**
- `calculateDistance(from, to)` - İki koordinat arası mesafe/ETA
- `calculateDistancesBatch(user, partners[])` - Batch hesaplama
- `geocodeAddress(city, district)` - Adres → Koordinat (Nominatim)
- `reverseGeocode(coordinates)` - Koordinat → Adres
- `haversineDistance(from, to)` - Kuş uçuşu mesafe (fallback)
- `getCityCoordinates(city)` - Şehir koordinatı (cache'li)

**API Entegrasyonları:**
- **OSRM**: `router.project-osrm.org` - Yol mesafesi & süre
- **Nominatim**: `nominatim.openstreetmap.org` - Geocoding
- **Cache**: 81 il koordinatı yerleşik (API çağrısı olmadan)

#### `/migrations/041_partner_coordinates.sql`
Partners tablosuna koordinat kolonları ekler:
- `latitude DECIMAL(10, 8)`
- `longitude DECIMAL(11, 8)`
- `coordinates_source VARCHAR(50)`
- `coordinates_updated_at TIMESTAMPTZ`

### 2. Güncellenmiş Dosyalar

#### `/types.ts` - `AvailablePartner` interface
Yeni alanlar:
```typescript
distanceKm?: number;          // Mesafe (km)
distanceText?: string;        // "12.5 km"
durationMinutes?: number;     // Varış süresi (dakika)
durationText?: string;        // "~15 dk"
partnerLatitude?: number;     // Partner koordinatı
partnerLongitude?: number;
```

#### `/components/ListingPage.tsx`
**Yeni State'ler:**
- `userCoordinates` - Kullanıcı GPS koordinatları
- `isCalculatingDistances` - Mesafe hesaplama loading
- `locationPermissionDenied` - Konum izni reddedildi mi?

**Yeni Fonksiyonlar:**
- `calculatePartnerDistances()` - Partner mesafelerini batch hesapla

**UI Güncellemeleri:**
- ProviderCard'da mesafe/ETA badge'leri
- Header'da konum durumu göstergesi
- "Mesafeye göre sırala" seçeneği

---

## 🔄 Akış

### Otomatik Konum Alma
```
1. Sayfa yüklenir
2. SessionStorage'da koordinat var mı kontrol et
3. Yoksa → navigator.permissions.query('geolocation')
4. İzin verilmişse → getCurrentPosition()
5. Koordinatları state & sessionStorage'a kaydet
```

### Manuel Konum Seçimi
```
1. Kullanıcı "Konumumu Kullan" butonuna tıklar
2. Tarayıcı konum izni ister
3. İzin verilirse → GPS koordinatı alınır
4. Reddedilirse → locationPermissionDenied = true
5. Kullanıcı manuel şehir/ilçe seçebilir
```

### Mesafe Hesaplama
```
1. fetchAvailablePartners() partner listesini alır
2. Kullanıcı koordinatı varsa → calculatePartnerDistances()
3. Her partner için:
   a. Partner koordinatı varsa → kullan
   b. Yoksa → şehir adından geocode et
4. OSRM API ile batch mesafe hesapla
5. Sonuçları partner objelerine ekle
6. UI'da göster
```

---

## 🎨 UI Gösterimi

### ProviderCard Mesafe Badge'leri
```
┌─────────────────────────────────────────────────────────┐
│  [Avatar]  Partner Adı          [Konum]     [Mesafe]    │
│            ⭐ 4.5 (12)          İstanbul    12.5 km     │
│            NAKLIYAT                         ~15 dk      │
│                                             [SEÇ →]     │
└─────────────────────────────────────────────────────────┘
```

### Header Konum Durumu
- ✅ **Konum alındı**: Yeşil badge - "Konumunuz alındı - Mesafeler gösteriliyor"
- ⚠️ **İzin reddedildi**: Turuncu badge - "Konum izni verilmedi - Tekrar dene"
- 📍 **İzin bekleniyor**: Mavi buton - "Mesafeleri göster"

---

## 📊 API Rate Limiting

### OSRM
- **Limit**: Saniyede 10 istek max
- **Uygulama**: 100ms minimum aralık
- **Batch size**: 5 partner/chunk

### Nominatim
- **Limit**: Saniyede 1 istek
- **Cache**: 81 il koordinatı yerleşik
- **User-Agent**: 'Yolmov-App/1.0' zorunlu

---

## 🔧 Migration Uygulama

Supabase SQL Editor'de çalıştırın:

```sql
-- migrations/041_partner_coordinates.sql dosyasının içeriğini kopyalayın
```

Sonuç:
- 4 yeni kolon: latitude, longitude, coordinates_source, coordinates_updated_at
- 3 index: idx_partners_latitude, idx_partners_longitude, idx_partners_location

---

## 🧪 Test Senaryoları

### 1. Konum İzni Verildiğinde
- [ ] Koordinatlar alınıyor
- [ ] SessionStorage'a kaydediliyor
- [ ] Partner mesafeleri hesaplanıyor
- [ ] ProviderCard'da mesafe/ETA gösteriliyor

### 2. Konum İzni Reddedildiğinde
- [ ] Hata mesajı gösteriliyor
- [ ] "Tekrar dene" butonu aktif
- [ ] Manuel şehir seçimi çalışıyor

### 3. Partner Koordinatı Yoksa
- [ ] Şehir adından geocode yapılıyor
- [ ] Fallback Haversine mesafe kullanılıyor

### 4. OSRM API Hatası
- [ ] Haversine fallback devreye giriyor
- [ ] Kullanıcıya hata gösterilmiyor (graceful)

---

## 📝 Gelecek İyileştirmeler

1. **Partner Koordinat Yönetimi**
   - Partner dashboard'da konum düzenleme
   - Adres girişinde otomatik geocoding

2. **Gerçek Zamanlı ETA**
   - Trafik durumu entegrasyonu
   - Tahmini varış saati gösterimi

3. **Harita Görünümü**
   - Partner konumlarını haritada göster
   - En yakın partner vurgulama

4. **Optimizasyon**
   - Web Worker ile arka planda hesaplama
   - Service Worker cache
