-- Mevcut çağrı tablolarını kontrol et
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'calls',
    'customer_partner_calls',
    'customer_support_calls', 
    'partner_support_calls',
    'calls_deprecated_backup'
  )
ORDER BY table_name;

-- Mevcut index'leri kontrol et
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_cpc_%' 
   OR indexname LIKE 'idx_csc_%'
   OR indexname LIKE 'idx_psc_%'
ORDER BY tablename, indexname;

-- Mevcut RLS policy'leri kontrol et
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY tablename, policyname;

-- Mevcut trigger'ları kontrol et
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY event_object_table, trigger_name;
