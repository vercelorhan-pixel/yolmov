-- ============================================
-- FIX PARTNER DOCUMENT UPLOAD RLS
-- Anonymous (henüz kayıt olmamış) kullanıcıların belge yüklemesine izin ver
-- Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

-- 1. Mevcut kısıtlayıcı policy'yi kaldır
DROP POLICY IF EXISTS "Authenticated users can upload partner documents" ON storage.objects;

-- 2. Anonymous kullanıcılar belge yükleyebilir (sadece partner-documents bucket'ına)
CREATE POLICY "Anyone can upload partner documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents'
);

-- 3. Anonymous kullanıcılar kendi yüklediği belgeleri silebilir (isteğe bağlı)
DROP POLICY IF EXISTS "Authenticated users can delete own partner documents" ON storage.objects;

CREATE POLICY "Anyone can delete partner documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'partner-documents'
);

-- 4. Bucket'ın public olduğundan emin ol
UPDATE storage.buckets 
SET public = true 
WHERE id = 'partner-documents';

-- 5. Doğrulama: Partner documents bucket policy'lerini listele
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%partner%'
ORDER BY policyname;

-- Beklenen Sonuç (3 policy):
-- 1. Public can view partner documents (SELECT)
-- 2. Anyone can upload partner documents (INSERT)
-- 3. Anyone can delete partner documents (DELETE)
