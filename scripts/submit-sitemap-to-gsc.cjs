#!/usr/bin/env node

/**
 * Google Search Console - Sitemap Gönderimi
 * 
 * Bu script yolmov.com sitemap.xml'ini Google Search Console'a otomatik gönderir.
 * 
 * Kullanım:
 *   node scripts/submit-sitemap-to-gsc.cjs
 *   npm run gsc:submit
 * 
 * Gereksinimler:
 *   - credentials.json (Google Cloud Service Account)
 *   - Search Console'da yolmov-seo-bot@yolmov-seo.iam.gserviceaccount.com Owner yetkisi
 */

const { google } = require('googleapis');
const path = require('path');

// Konfigürasyon
const CONFIG = {
  siteUrl: 'sc-domain:yolmov.com', // Domain property için sc-domain: prefix
  sitemapUrl: 'https://yolmov.com/sitemap.xml',
  credentialsPath: path.join(__dirname, '..', 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/webmasters']
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
    console.log('✅ Kimlik doğrulama başarılı!');
    
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
 * Sitemap'i Google Search Console'a gönder
 */
async function submitSitemap(searchconsole) {
  try {
    console.log('\n📤 Sitemap gönderiliyor...');
    console.log(`   Site: ${CONFIG.siteUrl}`);
    console.log(`   Sitemap: ${CONFIG.sitemapUrl}`);

    await searchconsole.sitemaps.submit({
      siteUrl: CONFIG.siteUrl,
      feedpath: CONFIG.sitemapUrl
    });

    console.log('✅ Sitemap başarıyla gönderildi!');
    console.log('🔍 Google indeksleme sürecini başlattı.');
    
  } catch (error) {
    if (error.code === 404) {
      console.error('❌ Site Search Console\'da bulunamadı!');
      console.error('   1. https://search.google.com/search-console/ adresine git');
      console.error('   2. Property ekle: yolmov.com');
      console.error('   3. Domain doğrulaması yap (DNS TXT record)');
    } else if (error.code === 403) {
      console.error('❌ Yetki hatası!');
      console.error('   Service account email\'ini Search Console\'a ekle:');
      console.error('   yolmov-seo-bot@yolmov-seo.iam.gserviceaccount.com');
      console.error('   Permission: Owner');
    } else {
      console.error('❌ Sitemap gönderme hatası:', error.message);
    }
    throw error;
  }
}

/**
 * Mevcut sitemapleri listele
 */
async function listSitemaps(searchconsole) {
  try {
    console.log('\n📋 Mevcut sitemaplar kontrol ediliyor...');
    
    const response = await searchconsole.sitemaps.list({
      siteUrl: CONFIG.siteUrl
    });

    if (!response.data.sitemap || response.data.sitemap.length === 0) {
      console.log('   Henüz sitemap yok.');
      return;
    }

    console.log('\n📊 Sitemap Durumu:');
    console.log('─'.repeat(80));
    
    response.data.sitemap.forEach(sitemap => {
      console.log(`\n🗺️  ${sitemap.path}`);
      console.log(`   Son Gönderim: ${sitemap.lastSubmitted || 'Bilinmiyor'}`);
      console.log(`   Son İndirme: ${sitemap.lastDownloaded || 'Henüz indirilmedi'}`);
      console.log(`   Durum: ${sitemap.isPending ? '⏳ İşleniyor' : '✅ İşlendi'}`);
      
      if (sitemap.contents) {
        sitemap.contents.forEach(content => {
          console.log(`   📄 ${content.type}: ${content.submitted || 0} gönderildi, ${content.indexed || 0} indekslendi`);
        });
      }
      
      if (sitemap.errors) {
        console.log(`   ⚠️  Hatalar: ${sitemap.errors}`);
      }
      if (sitemap.warnings) {
        console.log(`   ⚠️  Uyarılar: ${sitemap.warnings}`);
      }
    });
    
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Sitemap listesi alınamadı:', error.message);
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('🚀 Yolmov - Google Search Console Sitemap Gönderimi\n');
  
  try {
    // Kimlik doğrulama
    const searchconsole = await authenticate();
    
    // Sitemap gönder
    await submitSitemap(searchconsole);
    
    // Durum kontrol et
    await listSitemaps(searchconsole);
    
    console.log('\n✨ İşlem tamamlandı!\n');
    
  } catch (error) {
    console.error('\n💥 İşlem başarısız:', error.message);
    process.exit(1);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { authenticate, submitSitemap, listSitemaps };
