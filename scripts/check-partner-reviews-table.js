#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔍 Partner Reviews Tablosu Kontrol\n');

const { data, error } = await supabase
  .from('partner_reviews')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Hata:', error.message);
} else if (data) {
  if (data.length > 0) {
    console.log('✅ Kolonlar:', Object.keys(data[0]).sort().join(', '));
    
    const cols = Object.keys(data[0]);
    console.log('\n📋 Önemli Kolonlar:');
    console.log(`   customer_id: ${cols.includes('customer_id') ? '✅' : '❌'}`);
    console.log(`   customerId: ${cols.includes('customerId') ? '✅' : '❌'}`);
    console.log(`   partner_id: ${cols.includes('partner_id') ? '✅' : '❌'}`);
    console.log(`   rating: ${cols.includes('rating') ? '✅' : '❌'}`);
    console.log(`   request_id: ${cols.includes('request_id') ? '✅' : '❌'}`);
    
    console.log('\n📊 Örnek veri:', data[0]);
  } else {
    console.log('⚠️  Tabloda henüz veri yok');
    
    // Schema kontrol
    const { data: emptyInsert, error: insertError } = await supabase
      .from('partner_reviews')
      .insert({ customer_id: 'test' })
      .select();
    
    if (insertError) {
      console.log('\n❌ Insert hatası:', insertError.message);
      console.log('Detay:', insertError);
    }
  }
}
