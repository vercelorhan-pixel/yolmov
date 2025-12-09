#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔒 RLS Policy Kontrolü\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test request update - partner rolü ile
const testRequestId = '9fda698e-9879-4120-8eb7-a5e5027eef8f';
const testPartnerId = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

async function checkPolicies() {
  // 1. Request'i kontrol et
  console.log('📋 Request durumu:');
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', testRequestId)
    .single();
  
  if (reqError) {
    console.log('❌ Request okunamadı:', reqError.message);
  } else {
    console.log('✅ Request bulundu:');
    console.log(`   ID: ${request.id}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Job Stage: ${request.job_stage}`);
    console.log(`   Assigned Partner: ${request.assigned_partner_id}`);
    console.log(`   Customer: ${request.customer_id}`);
  }

  // 2. Service role ile update dene
  console.log('\n🔧 Service role ile update test:');
  const { data: updateData, error: updateError } = await supabase
    .from('requests')
    .update({ job_stage: 1 })
    .eq('id', testRequestId)
    .select()
    .single();
  
  if (updateError) {
    console.log('❌ Update başarısız:', updateError.message);
  } else {
    console.log('✅ Update başarılı! Job stage:', updateData.job_stage);
    
    // Geri al
    await supabase
      .from('requests')
      .update({ job_stage: 0 })
      .eq('id', testRequestId);
    console.log('   (Geri alındı)');
  }

  // 3. Anon key ile dene (partner gibi)
  console.log('\n🔓 Anon key ile update test (partner rolü):');
  const anonClient = createClient(
    supabaseUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3NDcsImV4cCI6MjA3OTkxMTc0N30.Pzk2Zrp08-f93VoApIj6QjWx_9nEQSkZFRU_t1UX_ow'
  );
  
  const { data: anonUpdate, error: anonError } = await anonClient
    .from('requests')
    .update({ job_stage: 1 })
    .eq('id', testRequestId)
    .eq('assigned_partner_id', testPartnerId)
    .select()
    .single();
  
  if (anonError) {
    console.log('❌ Anon update başarısız:', anonError.message);
    console.log('   Code:', anonError.code);
    console.log('   Details:', anonError.details);
    console.log('\n⚠️  RLS Policy eksik veya yanlış yapılandırılmış!');
  } else {
    console.log('✅ Anon update başarılı!');
    await supabase.from('requests').update({ job_stage: 0 }).eq('id', testRequestId);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkPolicies();
