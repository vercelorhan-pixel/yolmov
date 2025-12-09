#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3NDcsImV4cCI6MjA3OTkxMTc0N30.Pzk2Zrp08-f93VoApIj6QjWx_9nEQSkZFRU_t1UX_ow';

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

const requestId = '92656718-8d6f-44c9-bcd2-334ecb5bcbe9';
const partnerId = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

console.log('🔍 Proof Photo Update Test\n');

// 1. Request kontrolü
const { data: req } = await serviceClient
  .from('requests')
  .select('*')
  .eq('id', requestId)
  .single();

console.log('📋 Request:', {
  id: req?.id,
  status: req?.status,
  assigned_partner: req?.assigned_partner_id,
  start_proof: req?.start_proof_photo,
  end_proof: req?.end_proof_photo
});

// 2. Anon (partner) update testi
console.log('\n🔓 Anon key ile update:');
const { data: updated, error } = await anonClient
  .from('requests')
  .update({ 
    start_proof_photo: 'https://test.jpg'
  })
  .eq('id', requestId)
  .eq('assigned_partner_id', partnerId)
  .select()
  .single();

if (error) {
  console.log('❌ Hata:', error);
  console.log('\n📌 RLS policy partner update izni vermiyor!');
} else {
  console.log('✅ Başarılı:', updated);
}

// 3. Service role ile dene
console.log('\n🔧 Service role ile:');
const { data: serviceUpdate, error: serviceError } = await serviceClient
  .from('requests')
  .update({ start_proof_photo: 'https://test.jpg' })
  .eq('id', requestId)
  .select()
  .single();

if (serviceError) {
  console.log('❌ Service role hatası:', serviceError.message);
} else {
  console.log('✅ Service role başarılı!');
  console.log('\n⚠️  SORUN: RLS policy eksik!');
  console.log('💡 Partner assigned_partner_id eşleştiğinde update yapabilmeli');
}
