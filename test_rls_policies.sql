-- RLS Policy Kontrolü
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('customer_partner_calls', 'customer_support_calls', 'partner_support_calls')
ORDER BY tablename, policyname;
