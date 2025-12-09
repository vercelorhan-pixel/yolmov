# Hizmet Bölgesi ve Boş Dönüş Rotası Sistemi - AR-GE Dokümanı

## 📋 Proje Özeti

Bu doküman, partner hizmet bölgeleri ve boş dönen araçların rota bazlı görünürlüğü için gerekli sistem değişikliklerini detaylandırmaktadır.

### Hedefler
1. **Partner Hizmet Bölgesi Yönetimi**: Partnerler tanımlı hizmet bölgelerine göre listelerde görünecek
2. **Boş Dönüş Rotası Sistemi**: Boş dönen araçlar, güzergahlarındaki illerde listelerde görünecek
3. **Gerçekçi Listeleme**: Kullanıcı sorguladığı ilde sadece o bölgeye hizmet veren partnerleri görecek

---

## 🔍 Mevcut Durum Analizi

### Mevcut Veritabanı Yapısı

#### Partners Tablosu (Mevcut)
```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  city VARCHAR(100),          -- Tek şehir
  district VARCHAR(100),      -- Tek ilçe
  service_types service_type[], -- Hizmet türleri (cekici, aku, lastik, vb.)
  status user_status,
  rating DECIMAL(3,2),
  ...
);
```

**Sorun**: Partner yalnızca tek bir `city` ve `district` ile tanımlı. Birden fazla ile hizmet veren partnerler için yetersiz.

#### Empty Truck Routes Tablosu (Mevcut)
```sql
CREATE TABLE empty_truck_routes (
  id UUID PRIMARY KEY,
  partner_id UUID REFERENCES partners(id),
  from_city VARCHAR(100),    -- Başlangıç şehri
  to_city VARCHAR(100),      -- Bitiş şehri
  departure_date DATE,
  vehicle_type VARCHAR(100),
  vehicle_plate VARCHAR(20),
  status route_status,       -- active, completed, cancelled
  ...
);
```

**Sorun**: Sadece başlangıç ve bitiş şehirleri var. Ara güzergah (geçilen iller) bilgisi tutulmuyor.

---

## 🏗️ Önerilen Veri Modeli

### 1. Partner Hizmet Bölgeleri Tablosu (YENİ)

```sql
CREATE TABLE partner_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,           -- İl adı
  districts TEXT[],                      -- Hizmet verilen ilçeler (boş = tüm il)
  is_primary BOOLEAN DEFAULT FALSE,      -- Ana hizmet bölgesi mi?
  price_multiplier DECIMAL(3,2) DEFAULT 1.00, -- Bölgeye özel fiyat çarpanı
  is_active BOOLEAN DEFAULT TRUE,        -- Aktif mi?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_partner_city UNIQUE(partner_id, city)
);

CREATE INDEX idx_partner_service_areas_partner ON partner_service_areas(partner_id);
CREATE INDEX idx_partner_service_areas_city ON partner_service_areas(city);
CREATE INDEX idx_partner_service_areas_active ON partner_service_areas(is_active) WHERE is_active = TRUE;
```

**Özellikler**:
- Bir partner birden fazla ile hizmet verebilir
- İlçe bazında filtreleme opsiyonel
- Bölgeye özel fiyat çarpanı tanımlanabilir
- Ana hizmet bölgesi işaretlenebilir

### 2. Araç Dönüş Rotaları Tablosu (GÜNCELLENMİŞ)

```sql
CREATE TABLE vehicle_return_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES partner_vehicles(id) ON DELETE SET NULL,
  
  -- Rota Bilgileri
  origin_city VARCHAR(100) NOT NULL,      -- Mevcut konum (başlangıç)
  destination_city VARCHAR(100) NOT NULL, -- Hedef (genelde ana hizmet bölgesi)
  route_cities TEXT[] NOT NULL,           -- Geçilen iller sırasıyla [Antalya, Burdur, Isparta, Afyon, Kütahya]
  
  -- Zamanlama
  departure_date DATE NOT NULL,
  departure_time TIME,
  estimated_arrival TIMESTAMPTZ,
  
  -- Araç Bilgileri
  vehicle_type VARCHAR(100) NOT NULL,
  vehicle_plate VARCHAR(20) NOT NULL,
  available_capacity VARCHAR(100),        -- Boş kapasite açıklaması
  
  -- Fiyatlandırma
  price_per_km DECIMAL(10,2),
  discount_percent INTEGER DEFAULT 0,     -- Boş dönüş indirimi (ör. %30)
  
  -- Durum
  status route_status DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_return_routes_partner ON vehicle_return_routes(partner_id);
CREATE INDEX idx_return_routes_cities ON vehicle_return_routes USING GIN(route_cities);
CREATE INDEX idx_return_routes_status ON vehicle_return_routes(status);
CREATE INDEX idx_return_routes_departure ON vehicle_return_routes(departure_date);
CREATE INDEX idx_return_routes_origin ON vehicle_return_routes(origin_city);
```

**Özellikler**:
- `route_cities` array ile tüm güzergah illeri tutulur
- GIN index ile hızlı array sorgusu
- İndirim oranı tanımlanabilir (boş dönüş avantajı)

---

## 📊 Sorgu Mantığı

### 1. Partner Listesi Sorgusu (Hizmet Bölgesine Göre)

```sql
-- Kullanıcı "Antalya" sorguladığında:
SELECT DISTINCT p.* 
FROM partners p
INNER JOIN partner_service_areas psa ON p.id = psa.partner_id
WHERE psa.city = 'Antalya'
  AND psa.is_active = TRUE
  AND p.status = 'active'
ORDER BY psa.is_primary DESC, p.rating DESC;
```

### 2. Boş Dönen Araçlar Sorgusu (Rota Üzerindeki İller)

```sql
-- Kullanıcı "Burdur" sorguladığında boş dönen araçları bul:
SELECT vrr.*, p.name as partner_name, p.rating
FROM vehicle_return_routes vrr
INNER JOIN partners p ON vrr.partner_id = p.id
WHERE 'Burdur' = ANY(vrr.route_cities)
  AND vrr.status = 'active'
  AND vrr.departure_date >= CURRENT_DATE
  AND p.status = 'active'
ORDER BY vrr.departure_date ASC;
```

### 3. Kombine Sorgu (Hem Hizmet Bölgesi Hem Boş Dönüş)

```sql
-- Tüm uygun partnerler (Antalya için):
WITH service_area_partners AS (
  SELECT p.id, p.name, p.rating, 'service_area' as source, NULL::UUID as route_id,
         NULL::INTEGER as discount_percent
  FROM partners p
  INNER JOIN partner_service_areas psa ON p.id = psa.partner_id
  WHERE psa.city = 'Antalya' AND psa.is_active = TRUE AND p.status = 'active'
),
return_route_partners AS (
  SELECT p.id, p.name, p.rating, 'return_route' as source, vrr.id as route_id,
         vrr.discount_percent
  FROM partners p
  INNER JOIN vehicle_return_routes vrr ON p.id = vrr.partner_id
  WHERE 'Antalya' = ANY(vrr.route_cities)
    AND vrr.status = 'active'
    AND vrr.departure_date >= CURRENT_DATE
    AND p.status = 'active'
)
SELECT * FROM service_area_partners
UNION
SELECT * FROM return_route_partners
ORDER BY rating DESC;
```

---

## 🔄 Geliştirme Planı

### Faz 1: Veritabanı (Migration)
- [x] `partner_service_areas` tablosu oluştur
- [x] `vehicle_return_routes` tablosu oluştur
- [x] RLS politikaları ekle
- [x] Mevcut partner verileri için seed data

### Faz 2: Backend (TypeScript Types & API)
- [x] `PartnerServiceArea` interface ekle
- [x] `VehicleReturnRoute` interface ekle
- [x] `serviceAreasApi` fonksiyonları ekle
- [x] `returnRoutesApi` fonksiyonları ekle
- [x] `partnersApi.getByServiceArea()` ekle

### Faz 3: Partner Dashboard
- [x] Hizmet Bölgeleri yönetim sekmesi
- [x] Boş Dönüş Rotası ekleme/düzenleme
- [x] İl/İlçe seçici komponent

### Faz 4: Admin Dashboard
- [x] Partner hizmet bölgeleri görüntüleme
- [x] Rota onay/red mekanizması
- [x] Raporlama ekranı

### Faz 5: Listeleme Sayfaları
- [x] ListingPage filtreleme güncelleme
- [x] QuoteWizard partner eşleştirme
- [x] Boş dönüş araçları badge'i

---

## 🧪 Test Senaryoları

### Pozitif Senaryolar

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | Partner A: Hizmet bölgesi [İstanbul, Kocaeli]. Kullanıcı İstanbul sorgusu | Partner A listede görünür |
| 2 | Partner B: Ana bölge Kütahya. Boş dönüş rotası: Antalya→Burdur→Isparta→Afyon→Kütahya. Kullanıcı Isparta sorgusu | Partner B (boş dönüş) listede görünür |
| 3 | Partner C: Hizmet bölgesi [Ankara, Konya]. Boş dönüş rotası yok. Kullanıcı Ankara sorgusu | Partner C listede görünür |

### Negatif Senaryolar

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | Partner A: Hizmet bölgesi [İstanbul]. Kullanıcı Bursa sorgusu | Partner A görünmez |
| 2 | Partner B: Boş dönüş rotası aktif değil (cancelled). Kullanıcı rota üzerindeki il sorgusu | Partner B görünmez |
| 3 | Partner C: Boş dönüş departure_date geçmiş. Kullanıcı rota üzerindeki il sorgusu | Partner C görünmez |

---

## 📱 UI/UX Tasarımı

### Partner Dashboard - Hizmet Bölgeleri Tab

```
┌─────────────────────────────────────────────────────┐
│ 📍 Hizmet Bölgelerim                    [+ Ekle]   │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐   │
│ │ 🏠 İstanbul (Ana Bölge)              [Düzenle]│   │
│ │ İlçeler: Tüm İl                               │   │
│ │ Fiyat Çarpanı: 1.00x                         │   │
│ └──────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────┐   │
│ │ 📍 Kocaeli                           [Düzenle]│   │
│ │ İlçeler: Gebze, İzmit, Derince              │   │
│ │ Fiyat Çarpanı: 1.20x                         │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Partner Dashboard - Boş Dönüş Rotası Tab

```
┌─────────────────────────────────────────────────────┐
│ 🚛 Boş Dönüş Rotalarım                  [+ Ekle]   │
├─────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐   │
│ │ 📅 15 Aralık 2025                            │   │
│ │ 🚗 34 ABC 123 - Çekici                       │   │
│ │ 📍 Antalya → Burdur → Isparta → Afyon → Kütahya │
│ │ 💰 %30 İndirimli                    [Düzenle]│   │
│ │ 🟢 Aktif                                     │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Listeleme Sayfası - Boş Dönüş Badge

```
┌─────────────────────────────────────────────────────┐
│ [Profil Resmi] ABC Nakliyat            ⭐ 4.8 (120)│
│ 📍 Kütahya                                         │
│ ┌─────────────────────────────────────────────┐    │
│ │ 🚛 Boş Dönüş! %30 İndirim - 15 Aralık       │    │
│ │    Antalya üzerinden geçiyor                 │    │
│ └─────────────────────────────────────────────┘    │
│                                         [Seç →]    │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Güvenlik (RLS Politikaları)

### partner_service_areas
- **SELECT**: Herkes okuyabilir (public listing için)
- **INSERT/UPDATE/DELETE**: Sadece partner kendi kayıtlarını düzenleyebilir

### vehicle_return_routes
- **SELECT**: Herkes aktif rotaları okuyabilir
- **INSERT/UPDATE/DELETE**: Sadece partner kendi rotalarını düzenleyebilir

---

## 📈 Performans Notları

1. **GIN Index**: `route_cities` array sorgularını hızlandırmak için
2. **Partial Index**: Sadece aktif kayıtlar için index
3. **Materialized View**: Yoğun trafik durumunda kombine sorgu için düşünülebilir

---

## 🗓️ Zaman Çizelgesi

| Faz | Süre | Durum |
|-----|------|-------|
| Faz 1: Migration | 1 gün | 🔄 Devam |
| Faz 2: API | 1 gün | ⏳ Bekliyor |
| Faz 3: Partner UI | 2 gün | ⏳ Bekliyor |
| Faz 4: Admin UI | 1 gün | ⏳ Bekliyor |
| Faz 5: Listeleme | 1 gün | ✅ Tamamlandı |
| Test & QA | 1 gün | 🔄 Devam |

**Toplam**: ~7 iş günü

---

## 🧪 Test Senaryoları

### TC-001: Partner Hizmet Bölgesi Ekleme
**Önkoşul**: Partner hesabı ile giriş yapılmış
**Adımlar**:
1. Partner Dashboard > Ayarlar > Hizmet Bölgeleri'ne git
2. "Yeni Bölge Ekle" butonuna tıkla
3. İl olarak "İstanbul" seç
4. İlçe olarak "Kadıköy, Ataşehir, Üsküdar" seç
5. "Ana Bölge Olarak İşaretle" checkbox'ını işaretle
6. Kaydet butonuna tıkla

**Beklenen Sonuç**: 
- Yeni bölge listede görünür
- "Ana Bölge" etiketi ile işaretlenir
- API'den confirm mesajı alınır

### TC-002: Boş Dönüş Rotası Oluşturma
**Önkoşul**: Partner hesabı ile giriş yapılmış, en az 1 araç kayıtlı
**Adımlar**:
1. Partner Dashboard > Ayarlar > Boş Dönüş Rotaları'na git
2. "Yeni Rota Ekle" butonuna tıkla
3. Çıkış şehri: "Antalya"
4. Varış şehri: "İstanbul"
5. Ara şehirler: "Burdur, Afyon, Kütahya, Bursa" ekle
6. Tarih: Gelecek bir tarih seç
7. Araç: Listeden bir araç seç
8. İndirim: %20 gir
9. Kaydet

**Beklenen Sonuç**:
- Rota listede "Aktif" durumda görünür
- Rota bilgileri doğru gösterilir
- route_cities array'i doğru sırayla oluşur

### TC-003: Şehir Bazlı Partner Arama - Service Area
**Önkoşul**: İstanbul'a hizmet veren partner var
**Adımlar**:
1. ListingPage'e git
2. Şehir olarak "İstanbul" seç
3. İlçe olarak "Kadıköy" seç
4. Ara butonuna tıkla

**Beklenen Sonuç**:
- İstanbul/Kadıköy için tanımlı service_area'sı olan partnerler listelenir
- "X bölge partneri" sayısı doğru gösterilir

### TC-004: Şehir Bazlı Partner Arama - Boş Dönüş
**Önkoşul**: Kütahya üzerinden geçen aktif boş dönüş rotası var
**Adımlar**:
1. ListingPage'e git
2. Şehir olarak "Kütahya" seç
3. Ara butonuna tıkla

**Beklenen Sonuç**:
- Boş dönüş araçları yeşil badge ile gösterilir
- "X boş dönüş aracı" sayısı doğru gösterilir
- İndirim yüzdesi gösterilir
- Rota bilgisi (Nereden → Nereye) gösterilir

### TC-005: Boş Dönüş Filtreleme Toggle
**Önkoşul**: Hem service_area hem return_route sonuçları var
**Adımlar**:
1. ListingPage'de arama yap
2. "Boş Dönüş Araçlarını Göster" toggle'ını kapat
3. Toggle'ı tekrar aç

**Beklenen Sonuç**:
- Toggle kapalıyken sadece service_area partnerları gösterilir
- Toggle açıkken tüm partnerlar gösterilir

### TC-006: Admin - Partner Hizmet Bölgeleri Görüntüleme
**Önkoşul**: Admin hesabı ile giriş yapılmış
**Adımlar**:
1. Admin Dashboard > Hizmet Bölgeleri'ne git
2. Sol listeden bir partner seç
3. "Hizmet Bölgeleri" tabına tıkla

**Beklenen Sonuç**:
- Seçili partnerin tüm hizmet bölgeleri listelenir
- Ana bölge işaretli gösterilir
- Aktif/Pasif durumu doğru gösterilir

### TC-007: Admin - Boş Dönüş Rotaları Görüntüleme
**Önkoşul**: Admin hesabı ile giriş yapılmış
**Adımlar**:
1. Admin Dashboard > Hizmet Bölgeleri'ne git
2. Sol listeden bir partner seç
3. "Boş Dönüş Rotaları" tabına tıkla
4. Şehir filtresi ile ara
5. Durum filtresi ile filtrele

**Beklenen Sonuç**:
- Tüm rotalar listelenir
- Filtreler doğru çalışır
- Rota detayları (şehirler, tarih, araç) doğru gösterilir

### TC-008: Negatif - Geçmiş Tarihli Rota Ekleme
**Önkoşul**: Partner hesabı ile giriş yapılmış
**Adımlar**:
1. Boş Dönüş Rotaları'na git
2. Geçmiş bir tarih seç
3. Kaydet'e tıkla

**Beklenen Sonuç**:
- Hata mesajı gösterilir
- Rota kaydedilmez

### TC-009: Negatif - Aynı Çıkış/Varış Şehri
**Önkoşul**: Partner hesabı ile giriş yapılmış
**Adımlar**:
1. Boş Dönüş Rotaları'na git
2. Çıkış ve varış şehri aynı seç
3. Kaydet'e tıkla

**Beklenen Sonuç**:
- Validation hatası gösterilir
- Rota kaydedilmez

### TC-010: Performans - Çoklu Partner Araması
**Önkoşul**: 100+ partner, 50+ aktif rota
**Adımlar**:
1. İstanbul'da arama yap
2. Response süresini ölç

**Beklenen Sonuç**:
- Sonuçlar 500ms altında gelir
- GIN index kullanılır (EXPLAIN ile doğrula)
