#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

const requestId = '9fda698e-9879-4120-8eb7-a5e5027eef8f';
const partnerId = 'acbc5d37-b471-4b09-a01c-866fc009e8c3';

async function investigateRequest() {
  console.log('🔍 REQUEST DURUMU KONTROLÜ\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Request'i bul
  console.log('📋 Request bilgileri:');
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (reqError) {
    console.log('❌ Request bulunamadı:', reqError.message);
  } else {
    console.log('✅ Request bulundu:');
    console.log('   ID:', request.id);
    console.log('   Status:', request.status);
    console.log('   Job Stage:', request.job_stage);
    console.log('   Assigned Partner:', request.assigned_partner_id);
    console.log('   Customer:', request.customer_name);
  }

  // 2. Bu request için offers
  console.log('\n📨 Teklifler:');
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('*')
    .eq('request_id', requestId);

  if (offers && offers.length > 0) {
    offers.forEach(offer => {
      console.log(`   - Partner: ${offer.partner_name}`);
      console.log(`     Status: ${offer.status}`);
      console.log(`     Price: ₺${offer.price}`);
    });
  } else {
    console.log('   Teklif bulunamadı');
  }

  // 3. Partner'ın tüm accepted offerları
  console.log('\n✅ Partner\'ın kabul edilen teklifleri:');
  const { data: acceptedOffers, error: accError } = await supabase
    .from('offers')
    .select('*, requests(*)')
    .eq('partner_id', partnerId)
    .eq('status', 'accepted');

  if (acceptedOffers && acceptedOffers.length > 0) {
    acceptedOffers.forEach(offer => {
      console.log(`\n   Offer ID: ${offer.id}`);
      console.log(`   Request ID: ${offer.request_id}`);
      console.log(`   Price: ₺${offer.price}`);
      if (offer.requests) {
        console.log(`   Request Status: ${offer.requests.status}`);
        console.log(`   Job Stage: ${offer.requests.job_stage}`);
        console.log(`   Assigned Partner: ${offer.requests.assigned_partner_id}`);
      }
    });
  } else {
    console.log('   Kabul edilen teklif yok');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

investigateRequest();
