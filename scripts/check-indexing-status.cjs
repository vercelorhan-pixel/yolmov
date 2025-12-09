#!/usr/bin/env node

/**
 * Google Search Console - İndeksleme Durumu Kontrolü
 * 
 * Bu script yolmov.com'un Google indeksleme durumunu kontrol eder.
 * 
 * Kullanım:
 *   node scripts/check-indexing-status.cjs
 *   npm run gsc:status
 * 
 * Gereksinimler:
 *   - credentials.json (Google Cloud Service Account)
 *   - Search Console API erişimi
 */

const { google } = require('googleapis');
const path = require('path');

// Konfigürasyon
const CONFIG = {
  siteUrl: 'sc-domain:yolmov.com',
  credentialsPath: path.join(__dirname, '..', 'credentials.json'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
};

/**
 * Kimlik doğrulama
 */
async function authenticate() {
  const auth = new google.auth.GoogleAuth({
    keyFile: CONFIG.credentialsPath,
    scopes: CONFIG.scopes,
  });

  console.log('🔐 Kimlik doğrulaması yapılıyor...');
  const client = await auth.getClient();
  
  return google.searchconsole({
    version: 'v1',
    auth: client
  });
}

/**
 * Sitemap durumunu kontrol et
 */
async function checkSitemapStatus(searchconsole) {
  try {
    console.log('\n📊 Sitemap Durumu Kontrol Ediliyor...\n');
    
    const response = await searchconsole.sitemaps.list({
      siteUrl: CONFIG.siteUrl
    });

    if (!response.data.sitemap || response.data.sitemap.length === 0) {
      console.log('⚠️  Henüz sitemap gönderilmemiş!\n');
      console.log('Gönder: npm run gsc:submit\n');
      return;
    }

    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                         SITEMAP DURUMU                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

    response.data.sitemap.forEach((sitemap, index) => {
      console.log(`${index + 1}. 🗺️  ${sitemap.path}`);
      console.log(`   └─ Son Gönderim: ${new Date(sitemap.lastSubmitted).toLocaleString('tr-TR')}`);
      
      if (sitemap.lastDownloaded) {
        console.log(`   └─ Son İndirme: ${new Date(sitemap.lastDownloaded).toLocaleString('tr-TR')}`);
      }
      
      console.log(`   └─ Durum: ${sitemap.isPending ? '⏳ Google işliyor...' : '✅ İşlendi'}`);
      
      if (sitemap.contents && sitemap.contents.length > 0) {
        console.log(`   └─ İçerik:`);
        sitemap.contents.forEach(content => {
          const indexRate = content.submitted > 0 
            ? ((content.indexed / content.submitted) * 100).toFixed(1)
            : 0;
          
          console.log(`      • ${content.type}: ${content.indexed}/${content.submitted} indekslendi (${indexRate}%)`);
        });
      }
      
      if (sitemap.errors && sitemap.errors > 0) {
        console.log(`   └─ ❌ Hatalar: ${sitemap.errors}`);
      }
      if (sitemap.warnings && sitemap.warnings > 0) {
        console.log(`   └─ ⚠️  Uyarılar: ${sitemap.warnings}`);
      }
      
      console.log('');
    });

    // Toplam istatistikler
    const totalStats = response.data.sitemap.reduce((acc, sitemap) => {
      if (sitemap.contents) {
        sitemap.contents.forEach(content => {
          acc.submitted += content.submitted || 0;
          acc.indexed += content.indexed || 0;
        });
      }
      return acc;
    }, { submitted: 0, indexed: 0 });

    if (totalStats.submitted > 0) {
      const totalIndexRate = ((totalStats.indexed / totalStats.submitted) * 100).toFixed(2);
      
      console.log('─'.repeat(75));
      console.log(`📈 TOPLAM: ${totalStats.indexed.toLocaleString('tr-TR')}/${totalStats.submitted.toLocaleString('tr-TR')} sayfa indekslendi (${totalIndexRate}%)`);
      console.log('─'.repeat(75));
      
      if (totalIndexRate < 50) {
        console.log('\n💡 İpucu: İndeksleme oranı düşük. Google\'ın tüm sayfaları taraması 30-60 gün sürebilir.');
      } else if (totalIndexRate > 90) {
        console.log('\n🎉 Harika! İndeksleme oranı çok iyi!');
      }
    }

  } catch (error) {
    console.error('❌ Sitemap durumu alınamadı:', error.message);
    throw error;
  }
}

/**
 * Site'ın genel durumunu göster
 */
async function showSiteInfo(searchconsole) {
  try {
    console.log('\n🌐 Site Bilgileri:');
    console.log(`   URL: https://yolmov.com`);
    console.log(`   Search Console Property: ${CONFIG.siteUrl}`);
    console.log(`   Service Account: yolmov-seo-bot@yolmov-seo.iam.gserviceaccount.com`);
    
  } catch (error) {
    console.error('❌ Site bilgileri alınamadı:', error.message);
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('🔍 Yolmov - Google Search Console İndeksleme Durumu\n');
  
  try {
    const searchconsole = await authenticate();
    console.log('✅ Bağlantı başarılı!\n');
    
    await showSiteInfo(searchconsole);
    await checkSitemapStatus(searchconsole);
    
    console.log('\n✨ Kontrol tamamlandı!\n');
    
  } catch (error) {
    console.error('\n💥 Hata:', error.message);
    
    if (error.code === 403) {
      console.error('\n📝 Çözüm:');
      console.error('1. https://search.google.com/search-console/ adresine git');
      console.error('2. Settings → Users and permissions');
      console.error('3. Add user: yolmov-seo-bot@yolmov-seo.iam.gserviceaccount.com');
      console.error('4. Permission: Owner\n');
    }
    
    process.exit(1);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { authenticate, checkSitemapStatus };
