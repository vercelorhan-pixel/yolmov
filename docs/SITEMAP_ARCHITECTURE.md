# Sitemap Mimarisi

Yolmov için organize edilmiş sitemap yapısı. **Sitemap Index** mimarisi kullanılarak içerik kategorilerine göre ayrılmış sitemaplar.

## 📂 Dosya Yapısı

```
/public/
├── sitemap.xml                    (INDEX - Ana sitemap)
├── sitemap-static.xml             (Statik sayfalar)
├── sitemap-customer-seo.xml       (Müşteri SEO sayfaları)
├── sitemap-partner-seo.xml        (Partner SEO sayfaları)
└── sitemap-brands.xml             (Marka sayfaları)
```

## 📊 İçerik Dağılımı

| Sitemap | URL Sayısı | Boyut | Güncelleme Sıklığı |
|---------|-----------|-------|-------------------|
| **Statik Sayfalar** | 10 | 1.7 KB | Aylık/Günlük |
| **Müşteri SEO** | 4,865 | 819 KB | Haftalık |
| **Partner SEO** | 4,865 | 870 KB | Haftalık |
| **Markalar** | 26 | 4.3 KB | Aylık |
| **TOPLAM** | **9,766** | **1.7 MB** | - |

## 🎯 Sitemap İçerikleri

### 1. sitemap-static.xml
**Statik sayfalar** - 10 URL

```
- / (Ana Sayfa)
- /hakkimizda
- /hizmetler
- /sss
- /iletisim
- /kariyer
- /blog
- /kampanyalar
- /gizlilik-politikasi
- /kullanim-kosullari
```

**Priority**: 0.5 - 1.0  
**Changefreq**: daily, weekly, monthly, yearly

---

### 2. sitemap-customer-seo.xml
**Müşteri SEO sayfaları** - 4,865 URL

Format: `/{service}/{city}/{district}`

**Örnek URL'ler:**
```
/cekici/istanbul/kadikoy
/aku/ankara/cankaya
/lastik/izmir/bornova
/yakit/antalya/muratpasa
/anahtar/bursa/osmangazi
```

**Kapsam:**
- 973 ilçe çifti (şehir/ilçe)
- 5 hizmet türü (çekici, akü, lastik, yakıt, anahtar)
- **Toplam**: 973 × 5 = 4,865 sayfa

**Priority**: 0.8 (Yüksek öncelik)  
**Changefreq**: weekly

**Hedef Kitle**: B2C müşteriler (yol yardım arayanlar)

---

### 3. sitemap-partner-seo.xml
**Partner SEO sayfaları** - 4,865 URL

Format: `/partner-ol/{service}/{city}/{district}`

**Örnek URL'ler:**
```
/partner-ol/cekici/istanbul/kadikoy
/partner-ol/aku/ankara/cankaya
/partner-ol/lastik/izmir/bornova
/partner-ol/yakit/antalya/muratpasa
/partner-ol/anahtar/bursa/osmangazi
```

**Kapsam:**
- 973 ilçe çifti (şehir/ilçe)
- 5 hizmet türü (çekici, akü, lastik, yakıt, anahtar)
- **Toplam**: 973 × 5 = 4,865 sayfa

**Priority**: 0.7 (Orta-yüksek öncelik)  
**Changefreq**: weekly

**Hedef Kitle**: B2B partnerler (iş arayanlar, servis sağlayıcılar)

**Özellikler:**
- JobPosting Schema.org markup
- Lokalize kazanç bilgileri
- Talep tahminleri
- İş ilanı optimizasyonu (Google Jobs uyumlu)

---

### 4. sitemap-brands.xml
**Marka sayfaları** - 26 URL

Format: `/marka/{brand-slug}`

**Markalar:**
```
Tesla, BMW, Mercedes, Audi, Volkswagen, Renault, Peugeot, 
Citroen, Fiat, Ford, Opel, Toyota, Honda, Nissan, Hyundai, 
Kia, Mazda, Skoda, Seat, Volvo, Land Rover, Jeep, 
Chevrolet, Dacia, MG, Alfa Romeo
```

**Priority**: 0.7  
**Changefreq**: monthly

---

## 🚀 Kullanım

### Sitemap Oluşturma

```bash
# Tüm sitemapları oluştur
npm run sitemap

# Eski tek dosya sitemap (yedek)
npm run sitemap:old
```

### Script Çalıştırma

```bash
node scripts/generate-sitemap-organized.cjs
```

**Çıktı:**
```
✅ Tüm sitemaplar başarıyla oluşturuldu!

📂 Oluşturulan Dosyalar:
   📍 /public/sitemap.xml (INDEX)
   📄 /public/sitemap-static.xml
   🚗 /public/sitemap-customer-seo.xml
   💼 /public/sitemap-partner-seo.xml
   🏷️  /public/sitemap-brands.xml
```

---

## 🔍 Google Search Console

### Ana Sitemap URL
```
https://yolmov.com/sitemap.xml
```

Bu URL'yi Google Search Console'a submit edin. Sitemap Index yapısı sayesinde Google otomatik olarak tüm alt sitemapları keşfedecektir.

### Gönderim Adımları

1. [Google Search Console](https://search.google.com/search-console)'a giriş yapın
2. Sol menüden **"Sitemaps"** seçin
3. **"Yeni sitemap ekle"** alanına girin: `sitemap.xml`
4. **"Gönder"** butonuna tıklayın

### Beklenen İndeksleme Süresi

- Statik sayfalar: 1-3 gün
- Müşteri SEO: 30-45 gün (4,865 sayfa)
- Partner SEO: 30-45 gün (4,865 sayfa)
- Markalar: 7-14 gün

**Not**: Google günde ~200 sayfa indeksler, toplam indeksleme süresi 45-60 gün olabilir.

---

## 🏗️ Mimari Avantajlar

### 1. **Organize Yapı**
- Her içerik türü ayrı dosyada
- Hata ayıklama kolaylığı
- İndeksleme takibi

### 2. **Performans**
- 1.7 MB yerine 5 küçük dosya
- Google'ın parse süresi azalır
- Paralel indeksleme mümkün

### 3. **Ölçeklenebilirlik**
- Yeni kategoriler eklemek kolay
- Dosya boyutu limitleri aşılmaz (50MB limit)
- Her sitemap bağımsız güncellenebilir

### 4. **SEO Optimizasyonu**
- Priority değerleri kategoriye özel
- Changefreq kategoriye göre optimize
- İçerik türüne göre strateji

### 5. **Bakım Kolaylığı**
- Sadece değişen kategori güncellenebilir
- Debug ve test daha kolay
- Script modüler yapıda

---

## 🛠️ Teknik Detaylar

### Sitemap Index Formatı
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://yolmov.com/sitemap-static.xml</loc>
    <lastmod>2025-12-08T15:41:59.423Z</lastmod>
  </sitemap>
  <!-- ... diğer sitemaplar -->
</sitemapindex>
```

### URL Formatı
```xml
<url>
  <loc>https://yolmov.com/partner-ol/cekici/istanbul/kadikoy</loc>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
  <lastmod>2025-12-08</lastmod>
</url>
```

### Priority Değerleri
- **1.0**: Ana sayfa
- **0.9**: Hizmetler sayfası
- **0.8**: Müşteri SEO, İletişim
- **0.7**: Partner SEO, Markalar, SSS
- **0.6**: Kariyer
- **0.5**: Gizlilik, Şartlar

---

## 📈 Gelecek Geliştirmeler

- [ ] `sitemap-blog.xml` (Blog yazıları)
- [ ] `sitemap-campaigns.xml` (Kampanya detayları)
- [ ] `sitemap-cities.xml` (Şehir sayfaları)
- [ ] `sitemap-services.xml` (Hizmet detay sayfaları)
- [ ] Image sitemap (Görseller için ayrı sitemap)
- [ ] Video sitemap (Video içerikler için)
- [ ] News sitemap (Haber içerikler için)

---

## 📝 Notlar

- Sitemap her deployment'ta otomatik güncellenir
- Manuel güncelleme: `npm run sitemap`
- Dosyalar `/public` dizininde statik olarak servis edilir
- Netlify/Vercel otomatik deploy eder
- Sitemap Index sayesinde tek URL yeterli (Google'a)

---

## 🔗 İlgili Dökümanlar

- [Google Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Console Docs](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Sitemap Index Guide](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps)

---

**Son Güncelleme**: 8 Aralık 2025  
**Script Versiyonu**: v2.0 (Organized)  
**Toplam URL**: 9,766
