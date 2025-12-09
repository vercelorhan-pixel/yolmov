/**
 * SEO Sitemap Generator
 * Türkiye'nin tüm il/ilçe/hizmet kombinasyonları için sitemap.xml oluşturur
 * 
 * Kullanım: npm run sitemap
 */

import { generateAllSEOPages } from '../lib/seoData.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://yolmov.com';

function generateSitemap() {
  console.log('🗺️  SEO Sitemap oluşturuluyor...');

  const seoPages = generateAllSEOPages();
  
  // XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Statik sayfalar
  const staticPages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    { url: '/hakkimizda', priority: 0.8, changefreq: 'monthly' },
    { url: '/hizmetler', priority: 0.9, changefreq: 'weekly' },
    { url: '/kampanyalar', priority: 0.7, changefreq: 'weekly' },
    { url: '/sss', priority: 0.6, changefreq: 'monthly' },
    { url: '/iletisim', priority: 0.7, changefreq: 'monthly' },
    { url: '/kariyer', priority: 0.5, changefreq: 'weekly' },
    { url: '/blog', priority: 0.6, changefreq: 'daily' }
  ];

  staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // SEO sayfaları (il/ilçe/hizmet kombinasyonları)
  let addedCount = 0;
  seoPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += '  </url>\n';
    addedCount++;
  });

  xml += '</urlset>';

  // Dosyayı kaydet
  const publicDir = path.join(__dirname, '..', 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, xml, 'utf-8');

  console.log(`✅ Sitemap oluşturuldu: ${sitemapPath}`);
  console.log(`📊 İstatistikler:`);
  console.log(`   - Statik sayfalar: ${staticPages.length}`);
  console.log(`   - SEO sayfaları: ${addedCount}`);
  console.log(`   - Toplam URL: ${staticPages.length + addedCount}`);
  console.log(`   - Dosya boyutu: ${(xml.length / 1024).toFixed(2)} KB`);
  
  // Sitemap çok büyükse uyarı
  if (addedCount > 50000) {
    console.warn('⚠️  UYARI: Sitemap 50,000 URL limitini aşıyor! Sitemap index kullanmalısınız.');
  }
}

// Çalıştır
try {
  generateSitemap();
} catch (error) {
  console.error('❌ Sitemap oluşturulurken hata:', error);
  process.exit(1);
}
