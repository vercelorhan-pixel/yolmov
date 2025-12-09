#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwslxmciglqxpvfbgjzm.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2x4bWNpZ2xxeHB2ZmJnanptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDMzNTc0NywiZXhwIjoyMDc5OTExNzQ3fQ.Rs6mXPpNG6kzLTxJtPD4Ei_G1uOCBdqe7cXBa1750CY';

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔧 Kolonları ekliyorum...\n');

// Direkt REST API kullanarak schema'yı güncelleyemeyiz
// Ama workaround: Mevcut bir kaydı güncelleyerek kolonu otomatik ekletebiliriz (HAYIR - bu çalışmaz)
// En iyi yol: Supabase Management API kullanmak veya SQL Editor'dan manuel çalıştırmak

// Alternatif: SQL query'yi REST API'ye POST et
try {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        ALTER TABLE public.requests
        ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,
        ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;
      `
    })
  });

  if (!response.ok) {
    console.log('❌ REST API ile başarısız. Manuel SQL gerekli.\n');
    console.log('📋 Aşağıdaki SQL'i Supabase Dashboard SQL Editor\'da çalıştırın:\n');
    console.log('ALTER TABLE public.requests');
    console.log('ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;\n');
    console.log('🔗 https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm/sql/new\n');
  } else {
    console.log('✅ Kolonlar eklendi!');
  }
} catch (error) {
  console.log('⚠️  Otomatik ekleme başarısız.\n');
  console.log('📋 Manuel olarak Supabase SQL Editor\'da çalıştırın:\n');
  console.log('```sql');
  console.log('ALTER TABLE public.requests');
  console.log('ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,');
  console.log('ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;');
  console.log('```\n');
  console.log('🔗 https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm/sql/new\n');
}
