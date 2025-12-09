-- ============================================
-- HIZLI RLS FIX (Test İçin - 30 saniye sürer)
-- ============================================

-- RLS'i geçici olarak kapat
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;

-- Başarı mesajı
DO $$ 
BEGIN
    RAISE NOTICE '✅ RLS geçici olarak kapatıldı';
    RAISE NOTICE '⚠️ Production''da mutlaka 006_rls_policies_partner_registration.sql çalıştır!';
    RAISE NOTICE '🎯 Şimdi formu test edebilirsin';
END $$;
