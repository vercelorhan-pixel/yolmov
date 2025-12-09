/**
 * Sitemap Generator
 * Müşteri ve Partner SEO sayfaları için sitemap oluşturur
 */

const fs = require('fs');
const path = require('path');

// SEO Data - constants.ts yerine seoData.ts'den okuyacağız
// Basit çözüm: Mevcut sitemap'ten city/district bilgisini parse edelim
const currentSitemapPath = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://yolmov.com';
const SERVICES = ['cekici', 'aku', 'lastik', 'yakit', 'anahtar'];

// Mevcut sitemap'ten city ve district çiftlerini çıkar
function extractCitiesDistrictsFromSitemap() {
  try {
    const sitemap = fs.readFileSync(currentSitemapPath, 'utf-8');
    const urlPattern = /<loc>https:\/\/yolmov\.com\/[^<]+<\/loc>/g;
    const matches = sitemap.match(urlPattern) || [];
    
    const cityDistrictPairs = new Set();
    
    matches.forEach(match => {
      // /cekici/istanbul/kadikoy formatındaki URL'leri parse et
      const urlMatch = match.match(/\/(cekici|aku|lastik|yakit|anahtar)\/([^\/]+)\/([^<]+)</);
      if (urlMatch) {
        const city = urlMatch[2];
        const district = urlMatch[3];
        cityDistrictPairs.add(`${city}|${district}`);
      }
    });
    
    return Array.from(cityDistrictPairs).map(pair => {
      const [city, district] = pair.split('|');
      return { city, district };
    });
  } catch (error) {
    console.error('⚠️  Mevcut sitemap okunamadı, varsayılan veri kullanılıyor');
    return [];
  }
}

// Türkçe karakterleri URL-friendly hale getir
function slugify(text) {
  const trMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };

  return text
    .split('')
    .map(char => trMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sitemap URL oluştur
function createSitemapURL(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// Statik sayfalar
function generateStaticPages() {
  const today = new Date().toISOString().split('T')[0];
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/hakkimizda', priority: '0.8', changefreq: 'monthly' },
    { url: '/hizmetler', priority: '0.9', changefreq: 'weekly' },
    { url: '/kampanyalar', priority: '0.7', changefreq: 'weekly' },
    { url: '/sss', priority: '0.6', changefreq: 'monthly' },
    { url: '/iletisim', priority: '0.7', changefreq: 'monthly' },
    { url: '/kariyer', priority: '0.5', changefreq: 'weekly' },
    { url: '/blog', priority: '0.6', changefreq: 'daily' },
    { url: '/partner-basvuru', priority: '0.9', changefreq: 'weekly' },
    { url: '/fiyat-hesapla', priority: '0.8', changefreq: 'weekly' }
  ];

  return staticPages.map(page => 
    createSitemapURL(page.url, today, page.changefreq, page.priority)
  ).join('\n');
}

// Müşteri SEO sayfaları
function generateCustomerSEOPages() {
  const today = new Date().toISOString().split('T')[0];
  const urls = [];
  const cityDistrictPairs = extractCitiesDistrictsFromSitemap();

  cityDistrictPairs.forEach(({ city, district }) => {
    SERVICES.forEach(service => {
      const url = `/${service}/${city}/${district}`;
      urls.push(createSitemapURL(url, today, 'weekly', '0.8'));
    });
  });

  return urls.join('\n');
}

// Partner SEO sayfaları
function generatePartnerSEOPages() {
  const today = new Date().toISOString().split('T')[0];
  const urls = [];
  const cityDistrictPairs = extractCitiesDistrictsFromSitemap();

  cityDistrictPairs.forEach(({ city, district }) => {
    SERVICES.forEach(service => {
      const url = `/partner-ol/${service}/${city}/${district}`;
      urls.push(createSitemapURL(url, today, 'weekly', '0.7'));
    });
  });

  return urls.join('\n');
}

// Marka sayfaları
function generateBrandPages() {
  const today = new Date().toISOString().split('T')[0];
  const brands = [
    'fiat', 'renault', 'volkswagen', 'ford', 'toyota', 'hyundai', 'opel',
    'peugeot', 'honda', 'citroen', 'dacia', 'skoda', 'kia', 'seat', 'nissan',
    'bmw', 'mercedes', 'audi', 'volvo', 'land-rover', 'porsche',
    'tesla', 'togg', 'chery'
  ];

  return brands.map(brand => 
    createSitemapURL(`/marka/${brand}`, today, 'weekly', '0.7')
  ).join('\n');
}

// Ana sitemap.xml oluştur
function generateMainSitemap() {
  console.log('📄 Ana sitemap.xml oluşturuluyor...');
  
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const footer = `
</urlset>`;

  const staticPages = generateStaticPages();
  const customerPages = generateCustomerSEOPages();
  const partnerPages = generatePartnerSEOPages();
  const brandPages = generateBrandPages();

  const sitemap = header + '\n' + 
    staticPages + '\n' + 
    customerPages + '\n' + 
    partnerPages + '\n' + 
    brandPages + 
    footer;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf-8');

  const urlCount = (sitemap.match(/<url>/g) || []).length;
  const fileSize = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);

  console.log('✅ Sitemap oluşturuldu!');
  console.log(`   📊 Toplam URL: ${urlCount.toLocaleString()}`);
  console.log(`   📦 Dosya boyutu: ${fileSize} MB`);
  console.log(`   📍 Konum: ${outputPath}`);

  return { urlCount, fileSize };
}

// İstatistikler
function printStats() {
  const cityDistrictPairs = extractCitiesDistrictsFromSitemap();
  const districtCount = cityDistrictPairs.length;
  
  const customerPages = districtCount * SERVICES.length;
  const partnerPages = districtCount * SERVICES.length;
  const brandPages = 26;
  const staticPages = 10;
  
  const total = staticPages + customerPages + partnerPages + brandPages;

  console.log('\n📊 SITEMAP İSTATİSTİKLERİ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 İlçe çiftleri: ${districtCount}`);
  console.log(`🛠️  Hizmetler: ${SERVICES.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📄 Statik sayfalar: ${staticPages}`);
  console.log(`🚗 Müşteri SEO: ${customerPages.toLocaleString()}`);
  console.log(`💼 Partner SEO: ${partnerPages.toLocaleString()}`);
  console.log(`🏷️  Marka sayfaları: ${brandPages}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ TOPLAM: ${total.toLocaleString()} sayfa`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Script çalıştır
try {
  printStats();
  generateMainSitemap();
  console.log('\n🚀 Sitemap başarıyla oluşturuldu!');
  console.log('💡 Google Search Console\'a submit edebilirsiniz.\n');
} catch (error) {
  console.error('❌ Hata:', error.message);
  process.exit(1);
}
