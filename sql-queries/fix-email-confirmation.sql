-- ============================================
-- EMAIL CONFIRMATION FIX - ADIM ADIM
-- Partner kayıtlarında email confirmation gereksinimini kaldırma
-- ============================================
-- ⚠️ Bu komutlar GÜVENLİ - Transaction içinde çalışabilir
-- ============================================

-- ============================================
-- ADIM 1: Email confirmation bekleyen partnerleri listele
-- ============================================
-- Bu komutu ÖNCE çalıştırın (kaç partner etkilenecek göreceksiniz):

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.raw_user_meta_data->>'user_type' as user_type,
  p.first_name,
  p.last_name,
  p.company_name,
  p.status as partner_status
FROM auth.users u
LEFT JOIN partners p ON u.id = p.id
WHERE u.raw_user_meta_data->>'user_type' = 'partner'
  AND u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC;

-- 📊 Not edin: Kaç satır döndü? Bu sayıda partner güncellenecek

-- ============================================
-- ADIM 2: Partner kullanıcılarını otomatik onayla
-- ============================================
-- Bu komutu çalıştırın (email confirmation'ı kaldırır):

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE raw_user_meta_data->>'user_type' = 'partner'
  AND email_confirmed_at IS NULL;

-- ✅ Başarılı mesajı: "X rows updated" (X = ADIM 1'deki sayı olmalı)

-- ============================================
-- ADIM 3: Sonuçları kontrol et
-- ============================================
-- Güncellemelerin başarılı olduğunu doğrulayın:

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'user_type' as user_type,
  p.status as partner_status
FROM auth.users u
LEFT JOIN partners p ON u.id = p.id
WHERE u.raw_user_meta_data->>'user_type' = 'partner'
ORDER BY u.created_at DESC
LIMIT 20;

-- ✅ Tüm partnerlerin email_confirmed_at değeri DOLU olmalı (NULL olmamalı)

-- ============================================
-- SUPABASE DASHBOARD AYARLARI
-- ============================================
-- Bu SQL'i çalıştırdıktan sonra Supabase Dashboard'da:
-- 
-- 1. Authentication > Settings > Email Auth
-- 2. "Enable email confirmations" seçeneğini KAPATIN
-- 3. "Secure email change enabled" seçeneğini KAPATIN (opsiyonel)
-- 
-- Bu sayede yeni kayıtlarda da email confirmation istenmez.
-- ============================================
