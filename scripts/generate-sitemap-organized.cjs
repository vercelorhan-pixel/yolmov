/**
 * Organized Sitemap Generator
 * Sitemap Index mimarisi ile organize edilmiş sitemap yapısı
 * 
 * Yapı:
 * - sitemap.xml (INDEX)
 * - sitemap-static.xml
 * - sitemap-customer-seo.xml
 * - sitemap-partner-seo.xml
 * - sitemap-brands.xml
 * - sitemap-intercity.xml
 * - sitemap-special-vehicles.xml
 * - sitemap-on-duty.xml
 * - sitemap-special-locations.xml
 * - sitemap-pricing.xml
 */

const fs = require('fs');
const path = require('path');

// 🔥 YENİ: Veri Köprüsü - constants.ts yerine cities-data.cjs kullanıyoruz
const { getAllCityDistrictPairs, getAllCitySlugs } = require('./cities-data.cjs');

const BASE_URL = 'https://yolmov.com';
const SERVICES = ['cekici', 'aku', 'lastik', 'yakit', 'anahtar'];
const OUTPUT_DIR = path.join(__dirname, '../public');

// 🔥 YENİ: İl/İlçe verisi artık cities-data.cjs'den geliyor
function getCityDistrictPairs() {
  return getAllCityDistrictPairs();
}

// ESKİ FONKSİYON - ARTIK KULLANILMIYOR (Yedek olarak duruyor)
function extractCitiesDistrictsFromSitemap() {
  // Bu fonksiyon artık kullanılmıyor, getCityDistrictPairs() kullanın
  console.log('⚠️  extractCitiesDistrictsFromSitemap() deprecated - getCityDistrictPairs() kullanın');
  return getCityDistrictPairs();
}

// XML Header
function getXMLHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
}

function getXMLFooter() {
  return `</urlset>`;
}

// 1. Statik Sayfalar Sitemap
function generateStaticSitemap() {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/hakkimizda', priority: '0.8', changefreq: 'monthly' },
    { url: '/hizmetler', priority: '0.9', changefreq: 'weekly' },
    { url: '/sss', priority: '0.7', changefreq: 'monthly' },
    { url: '/iletisim', priority: '0.8', changefreq: 'monthly' },
    { url: '/kariyer', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/kampanyalar', priority: '0.8', changefreq: 'weekly' },
    { url: '/gizlilik-politikasi', priority: '0.5', changefreq: 'yearly' },
    { url: '/kullanim-kosullari', priority: '0.5', changefreq: 'yearly' }
  ];

  let xml = getXMLHeader() + '\n';
  
  staticPages.forEach(page => {
    xml += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-static.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count: staticPages.length, path: filePath };
}

// 2. Müşteri SEO Sayfaları Sitemap
function generateCustomerSEOSitemap() {
  const cityDistrictPairs = getCityDistrictPairs(); // 🔥 YENİ: cities-data.cjs'den
  
  let xml = getXMLHeader() + '\n';
  let count = 0;

  SERVICES.forEach(service => {
    cityDistrictPairs.forEach(({ city, district }) => {
      xml += `  <url>
    <loc>${BASE_URL}/${service}/${city}/${district}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
      count++;
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-customer-seo.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 3. Partner SEO Sayfaları Sitemap
function generatePartnerSEOSitemap() {
  const cityDistrictPairs = getCityDistrictPairs(); // 🔥 YENİ: cities-data.cjs'den
  
  let xml = getXMLHeader() + '\n';
  let count = 0;

  SERVICES.forEach(service => {
    cityDistrictPairs.forEach(({ city, district }) => {
      xml += `  <url>
    <loc>${BASE_URL}/partner-ol/${service}/${city}/${district}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
      count++;
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-partner-seo.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 4. Marka Sayfaları Sitemap
function generateBrandsSitemap() {
  const brands = [
    'tesla', 'bmw', 'mercedes', 'audi', 'volkswagen',
    'renault', 'peugeot', 'citroen', 'fiat', 'ford',
    'opel', 'toyota', 'honda', 'nissan', 'hyundai',
    'kia', 'mazda', 'skoda', 'seat', 'volvo',
    'land-rover', 'jeep', 'chevrolet', 'dacia', 'mg', 'alfa-romeo'
  ];

  let xml = getXMLHeader() + '\n';

  brands.forEach(brand => {
    xml += `  <url>
    <loc>${BASE_URL}/marka/${brand}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-brands.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count: brands.length, path: filePath };
}

// ============================================================================
// 🚀 YENİ PROGRAMATIK SEO STRATEJİLERİ
// ============================================================================

// 5. Şehirler Arası Çekici Sitemap (High Ticket - 6,480 sayfa)
function generateIntercitySitemap() {
  const cities = [
    'adana', 'adiyaman', 'afyonkarahisar', 'agri', 'aksaray', 'amasya', 'ankara', 'antalya',
    'ardahan', 'artvin', 'aydin', 'balikesir', 'bartin', 'batman', 'bayburt', 'bilecik',
    'bingol', 'bitlis', 'bolu', 'burdur', 'bursa', 'canakkale', 'cankiri', 'corum',
    'denizli', 'diyarbakir', 'duzce', 'edirne', 'elazig', 'erzincan', 'erzurum', 'eskisehir',
    'gaziantep', 'giresun', 'gumushane', 'hakkari', 'hatay', 'igdir', 'isparta', 'istanbul',
    'izmir', 'kahramanmaras', 'karabuk', 'karaman', 'kars', 'kastamonu', 'kayseri', 'kirikkale',
    'kirklareli', 'kirsehir', 'kilis', 'kocaeli', 'konya', 'kutahya', 'malatya', 'manisa',
    'mardin', 'mersin', 'mugla', 'mus', 'nevsehir', 'nigde', 'ordu', 'osmaniye',
    'rize', 'sakarya', 'samsun', 'siirt', 'sinop', 'sivas', 'sanliurfa', 'sirnak',
    'tekirdag', 'tokat', 'trabzon', 'tunceli', 'usak', 'van', 'yalova', 'yozgat', 'zonguldak'
  ];

  let xml = getXMLHeader() + '\n';
  let count = 0;

  cities.forEach(fromCity => {
    cities.forEach(toCity => {
      if (fromCity !== toCity) {
        xml += `  <url>
    <loc>${BASE_URL}/sehirler-arasi-cekici/${fromCity}-${toCity}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
        count++;
      }
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-intercity.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 6. Özel Araç Taşıma Sitemap (Niş Pazar - 5,838 sayfa)
function generateSpecialVehicleSitemap() {
  const cityDistrictPairs = getCityDistrictPairs(); // 🔥 YENİ: cities-data.cjs'den
  const vehicleTypes = ['tekne', 'forklift', 'karavan', 'motosiklet', 'klasik-arac', 'is-makinesi'];
  
  let xml = getXMLHeader() + '\n';
  let count = 0;

  vehicleTypes.forEach(vehicleType => {
    cityDistrictPairs.forEach(({ city, district }) => {
      xml += `  <url>
    <loc>${BASE_URL}/tasima/${vehicleType}/${city}/${district}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
      count++;
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-special-vehicles.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 7. Nöbetçi Servisler Sitemap (Aciliyet - 4,865 sayfa)
function generateOnDutySitemap() {
  const cityDistrictPairs = getCityDistrictPairs(); // 🔥 YENİ: cities-data.cjs'den
  const services = ['lastikci', 'aku', 'cekici', 'oto-elektrik', 'cam'];
  
  let xml = getXMLHeader() + '\n';
  let count = 0;

  services.forEach(service => {
    cityDistrictPairs.forEach(({ city, district }) => {
      xml += `  <url>
    <loc>${BASE_URL}/nobetci/${service}/${city}/${district}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
      count++;
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-on-duty.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 8. Özel Lokasyonlar Sitemap (Mikro Hedefleme - 20 sayfa)
function generateSpecialLocationsSitemap() {
  const locations = [
    // Otoyollar
    'tem-otoyolu', 'kuzey-marmara-otoyolu', 'o-3-otoyolu', 'o-4-otoyolu', 'ankara-izmir-otoyolu',
    // Havalimanları
    'istanbul-havalimani', 'sabiha-gokcen', 'esenboga-havalimani', 'izmir-adnan-menderes', 'antalya-havalimani',
    // Sanayi Bölgeleri
    'ostim-sanayi', 'ikitelli-osb', 'dudullu-osb', 'gebze-osb', 'ege-serbest-bolge',
    // Oto Sanayi
    'maslak-oto-sanayi', 'mecidiyekoy-oto-sanayi', 'topkapi-oto-sanayi', 'kozyatagi-oto-sanayi'
  ];

  let xml = getXMLHeader() + '\n';

  locations.forEach(location => {
    xml += `  <url>
    <loc>${BASE_URL}/cekici/${location}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-special-locations.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count: locations.length, path: filePath };
}

// 9. Fiyat Sayfaları Sitemap (Bilgi Arayanlar - 486 sayfa)
function generatePricingSitemap() {
  const cities = [
    'adana', 'adiyaman', 'afyonkarahisar', 'agri', 'aksaray', 'amasya', 'ankara', 'antalya',
    'ardahan', 'artvin', 'aydin', 'balikesir', 'bartin', 'batman', 'bayburt', 'bilecik',
    'bingol', 'bitlis', 'bolu', 'burdur', 'bursa', 'canakkale', 'cankiri', 'corum',
    'denizli', 'diyarbakir', 'duzce', 'edirne', 'elazig', 'erzincan', 'erzurum', 'eskisehir',
    'gaziantep', 'giresun', 'gumushane', 'hakkari', 'hatay', 'igdir', 'isparta', 'istanbul',
    'izmir', 'kahramanmaras', 'karabuk', 'karaman', 'kars', 'kastamonu', 'kayseri', 'kirikkale',
    'kirklareli', 'kirsehir', 'kilis', 'kocaeli', 'konya', 'kutahya', 'malatya', 'manisa',
    'mardin', 'mersin', 'mugla', 'mus', 'nevsehir', 'nigde', 'ordu', 'osmaniye',
    'rize', 'sakarya', 'samsun', 'siirt', 'sinop', 'sivas', 'sanliurfa', 'sirnak',
    'tekirdag', 'tokat', 'trabzon', 'tunceli', 'usak', 'van', 'yalova', 'yozgat', 'zonguldak'
  ];
  
  const services = ['cekici', 'oto-kurtarma', 'lastik-degisimi', 'aku-takviyesi', 'sehirler-arasi', 'yakit-yardimi'];
  const year = 2025;
  
  let xml = getXMLHeader() + '\n';
  let count = 0;

  services.forEach(service => {
    cities.forEach(city => {
      xml += `  <url>
    <loc>${BASE_URL}/fiyatlari/${service}/${city}/${year}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>\n`;
      count++;
    });
  });

  xml += getXMLFooter();

  const filePath = path.join(OUTPUT_DIR, 'sitemap-pricing.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return { count, path: filePath };
}

// 5. Sitemap Index (Ana Sitemap)
function generateSitemapIndex(sitemaps) {
  const lastmod = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  sitemaps.forEach(sitemap => {
    xml += `  <sitemap>
    <loc>${BASE_URL}/${sitemap.filename}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
`;
  });

  xml += `</sitemapindex>`;

  const filePath = path.join(OUTPUT_DIR, 'sitemap.xml');
  fs.writeFileSync(filePath, xml, 'utf-8');
  
  return filePath;
}

// Ana İşlem
function generateAllSitemaps() {
  console.log('\n🚀 ORGANIZE SİTEMAP OLUŞTURULUYOR...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  // 1. Statik Sayfalar
  console.log('📄 Statik sayfalar oluşturuluyor...');
  const staticResult = generateStaticSitemap();
  results.push({
    name: 'Statik Sayfalar',
    filename: 'sitemap-static.xml',
    count: staticResult.count,
    size: (fs.statSync(staticResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${staticResult.count} sayfa - ${results[0].size} KB\n`);

  // 2. Müşteri SEO
  console.log('🚗 Müşteri SEO sayfaları oluşturuluyor...');
  const customerResult = generateCustomerSEOSitemap();
  results.push({
    name: 'Müşteri SEO',
    filename: 'sitemap-customer-seo.xml',
    count: customerResult.count,
    size: (fs.statSync(customerResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${customerResult.count.toLocaleString()} sayfa - ${results[1].size} KB\n`);

  // 3. Partner SEO
  console.log('💼 Partner SEO sayfaları oluşturuluyor...');
  const partnerResult = generatePartnerSEOSitemap();
  results.push({
    name: 'Partner SEO',
    filename: 'sitemap-partner-seo.xml',
    count: partnerResult.count,
    size: (fs.statSync(partnerResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${partnerResult.count.toLocaleString()} sayfa - ${results[2].size} KB\n`);

  // 4. Markalar
  console.log('🏷️  Marka sayfaları oluşturuluyor...');
  const brandsResult = generateBrandsSitemap();
  results.push({
    name: 'Markalar',
    filename: 'sitemap-brands.xml',
    count: brandsResult.count,
    size: (fs.statSync(brandsResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${brandsResult.count} sayfa - ${results[3].size} KB\n`);

  // 5. Şehirler Arası (YENİ - High Ticket)
  console.log('🚛 Şehirler Arası Çekici sayfaları oluşturuluyor...');
  const intercityResult = generateIntercitySitemap();
  results.push({
    name: 'Şehirler Arası',
    filename: 'sitemap-intercity.xml',
    count: intercityResult.count,
    size: (fs.statSync(intercityResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${intercityResult.count.toLocaleString()} sayfa - ${results[4].size} KB\n`);

  // 6. Özel Araç Taşıma (YENİ - Niş Pazar)
  console.log('🏎️  Özel Araç Taşıma sayfaları oluşturuluyor...');
  const specialVehicleResult = generateSpecialVehicleSitemap();
  results.push({
    name: 'Özel Araç',
    filename: 'sitemap-special-vehicles.xml',
    count: specialVehicleResult.count,
    size: (fs.statSync(specialVehicleResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${specialVehicleResult.count.toLocaleString()} sayfa - ${results[5].size} KB\n`);

  // 7. Nöbetçi Servisler (YENİ - Aciliyet)
  console.log('🌙 Nöbetçi Servis sayfaları oluşturuluyor...');
  const onDutyResult = generateOnDutySitemap();
  results.push({
    name: 'Nöbetçi Servisler',
    filename: 'sitemap-on-duty.xml',
    count: onDutyResult.count,
    size: (fs.statSync(onDutyResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${onDutyResult.count.toLocaleString()} sayfa - ${results[6].size} KB\n`);

  // 8. Özel Lokasyonlar (YENİ - Mikro Hedefleme)
  console.log('🏭 Özel Lokasyon sayfaları oluşturuluyor...');
  const specialLocationsResult = generateSpecialLocationsSitemap();
  results.push({
    name: 'Özel Lokasyonlar',
    filename: 'sitemap-special-locations.xml',
    count: specialLocationsResult.count,
    size: (fs.statSync(specialLocationsResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${specialLocationsResult.count} sayfa - ${results[7].size} KB\n`);

  // 9. Fiyat Sayfaları (YENİ - Bilgi Arayanlar)
  console.log('🏷️  Fiyat sayfaları oluşturuluyor...');
  const pricingResult = generatePricingSitemap();
  results.push({
    name: 'Fiyat Sayfaları',
    filename: 'sitemap-pricing.xml',
    count: pricingResult.count,
    size: (fs.statSync(pricingResult.path).size / 1024).toFixed(2)
  });
  console.log(`   ✅ ${pricingResult.count.toLocaleString()} sayfa - ${results[8].size} KB\n`);

  // 10. Sitemap Index
  console.log('📑 Sitemap Index oluşturuluyor...');
  const indexPath = generateSitemapIndex(results);
  const indexSize = (fs.statSync(indexPath).size / 1024).toFixed(2);
  console.log(`   ✅ Ana sitemap - ${indexSize} KB\n`);

  // Özet Tablo
  const totalPages = results.reduce((sum, r) => sum + r.count, 0);
  const totalSize = results.reduce((sum, r) => sum + parseFloat(r.size), 0);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ÖZET RAPOR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  results.forEach(result => {
    console.log(`${result.name.padEnd(20)} ${result.count.toString().padStart(6)} sayfa  ${result.size.padStart(8)} KB`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${'TOPLAM'.padEnd(20)} ${totalPages.toString().padStart(6)} sayfa  ${totalSize.toFixed(2).padStart(8)} KB`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ Tüm sitemaplar başarıyla oluşturuldu!\n');
  console.log('📂 Oluşturulan Dosyalar:');
  console.log('   📍 /public/sitemap.xml (INDEX)');
  console.log('   📄 /public/sitemap-static.xml');
  console.log('   🚗 /public/sitemap-customer-seo.xml');
  console.log('   💼 /public/sitemap-partner-seo.xml');
  console.log('   🏷️  /public/sitemap-brands.xml');
  console.log('   🚛 /public/sitemap-intercity.xml');
  console.log('   🏎️  /public/sitemap-special-vehicles.xml');
  console.log('   🌙 /public/sitemap-on-duty.xml');
  console.log('   🏭 /public/sitemap-special-locations.xml');
  console.log('   🏷️  /public/sitemap-pricing.xml\n');
  
  console.log('🔗 Google Search Console\'a submit edilecek URL:');
  console.log(`   ${BASE_URL}/sitemap.xml\n`);
  
  console.log('🎯 STRATEJİ BAŞARI HİKAYESİ:');
  console.log('   1. Şehirler Arası: 20K-50K TL işler 🚛');
  console.log('   2. Özel Araç: 5K-10K TL niş pazar 🏎️');
  console.log('   3. Nöbetçi: %100 conversion 🌙');
  console.log('   4. Özel Lokasyonlar: Mikro hedefleme 🏭');
  console.log('   5. Fiyat: Lead generation 🏷️\n');
}

// Script çalıştır
try {
  generateAllSitemaps();
} catch (error) {
  console.error('❌ Hata:', error.message);
  console.error(error.stack);
  process.exit(1);
}
