-- ============================================
-- EMAIL CONFIRMATION FIX - Partner Kullanıcıları
-- ============================================
-- Bu script, email doğrulaması bekleyen partner kullanıcılarını
-- otomatik olarak onaylar (email_confirmed_at set eder)
-- ============================================

-- 1. Email confirmation bekleyen partner kullanıcılarını listele
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.raw_user_meta_data->>'user_type' as user_type,
  p.first_name,
  p.last_name,
  p.status as partner_status
FROM auth.users u
LEFT JOIN partners p ON u.id = p.id
WHERE u.raw_user_meta_data->>'user_type' = 'partner'
  AND u.email_confirmed_at IS NULL
ORDER BY u.created_at DESC;

-- 2. kilicorhaan+14@gmail.com kullanıcısını özellikle onayla
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'kilicorhaan+14@gmail.com'
  AND email_confirmed_at IS NULL;

-- 3. Tüm partner kullanıcılarını otomatik onayla
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE raw_user_meta_data->>'user_type' = 'partner'
  AND email_confirmed_at IS NULL;

-- 4. Sonuçları kontrol et
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.status as partner_status,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN partners p ON u.id = p.id
WHERE u.raw_user_meta_data->>'user_type' = 'partner'
ORDER BY u.created_at DESC
LIMIT 20;
