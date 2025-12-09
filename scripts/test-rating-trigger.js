#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🧪 Partner Rating Trigger Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const testPartnerId = '11111111-1111-1111-1111-111111111111';

// 1. Başlangıç durumu
console.log('📊 BAŞLANGIÇ DURUMU:');
const { data: beforePartner } = await supabase
  .from('partners')
  .select('name, rating')
  .eq('id', testPartnerId)
  .single();

console.log(`   Partner: ${beforePartner?.name}`);
console.log(`   Rating: ${beforePartner?.rating}\n`);

// 2. Test review ekle
console.log('➕ TEST REVIEW EKLENİYOR (4 yıldız)...');
const { data: newReview, error: reviewError } = await supabase
  .from('partner_reviews')
  .insert({
    partner_id: testPartnerId,
    partner_name: beforePartner?.name,
    customer_id: 'test-customer-' + Date.now(),
    customer_name: 'Test Müşteri',
    job_id: 'test-job-' + Date.now(),
    service: 'cekici',
    rating: 4,
    comment: 'Trigger test review',
    tags: []
  })
  .select()
  .single();

if (reviewError) {
  console.log('❌ Review eklenemedi:', reviewError.message);
  process.exit(1);
}

console.log('✅ Review eklendi:', newReview.id);

// 3. 1 saniye bekle (trigger çalışsın)
await new Promise(resolve => setTimeout(resolve, 1000));

// 4. Partner rating'i kontrol et
console.log('\n📊 SONUÇ DURUMU:');
const { data: afterPartner } = await supabase
  .from('partners')
  .select('rating')
  .eq('id', testPartnerId)
  .single();

console.log(`   Önceki Rating: ${beforePartner?.rating}`);
console.log(`   Sonraki Rating: ${afterPartner?.rating}`);

if (beforePartner?.rating !== afterPartner?.rating) {
  console.log('\n✅ BAŞARILI: Trigger çalıştı! Rating otomatik güncellendi!');
} else {
  console.log('\n❌ HATA: Trigger çalışmadı! Rating değişmedi!');
  console.log('💡 Lütfen 012_partner_rating_trigger.sql dosyasını Supabase SQL Editor\'da çalıştırın');
}

// 5. Test review'ı temizle
console.log('\n🧹 Test review siliniyor...');
await supabase
  .from('partner_reviews')
  .delete()
  .eq('id', newReview.id);

console.log('✅ Temizlik tamamlandı\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
