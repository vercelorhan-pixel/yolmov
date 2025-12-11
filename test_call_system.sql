-- Çağrı Sistemi Testi
-- Bu SQL'i Supabase Dashboard'da çalıştırarak sistemi test edin

-- 1. Tabloların varlığını kontrol et
SELECT 
  'customer_partner_calls' as table_name,
  COUNT(*) as record_count
FROM customer_partner_calls
UNION ALL
SELECT 
  'customer_support_calls',
  COUNT(*)
FROM customer_support_calls
UNION ALL
SELECT 
  'partner_support_calls',
  COUNT(*)
FROM partner_support_calls;

-- 2. Son 5 müşteri-partner aramasını göster
SELECT 
  id,
  customer_id,
  partner_id,
  status,
  started_at,
  connected_at,
  duration_seconds
FROM customer_partner_calls
ORDER BY started_at DESC
LIMIT 5;

-- 3. RLS policy'leri kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY tablename, policyname;

-- 4. Index'leri kontrol et
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY tablename, indexname;
