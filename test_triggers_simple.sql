-- Sadece trigger listesi (basit)
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY event_object_table, trigger_name;
