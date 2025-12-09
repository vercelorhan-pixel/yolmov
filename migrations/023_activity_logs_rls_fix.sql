-- ============================================
-- ACTIVITY LOGS RLS FIX
-- Admin panelinde activity logs görüntülenemiyor sorunu düzeltme
-- ============================================

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can select activity logs" ON activity_logs;

-- Yeni policy: Herkes okuyabilir (public veriler)
-- Activity logs zaten hassas veri değil - sayfa görüntüleme logları
CREATE POLICY "Anyone can select activity logs" ON activity_logs
  FOR SELECT
  USING (true);

-- Herkes yazabilir (anonim dahil)
CREATE POLICY "Anyone can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Doğrulama
DO $$ 
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'activity_logs';
  
  RAISE NOTICE '✅ activity_logs RLS policy sayısı: %', policy_count;
END $$;
