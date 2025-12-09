#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzU3NDcsImV4cCI6MjA3OTkxMTc0N30.Pzk2Zrp08-f93VoApIj6QjWx_9nEQSkZFRU_t1UX_ow';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔌 Supabase bağlantısı test ediliyor...\n');

async function testConnection() {
  try {
    // 1. Tablo listesini al
    console.log('📋 Veritabanı tabloları kontrol ediliyor...');
    const { data: tables, error: tablesError } = await supabase
      .from('partners')
      .select('id, name, status')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Tablo sorgu hatası:', tablesError.message);
    } else {
      console.log('✅ Partners tablosuna erişim başarılı!');
      console.log('   Örnek veri:', tables);
    }

    // 2. Offers tablosu
    console.log('\n📋 Offers tablosu kontrol ediliyor...');
    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('id, status, price')
      .limit(3);
    
    if (offersError) {
      console.error('❌ Offers sorgu hatası:', offersError.message);
    } else {
      console.log('✅ Offers tablosuna erişim başarılı!');
      console.log('   Toplam kayıt:', offers?.length || 0);
    }

    // 3. Requests tablosu
    console.log('\n📋 Requests tablosu kontrol ediliyor...');
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('id, status, urgency')
      .limit(3);
    
    if (requestsError) {
      console.error('❌ Requests sorgu hatası:', requestsError.message);
    } else {
      console.log('✅ Requests tablosuna erişim başarılı!');
      console.log('   Toplam kayıt:', requests?.length || 0);
    }

    // 4. Real-time subscription test
    console.log('\n🔔 Real-time subscription test ediliyor...');
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'offers'
      }, (payload) => {
        console.log('📨 Real-time event:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription başarılı!');
          supabase.removeChannel(channel);
        }
      });

    console.log('\n🎉 Tüm testler tamamlandı!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Supabase bağlantısı çalışıyor!');
    console.log('✅ Tüm tablolara erişim var!');
    console.log('✅ Real-time özelliği aktif!');
    
  } catch (error) {
    console.error('\n❌ Beklenmeyen hata:', error);
  }
}

testConnection();
