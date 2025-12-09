# 🚀 Programmatic SEO - YolMov

Bu proje, Türkiye'nin **81 ili** ve **973 ilçesi** için **5 farklı hizmet** türünde otomatik SEO sayfaları oluşturur.

## 📊 İstatistikler

- **Toplam İl:** 81
- **Toplam İlçe:** 973
- **Hizmet Türü:** 5 (Çekici, Akü, Lastik, Yakıt, Anahtar)
- **Toplam Sayfa:** **4,865 SEO sayfası** 🎯

## 🗂️ Dosya Yapısı

```
yolmov/
├── lib/
│   └── seoData.ts              # SEO veri ve fonksiyonları
├── components/
│   ├── SEOServicePage.tsx      # Dinamik il/ilçe/hizmet sayfası
│   └── SEOStatsPage.tsx        # İstatistik sayfası
├── scripts/
│   └── generateSitemap.ts      # Sitemap oluşturucu
└── public/
    ├── sitemap.xml             # Otomatik oluşturulan sitemap
    └── robots.txt              # Arama motoru kuralları
```

## 🎯 URL Yapısı

Sayfalar aşağıdaki formatta oluşturulur:

```
/{hizmet}/{il}/{ilce}
```

### Örnekler:

- `/cekici/istanbul/kadikoy` - Kadıköy Çekici Hizmeti
- `/aku/ankara/cankaya` - Çankaya Akü Takviyesi
- `/lastik/izmir/konak` - Konak Lastik Değişimi
- `/yakit/bursa/nilufer` - Nilüfer Yakıt Desteği
- `/anahtar/antalya/muratpasa` - Muratpaşa Anahtar Çilingir

## 🚀 Kullanım

### 1. İstatistikleri Görüntüle

Tarayıcıda şu URL'yi ziyaret edin:

```
https://yolmov.com/seo-istatistikler
```

Bu sayfa:
- Toplam sayfa sayısını
- Rastgele 50 örnek sayfa linkini
- Detaylı istatistikleri gösterir

### 2. Sitemap Oluştur

```bash
npm run sitemap
```

Bu komut `public/sitemap.xml` dosyasını oluşturur ve tüm SEO sayfalarını içerir.

### 3. Örnek Sayfayı Test Et

Tarayıcıda herhangi bir il/ilçe/hizmet kombinasyonunu test edin:

```
https://yolmov.com/cekici/istanbul/kadikoy
```

## 📈 SEO Özellikleri

Her sayfa şunları içerir:

### ✅ Meta Etiketleri
- **Title:** `{İlçe} {Hizmet} - {İl} | YolMov 7/24`
- **Description:** Bölgeye özel, anahtar kelime zengin açıklama
- **Keywords:** 10+ özel anahtar kelime
- **Canonical URL:** Duplicate content önleme

### ✅ Open Graph
- `og:title`
- `og:description`
- `og:url`
- `og:type`

### ✅ Structured Data (Schema.org)
- LocalBusiness
- PostalAddress
- Telefon ve çalışma saatleri

### ✅ İçerik Optimizasyonu
- **H1 Başlık:** Anahtar kelime odaklı
- **H2/H3 Alt Başlıklar:** İçerik hiyerarşisi
- **Internal Linking:** Diğer il/ilçe/hizmetlere linkler
- **Breadcrumb:** Google için navigasyon yolu
- **Call-to-Action:** Dönüşüm optimizasyonu

## 🔍 Google Indexing

### 1. Sitemap Gönderimi

Google Search Console'da sitemap'i gönderin:

```
https://yolmov.com/sitemap.xml
```

### 2. Robots.txt

`public/robots.txt` dosyası otomatik yapılandırılmıştır:
- Sitemap konumu belirtilmiş
- Crawl hızı ayarlanmış
- Admin/private sayfalar engellenmiş

### 3. İndeksleme Süresi

Google'ın 4,865 sayfayı indekslemesi:
- **Günlük limit:** ~100 sayfa/gün
- **Tahmini süre:** ~49 gün
- **Hızlandırma:** Sitemap göndermek + internal linking

## 🎨 Özelleştirme

### Yeni İl/İlçe Eklemek

`constants.ts` dosyasındaki `CITIES_WITH_DISTRICTS` objesine ekleyin:

```typescript
"YeniŞehir": ["İlçe1", "İlçe2", "İlçe3"]
```

### Yeni Hizmet Türü Eklemek

`lib/seoData.ts` dosyasında:

```typescript
export type ServiceType = 'cekici' | 'aku' | 'lastik' | 'yakit' | 'anahtar' | 'yeni-hizmet';
```

Ve `getServiceInfo()` fonksiyonuna ekleyin.

## 🧪 Test

### Manuel Test

1. `/seo-istatistikler` - İstatistik sayfasını kontrol et
2. Rastgele bir URL test et: `/cekici/istanbul/sisli`
3. Developer Tools > Network > HTML - Meta etiketleri kontrol et
4. Google Chrome Lighthouse - SEO skoru kontrol et

### Otomatik Test

```bash
# Tüm sayfa URL'lerini listele
curl https://yolmov.com/sitemap.xml

# Rastgele 10 sayfa test et
curl -I https://yolmov.com/cekici/istanbul/kadikoy
curl -I https://yolmov.com/aku/ankara/cankaya
# ... vb
```

## 📊 Beklenen Sonuçlar

### 1-2 Ay İçinde:
- ✅ 1000+ sayfa Google'da indekslenmiş
- ✅ Yerel aramalar için görünürlük artışı
- ✅ "kadıköy çekici", "ankara akü takviye" gibi long-tail anahtar kelimeler

### 3-6 Ay İçinde:
- ✅ Tüm sayfalar indekslenmiş
- ✅ İlk sayfa sıralamaları (yerel aramalar için)
- ✅ Organik trafik %200-300 artış

### 6-12 Ay İçinde:
- ✅ Rekabet avantajı (rakipler manuel sayfa oluşturuyor)
- ✅ Türkiye genelinde marka bilinirliği
- ✅ Sürekli organik trafik

## 🚨 Önemli Notlar

### ⚠️ Duplicate Content
Her sayfanın içeriği **benzersiz** olmalıdır. Şu anda:
- Başlık/description her sayfa için farklı
- İçerik şablonu aynı ama veriler dinamik
- Canonical URL her sayfada farklı

### ⚠️ Sitemap Boyutu
Google sitemap limiti: **50,000 URL** veya **50 MB**

Mevcut durum:
- ✅ 4,865 URL (limit altında)
- ✅ ~500 KB (limit altında)

### ⚠️ Crawl Budget
Google her siteye günlük crawl limiti koyar. Şunları yapın:
- ✅ Sitemap gönderimi
- ✅ Internal linking (her sayfa birbirine bağlı)
- ✅ robots.txt ile gereksiz sayfaları engelle
- ✅ Hızlı site (Vite build optimization)

## 📞 Destek

Sorular için:
- GitHub Issues
- Email: support@yolmov.com

---

**Hazırlayan:** YolMov Geliştirme Ekibi  
**Tarih:** Aralık 2025  
**Versiyon:** 1.0
