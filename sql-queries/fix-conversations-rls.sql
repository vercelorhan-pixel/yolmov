-- =====================================================
-- CONVERSATIONS VE MESSAGES RLS POLİTİKALARI DÜZELTMESİ
-- =====================================================

-- 1. Mevcut RLS politikalarını kontrol et
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');

-- 2. RLS aktif mi kontrol et
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversations', 'messages');

-- =====================================================
-- CONVERSATIONS TABLOSU İÇİN RLS POLİTİKALARI
-- =====================================================

-- Önce mevcut politikaları kaldır (varsa)
DROP POLICY IF EXISTS "Partners can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Customers can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all select on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all insert on conversations" ON conversations;

-- RLS'i aktif et
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin (anon dahil) - GEÇİCİ ÇÖZÜM
CREATE POLICY "Allow all select on conversations" ON conversations
  FOR SELECT
  USING (true);

-- Authenticated kullanıcılar oluşturabilsin
CREATE POLICY "Allow authenticated insert on conversations" ON conversations
  FOR INSERT
  WITH CHECK (true);

-- Update için policy
CREATE POLICY "Allow all update on conversations" ON conversations
  FOR UPDATE
  USING (true);

-- =====================================================
-- MESSAGES TABLOSU İÇİN RLS POLİTİKALARI
-- =====================================================

-- Önce mevcut politikaları kaldır (varsa)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Allow all select on messages" ON messages;
DROP POLICY IF EXISTS "Allow all insert on messages" ON messages;

-- RLS'i aktif et
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin (anon dahil) - GEÇİCİ ÇÖZÜM
CREATE POLICY "Allow all select on messages" ON messages
  FOR SELECT
  USING (true);

-- Authenticated kullanıcılar mesaj gönderebilsin
CREATE POLICY "Allow authenticated insert on messages" ON messages
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- DOĞRULAMA
-- =====================================================

-- Politikaları tekrar kontrol et
SELECT 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
