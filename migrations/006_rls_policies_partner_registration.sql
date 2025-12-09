-- ============================================
-- SUPABASE RLS POLICIES FIX
-- Partner Registration için gerekli izinler
-- NOT: Bu migration tekrar çalıştırılabilir (idempotent)
-- ============================================

-- ADIM 1: Storage RLS Policy (Belge yükleme için)
-- ============================================

-- Önce mevcut policy'leri temizle (IF EXISTS ile güvenli)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Partners can upload documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anonymous uploads to documents bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read from documents bucket" ON storage.objects;
    RAISE NOTICE '✓ Storage policy''leri temizlendi';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ Storage policy temizleme atlandı (hata: %)', SQLERRM;
END $$;

-- Public upload izni ver (anonymous users için)
CREATE POLICY "Allow anonymous uploads to documents bucket"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'documents');

-- Public read izni ver (belgeler görünsün)
CREATE POLICY "Allow public read from documents bucket"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'documents');

-- ============================================
-- ADIM 2: Partners Table RLS Policy
-- ============================================

-- Önce mevcut policy'leri temizle
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow anonymous insert" ON partners;
    DROP POLICY IF EXISTS "Anyone can insert partners" ON partners;
    DROP POLICY IF EXISTS "Public can insert partners" ON partners;
    DROP POLICY IF EXISTS "Allow anonymous partner registration" ON partners;
    DROP POLICY IF EXISTS "Users can view their own partner data" ON partners;
    DROP POLICY IF EXISTS "Admins can view all partners" ON partners;
    DROP POLICY IF EXISTS "Enable insert for anon users" ON partners;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON partners;
    DROP POLICY IF EXISTS "Enable read access for all users" ON partners;
    RAISE NOTICE '✓ Partners policy''leri temizlendi';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ Partners policy temizleme atlandı (hata: %)', SQLERRM;
END $$;

-- RLS'i etkinleştir
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Anonymous kullanıcılar partner kaydı yapabilir (BASITLEŞTIRILMIŞ)
CREATE POLICY "Enable insert for anon users"
ON partners
FOR INSERT
TO anon
WITH CHECK (true);

-- Authenticated kullanıcılar da partner kaydı yapabilir
CREATE POLICY "Enable insert for authenticated users"
ON partners
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Herkes partnerleri görebilir (public read)
CREATE POLICY "Enable read access for all users"
ON partners
FOR SELECT
TO anon, authenticated, public
USING (true);

-- ============================================
-- ADIM 3: Grant Permissions (Önemli!)
-- ============================================

-- anon role'üne partners tablosunda INSERT izni ver
DO $$ 
BEGIN
    GRANT INSERT ON partners TO anon;
    GRANT SELECT ON partners TO anon;
    RAISE NOTICE '✓ anon role izinleri verildi';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ anon GRANT atlandı (muhtemelen zaten var)';
END $$;

-- authenticated role'üne de izin ver
DO $$ 
BEGIN
    GRANT INSERT ON partners TO authenticated;
    GRANT SELECT ON partners TO authenticated;
    RAISE NOTICE '✓ authenticated role izinleri verildi';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ authenticated GRANT atlandı (muhtemelen zaten var)';
END $$;

-- Sequence kullanım izni (ID generation için)
DO $$ 
BEGIN
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    RAISE NOTICE '✓ Sequence izinleri verildi';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ Sequence GRANT atlandı (muhtemelen zaten var)';
END $$;

-- ============================================
-- BAŞARILI! RLS Policies eklendi
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '🎉 RLS Policies başarıyla eklendi!';
    RAISE NOTICE '✅ Storage: Anonymous upload izni';
    RAISE NOTICE '✅ Storage: Public read izni';
    RAISE NOTICE '✅ Partners: Anonymous insert izni';
    RAISE NOTICE '✅ RLS etkinleştirildi';
END $$;
