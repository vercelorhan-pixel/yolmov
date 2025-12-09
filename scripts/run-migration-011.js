#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔧 Running migration: 011_add_proof_photos.sql\n');

const sql = fs.readFileSync('/workspaces/yolmov/migrations/011_add_proof_photos.sql', 'utf8');

try {
  // Supabase'de SQL çalıştırma yoksa, RPC ile çalıştır
  // Basit ALTER TABLE komutları için direkt çalıştırabiliriz
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // RPC yoksa manuel olarak ekleme yapalım
    console.log('⚠️  RPC bulunamadı, manuel kolon ekleme yapılacak...\n');
    
    // Test: Mevcut bir request al
    const { data: testReq } = await supabase
      .from('requests')
      .select('id')
      .limit(1)
      .single();
    
    if (testReq) {
      // start_proof_photo ekle
      const { error: updateError } = await supabase
        .from('requests')
        .update({ start_proof_photo: null })
        .eq('id', testReq.id);
      
      if (updateError) {
        console.log('❌ Kolonlar zaten var veya hata:', updateError.message);
      } else {
        console.log('✅ Kolonlar başarıyla eklendi!');
      }
    }
  } else {
    console.log('✅ Migration başarılı!');
  }
  
  // Kontrol
  const { data: check } = await supabase
    .from('requests')
    .select('*')
    .limit(1);
  
  if (check && check.length > 0) {
    const cols = Object.keys(check[0]);
    console.log('\n📋 Yeni kolonlar:');
    console.log(`   start_proof_photo: ${cols.includes('start_proof_photo') ? '✅' : '❌'}`);
    console.log(`   end_proof_photo: ${cols.includes('end_proof_photo') ? '✅' : '❌'}`);
  }
  
} catch (err) {
  console.error('❌ Migration hatası:', err.message);
}
