#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3NDcsImV4cCI6MjA3OTkxMTc0N30.Pzk2Zrp08-f93VoApIj6QjWx_9nEQSkZFRU_t1UX_ow';

const supabase = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

const testRequestId = '9fda698e-9879-4120-8eb7-a5e5027eef8f';
const testPartnerId = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

console.log('🔍 RLS Update Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testUpdate() {
  // 1. Request'i oku
  console.log('📋 Request durumu:');
  const { data: request, error: readError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', testRequestId)
    .single();
  
  if (readError) {
    console.log('❌ Okuma hatası:', readError.message);
    return;
  }
  
  console.log('✅ Request bulundu:');
  console.log(`   ID: ${request.id}`);
  console.log(`   Status: ${request.status}`);
  console.log(`   Job Stage: ${request.job_stage}`);
  console.log(`   Assigned Partner: ${request.assigned_partner_id}`);
  console.log(`   Damage Photos: ${request.damage_photo_urls}`);

  // 2. Anon (partner) ile foto URL'i update dene
  console.log('\n🔓 Anon key ile photo update:');
  
  const testPhotoUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co/storage/v1/object/public/partner-documents/test.jpg';
  
  const { data: updateData, error: updateError } = await anonClient
    .from('requests')
    .update({ 
      damage_photo_urls: [testPhotoUrl]
    })
    .eq('id', testRequestId)
    .eq('assigned_partner_id', testPartnerId)
    .select()
    .single();
  
  if (updateError) {
    console.log('❌ Update hatası:', updateError);
    console.log('   Code:', updateError.code);
    console.log('   Message:', updateError.message);
    console.log('   Details:', updateError.details);
    console.log('   Hint:', updateError.hint);
    
    // Service role ile dene
    console.log('\n🔧 Service role ile deneniyor...');
    const { data: serviceData, error: serviceError } = await supabase
      .from('requests')
      .update({ 
        damage_photo_urls: [testPhotoUrl]
      })
      .eq('id', testRequestId)
      .select()
      .single();
    
    if (serviceError) {
      console.log('❌ Service role de başarısız:', serviceError.message);
    } else {
      console.log('✅ Service role başarılı!');
      console.log('   Damage Photos:', serviceData.damage_photo_urls);
      
      // RLS policy eksik demektir
      console.log('\n⚠️  SORUN: RLS policy partner update izni yok!');
      console.log('💡 ÇÖZÜM: requests tablosuna partner update policy eklenmeli');
    }
  } else {
    console.log('✅ Update başarılı!');
    console.log('   Damage Photos:', updateData.damage_photo_urls);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testUpdate();
