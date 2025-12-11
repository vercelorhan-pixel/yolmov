-- Trigger Kontrolü
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY event_object_table, trigger_name;

-- Trigger fonksiyonlarını listele
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%queue%' OR proname LIKE '%position%' OR proname LIKE '%credit%'
ORDER BY proname;
