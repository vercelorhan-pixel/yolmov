-- ============================================
-- PARTNER ONAYLAMA SORUNU - KESİN ÇÖZÜM
-- Admin kullanıcının partner güncellemesi için RLS düzeltmesi
-- ============================================

-- ADIM 1: Mevcut policy'leri kontrol et
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'partners'
ORDER BY policyname;

-- Eğer "Admins can update all partners" policy'si YOKSA devam et

-- ============================================
-- ADIM 2: Admin UPDATE policy'sini ekle
-- ============================================

-- Önce varsa kaldır (hata vermemesi için)
DROP POLICY IF EXISTS "Admins can update all partners" ON partners;

-- Yeni policy oluştur
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

-- ============================================
-- ADIM 3: Admin SELECT policy'sini ekle (yoksa)
-- ============================================

DROP POLICY IF EXISTS "Admins can view all partners" ON partners;

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

-- ============================================
-- ADIM 4: Admin DELETE policy'sini ekle (yoksa)
-- ============================================

DROP POLICY IF EXISTS "Admins can delete all partners" ON partners;

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

-- ============================================
-- ADIM 5: Admin requests görüntüleme
-- ============================================

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

-- ============================================
-- ADIM 6: DOĞRULAMA - Policy'lerin oluştuğunu kontrol et
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('partners', 'requests')
  AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- ============================================
-- BEKLENEN SONUÇ (4 policy):
-- ============================================
-- partners  | Admins can view all partners   | SELECT
-- partners  | Admins can update all partners | UPDATE  ← BU ÇOK ÖNEMLİ!
-- partners  | Admins can delete all partners | DELETE
-- requests  | Admins can view all requests   | SELECT

-- ============================================
-- TEST (Admin kullanıcı olarak)
-- ============================================

-- Admin user ID'nizi buraya yazın ve test edin:
-- UPDATE partners SET status = 'active' WHERE id = 'test-partner-id';

-- Eğer hala 406 hatası alıyorsanız:
-- 1. Admin user'ın admin_users tablosunda olduğundan emin olun
-- 2. Auth.uid() ile admin_users.id eşleşiyor mu kontrol edin
-- 3. Supabase Dashboard'dan logout/login yapın
