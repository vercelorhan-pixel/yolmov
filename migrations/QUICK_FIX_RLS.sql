-- ⚡ HIZLI ÇÖZÜM: Supabase SQL Editor'e Kopyala-Yapıştır
-- Bu SQL'i https://app.supabase.com projenizin SQL Editor'ine yapıştırıp RUN'a tıklayın

-- 1️⃣ INSERT Policy'lerini Ekle
DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
CREATE POLICY "Customers can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Partners can create conversations" ON conversations;
CREATE POLICY "Partners can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = partner_id);

-- 2️⃣ UPDATE Policy'lerini Ekle
DROP POLICY IF EXISTS "Customers can update their conversations" ON conversations;
CREATE POLICY "Customers can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Partners can update their conversations" ON conversations;
CREATE POLICY "Partners can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);

-- ✅ Doğrulama: Policy'leri kontrol et
SELECT 
    policyname, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '👀 Görüntüleme'
        WHEN cmd = 'INSERT' THEN '➕ Oluşturma'
        WHEN cmd = 'UPDATE' THEN '✏️ Güncelleme'
        WHEN cmd = 'DELETE' THEN '🗑️ Silme'
    END as operation
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;

-- Beklenen Çıktı: 6 policy (2 SELECT + 2 INSERT + 2 UPDATE)
