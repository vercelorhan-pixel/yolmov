#!/usr/bin/env node

/**
 * Google Search Console - TÜM Sitemapları Ayrı Ayrı Gönderimi
 * 
 * Bu script tüm sitemap dosyalarını Google Search Console'a ayrı ayrı gönderir.
 * Bu sayede Google her sitemap'i ayrı ayrı tarar ve tüm sayfaları görür.
 * 
 * Kullanım:
 *   node scripts/submit-all-sitemaps-to-gsc.cjs
 *   npm run gsc:submit-all
 */

const { google } = require('googleapis');
const path = require('path');

// Konfigürasyon
const CONFIG = {
  siteUrl: 'sc-domain:yolmov.com',
  baseUrl: 'https://yolmov.com',
  credentialsPath: path.join(__dirname, '..', 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/webmasters'],
  
  // Tüm sitemap dosyaları
  sitemaps: [
    { file: 'sitemap.xml', name: 'Index (Ana)', pages: 'Index' },
    { file: 'sitemap-static.xml', name: 'Statik Sayfalar', pages: 10 },
    { file: 'sitemap-customer-seo.xml', name: 'Müşteri SEO', pages: 4865 },
    { file: 'sitemap-partner-seo.xml', name: 'Partner SEO', pages: 4865 },
    { file: 'sitemap-brands.xml', name: 'Markalar', pages: 26 },
    { file: 'sitemap-intercity.xml', name: 'Şehirler Arası', pages: 6480 },
    { file: 'sitemap-special-vehicles.xml', name: 'Özel Araç', pages: 5838 },
    { file: 'sitemap-on-duty.xml', name: 'Nöbetçi Servisler', pages: 4865 },
    { file: 'sitemap-special-locations.xml', name: 'Özel Lokasyonlar', pages: 19 },
    { file: 'sitemap-pricing.xml', name: 'Fiyat Sayfaları', pages: 486 },
  ]
};

/**
 * Google Search Console'a kimlik doğrulama
 */
async function authenticate() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CONFIG.credentialsPath,
      scopes: CONFIG.scopes,
    });

    console.log('🔐 Kimlik doğrulaması yapılıyor...');
    const client = await auth.getClient();
    console.log('✅ Kimlik doğrulama başarılı!\n');
    
    return google.searchconsole({
      version: 'v1',
      auth: client
    });
  } catch (error) {
    console.error('❌ Kimlik doğrulama hatası:', error.message);
    throw error;
  }
}

/**
 * Tek bir sitemap'i gönder
 */
async function submitSingleSitemap(searchconsole, sitemap) {
  const sitemapUrl = `${CONFIG.baseUrl}/${sitemap.file}`;
  
  try {
    await searchconsole.sitemaps.submit({
      siteUrl: CONFIG.siteUrl,
      feedpath: sitemapUrl
    });
    
    console.log(`   ✅ ${sitemap.name} (${sitemap.pages} sayfa)`);
    return { success: true, sitemap };
    
  } catch (error) {
    console.log(`   ❌ ${sitemap.name}: ${error.message}`);
    return { success: false, sitemap, error: error.message };
  }
}

/**
 * Tüm sitemapları gönder
 */
async function submitAllSitemaps(searchconsole) {
  console.log('📤 TÜM SİTEMAPLAR GÖNDERİLİYOR...');
  console.log('━'.repeat(50));
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const sitemap of CONFIG.sitemaps) {
    const result = await submitSingleSitemap(searchconsole, sitemap);
    
    if (result.success) {
      results.success.push(sitemap);
    } else {
      results.failed.push({ ...sitemap, error: result.error });
    }
    
    // Rate limiting - Google API'sine yük bindirmemek için
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('━'.repeat(50));
  
  // Özet
  console.log(`\n📊 Gönderim Özeti:`);
  console.log(`   ✅ Başarılı: ${results.success.length}/${CONFIG.sitemaps.length}`);
  
  if (results.failed.length > 0) {
    console.log(`   ❌ Başarısız: ${results.failed.length}`);
    results.failed.forEach(f => {
      console.log(`      - ${f.name}: ${f.error}`);
    });
  }
  
  // Toplam sayfa sayısı
  const totalPages = results.success
    .filter(s => typeof s.pages === 'number')
    .reduce((sum, s) => sum + s.pages, 0);
  
  console.log(`\n📄 Toplam Gönderilen Sayfa: ${totalPages.toLocaleString()}`);
  
  return results;
}

/**
 * Mevcut sitemapleri listele
 */
async function listSitemaps(searchconsole) {
  try {
    console.log('\n📋 Google Search Console\'daki Sitemap Durumu:');
    console.log('━'.repeat(70));
    
    const response = await searchconsole.sitemaps.list({
      siteUrl: CONFIG.siteUrl
    });

    if (!response.data.sitemap || response.data.sitemap.length === 0) {
      console.log('   Henüz sitemap yok.');
      return;
    }

    let totalSubmitted = 0;
    let totalIndexed = 0;
    
    response.data.sitemap.forEach(sitemap => {
      const shortPath = sitemap.path.replace('https://yolmov.com/', '');
      const status = sitemap.isPending ? '⏳' : '✅';
      
      let submitted = 0;
      let indexed = 0;
      
      if (sitemap.contents) {
        sitemap.contents.forEach(content => {
          submitted += content.submitted || 0;
          indexed += content.indexed || 0;
        });
      }
      
      totalSubmitted += submitted;
      totalIndexed += indexed;
      
      console.log(`${status} ${shortPath.padEnd(35)} | ${submitted.toString().padStart(6)} gönderildi | ${indexed.toString().padStart(6)} indekslendi`);
    });
    
    console.log('━'.repeat(70));
    console.log(`📊 TOPLAM: ${totalSubmitted.toLocaleString()} gönderildi, ${totalIndexed.toLocaleString()} indekslendi`);
    
  } catch (error) {
    console.error('❌ Sitemap listesi alınamadı:', error.message);
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('');
  console.log('🚀 Yolmov - Google Search Console TÜM Sitemap Gönderimi');
  console.log('═'.repeat(55));
  console.log('');
  
  try {
    // Kimlik doğrulama
    const searchconsole = await authenticate();
    
    // Tüm sitemapları gönder
    await submitAllSitemaps(searchconsole);
    
    // Durum kontrol et
    await listSitemaps(searchconsole);
    
    console.log('\n✨ İşlem tamamlandı!');
    console.log('');
    console.log('💡 İpucu: Google tüm sitemapları işlemesi 24-72 saat sürebilir.');
    console.log('   Durumu kontrol etmek için: npm run gsc:status');
    console.log('');
    
  } catch (error) {
    console.error('\n💥 İşlem başarısız:', error.message);
    process.exit(1);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { authenticate, submitAllSitemaps, listSitemaps };
