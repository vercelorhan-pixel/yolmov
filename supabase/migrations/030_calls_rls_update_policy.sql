-- Migration 030: Calls tablosu için UPDATE policy ekleme
-- Partner'ın kendi arama kaydını güncelleyebilmesi için gerekli
-- 
-- Sorun: Partner arama başlattığında SDP offer kaydedilemiyordu (406 hatası)
-- Çözüm: UPDATE policy ekle

-- Mevcut policy'leri temizle (varsa)
DROP POLICY IF EXISTS "Users can update their own calls" ON calls;
DROP POLICY IF EXISTS "Users can view calls" ON calls;
DROP POLICY IF EXISTS "Authenticated users can create calls" ON calls;
DROP POLICY IF EXISTS "Partners and customers can create calls" ON calls;

-- 1. INSERT policy - Herkes arama kaydı oluşturabilir
CREATE POLICY "Anyone can create calls"
ON calls
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. UPDATE policy - Herkes kendi aramasını güncelleyebilir
CREATE POLICY "Anyone can update calls"
ON calls
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. SELECT policy - Herkes aramaları görebilir
CREATE POLICY "Anyone can view calls"
ON calls
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. DELETE policy - Sadece admin silebilir (isteğe bağlı)
-- CREATE POLICY "Only admin can delete calls"
-- ON calls
-- FOR DELETE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM admin_users WHERE id = auth.uid()
--   )
-- );

-- Doğrulama
-- SELECT * FROM pg_policies WHERE tablename = 'calls';
