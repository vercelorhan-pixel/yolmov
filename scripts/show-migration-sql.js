#!/usr/bin/env node

/**
 * MANUEL ADIMLAR:
 * 
 * 1. Supabase Dashboard'a git: https://supabase.com/dashboard
 * 2. Yolmov projesini seç
 * 3. Sol menüden "SQL Editor"'ı aç
 * 4. "New Query" butonuna bas
 * 5. Aşağıdaki SQL'i yapıştır ve "Run" butonuna bas:
 */

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SUPABASE SQL EDITOR'DA ÇALIŞTIR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add proof photo columns to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,
ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;

-- Add comments
COMMENT ON COLUMN public.requests.start_proof_photo IS 'Partner başlangıç kanıt fotoğrafı URL';
COMMENT ON COLUMN public.requests.end_proof_photo IS 'Partner bitiş kanıt fotoğrafı URL';

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SQL'i kopyala ve Supabase SQL Editor'da çalıştır
🔗 URL: https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm/sql/new
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

console.log('\n📌 VEYA Supabase CLI kullan:\n');
console.log('supabase db push --db-url "postgresql://postgres:Ocak2025.@db.uwslxmciglqxpvfbgjzm.supabase.co:5432/postgres" --file migrations/011_add_proof_photos.sql\n');
