#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔍 Requests Tablosu Kolonlar\n');

const { data, error } = await supabase
  .from('requests')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Hata:', error.message);
} else if (data && data.length > 0) {
  console.log('✅ Kolonlar:', Object.keys(data[0]).sort().join(', '));
  
  const cols = Object.keys(data[0]);
  const hasStartProof = cols.includes('start_proof_photo');
  const hasEndProof = cols.includes('end_proof_photo');
  
  console.log('\n📸 Foto Kolonları:');
  console.log(`   start_proof_photo: ${hasStartProof ? '✅ VAR' : '❌ YOK'}`);
  console.log(`   end_proof_photo: ${hasEndProof ? '✅ VAR' : '❌ YOK'}`);
  
  if (!hasStartProof || !hasEndProof) {
    console.log('\n⚠️  SORUN: Foto kolonları eksik!');
    console.log('💡 ÇÖZÜM: Kolonları eklemek için migration çalıştırmalıyız');
  }
}
