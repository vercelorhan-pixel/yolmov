-- Migration: Fix storage policies for request photos
-- Date: 2025-11-29
-- Amaç: Storage bucket RLS policy ekle (customer_id zorunlu - üye girişi gerekli)

-- Storage bucket için RLS politikaları
-- Not: Bu SQL'i çalıştırmadan önce Supabase Dashboard'da 
-- Storage > request-photos bucket'ını oluşturun (Public olarak)

-- INSERT policy: Giriş yapmış kullanıcılar yükleyebilir
CREATE POLICY "Authenticated users can upload request photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- SELECT policy: Herkes okuyabilir (public bucket)
CREATE POLICY "Anyone can view request photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'request-photos');

-- UPDATE policy: Yükleyen kullanıcı güncelleyebilir
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'request-photos' AND auth.uid()::text = owner);

-- DELETE policy: Yükleyen kullanıcı silebilir veya admin
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'request-photos' AND auth.uid()::text = owner);
