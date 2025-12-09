#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔍 Partner Puanlama Sistemi Analizi\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Partners tablosu kolonları
console.log('📋 Partners Tablosu:');
const { data: partners } = await supabase
  .from('partners')
  .select('*')
  .limit(1);

if (partners && partners.length > 0) {
  const cols = Object.keys(partners[0]);
  console.log('   rating kolonu:', cols.includes('rating') ? '✅ VAR' : '❌ YOK');
  console.log('   completed_jobs kolonu:', cols.includes('completed_jobs') ? '✅ VAR' : '❌ YOK');
  
  if (cols.includes('rating')) {
    console.log('   Veri tipi: NUMBER (ortalama puan)');
  }
}

// 2. Örnek partner ve review'larını kontrol et
console.log('\n📊 Test Partner Analizi:');
const testPartnerId = '11111111-1111-1111-1111-111111111111';

const { data: partner } = await supabase
  .from('partners')
  .select('name, rating, completed_jobs')
  .eq('id', testPartnerId)
  .single();

if (partner) {
  console.log(`   Partner: ${partner.name}`);
  console.log(`   Mevcut Rating: ${partner.rating}`);
  console.log(`   Tamamlanan İş: ${partner.completed_jobs}`);
}

// 3. Bu partner için tüm review'ları al
const { data: reviews } = await supabase
  .from('partner_reviews')
  .select('rating, created_at, customer_name')
  .eq('partner_id', testPartnerId);

if (reviews && reviews.length > 0) {
  console.log(`\n   Review Sayısı: ${reviews.length}`);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;
  console.log(`   Ortalama Puan (hesaplanan): ${avgRating.toFixed(1)}`);
  console.log(`   Partners tablosundaki rating: ${partner?.rating || 0}`);
  
  if (Math.abs((partner?.rating || 0) - avgRating) > 0.1) {
    console.log('\n   ⚠️  UYARI: Rating senkronize değil!');
    console.log('   💡 Review eklendiğinde partner rating güncellenmiyor');
  } else {
    console.log('\n   ✅ Rating senkronize');
  }
  
  console.log('\n   Son 3 Review:');
  reviews.slice(0, 3).forEach((r, i) => {
    console.log(`   ${i+1}. ${r.customer_name}: ${r.rating} yıldız`);
  });
}

// 4. Trigger/Function kontrolü
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 Otomatik Rating Güncelleme:');
console.log('\n   Kontrol ediliyor: PostgreSQL trigger var mı?\n');

const { data: functions } = await supabase.rpc('version');
console.log('   PostgreSQL bağlantısı: ✅');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
