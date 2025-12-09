-- ============================================
-- FIX PARTNER DOCUMENTS BUCKET
-- Bu SQL'i Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

-- 1. Bucket'ı oluştur (public olarak)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'partner-documents', 
  'partner-documents', 
  true,  -- PUBLIC (önizleme için gerekli)
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Mevcut policy'leri temizle
DROP POLICY IF EXISTS "Public can view partner documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload partner documents" ON storage.objects;
DROP POLICY IF EXISTS "Partners can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Partners can view own documents" ON storage.objects;

-- 3. Yeni policy'ler oluştur
CREATE POLICY "Public can view partner documents" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'partner-documents');

CREATE POLICY "Authenticated users can upload partner documents" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'partner-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete own partner documents" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'partner-documents' 
  AND auth.role() = 'authenticated'
);

-- 4. Başarı mesajı
SELECT 'partner-documents bucket başarıyla oluşturuldu ve public yapıldı!' as message;
