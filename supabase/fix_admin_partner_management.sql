-- ============================================
-- FIX ADMIN PARTNER MANAGEMENT
-- Admin kullanıcıların partner yönetimi için RLS policy'leri
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

-- 1. Mevcut admin policy'sini kaldır (varsa)
DROP POLICY IF EXISTS "Admins can manage all partners" ON partners;
DROP POLICY IF EXISTS "Admin can manage all partners" ON partners;
DROP POLICY IF EXISTS "Admins full access to partners" ON partners;

-- 2. Admin SELECT policy (Tüm partnerleri görebilir)
CREATE POLICY "Admins can view all partners"
ON partners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 3. Admin UPDATE policy (Tüm partnerleri güncelleyebilir)
CREATE POLICY "Admins can update all partners"
ON partners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 4. Admin DELETE policy (Tüm partnerleri silebilir)
CREATE POLICY "Admins can delete all partners"
ON partners
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 5. Mevcu requests RLS kontrol (Admin READ tüm requests için)
DROP POLICY IF EXISTS "Admins can view all requests" ON requests;

CREATE POLICY "Admins can view all requests"
ON requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

-- 6. Kontrol: Policy'lerin oluşturulduğunu doğrula
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('partners', 'requests')
  AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- Beklenen sonuç: 5 policy görmelisiniz
-- - Admins can view all partners (SELECT)
-- - Admins can update all partners (UPDATE)
-- - Admins can delete all partners (DELETE)
-- - Admins can view all requests (SELECT)
