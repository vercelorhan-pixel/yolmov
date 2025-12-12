# 🔒 RLS Policy Fix - Conversations INSERT Hatası

## ❌ Sorun
Müşteriler partnerlere mesaj göndermek istediğinde şu hata alınıyor:
```
new row violates row-level security policy for table "conversations"
403 Forbidden
```

## 🔍 Kök Neden
`conversations` tablosunda sadece **SELECT** policy'leri var, **INSERT** policy'si yok!

```sql
-- Mevcut (YANLIŞ):
CREATE POLICY "Customers can view their conversations" ON conversations FOR SELECT ...
CREATE POLICY "Partners can view their conversations" ON conversations FOR SELECT ...
-- ❌ INSERT policy'si YOK!
```

## ✅ Çözüm

### Adım 1: Supabase Dashboard'a Git
1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **SQL Editor** tıklayın
3. **New Query** açın

### Adım 2: Migration SQL'i Çalıştır

Aşağıdaki SQL kodunu kopyalayıp SQL Editor'e yapıştırın ve **RUN** tıklayın:

```sql
-- ============================================
-- Fix Conversations RLS Policies
-- Allow customers to create conversations
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
DROP POLICY IF EXISTS "Partners can create conversations" ON conversations;
DROP POLICY IF EXISTS "Customers can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Partners can update their conversations" ON conversations;

-- INSERT Policies
CREATE POLICY "Customers can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Partners can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = partner_id);

-- UPDATE Policies
CREATE POLICY "Customers can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Partners can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);
```

### Adım 3: Doğrulama

SQL Editor'de şu sorguyu çalıştırın:

```sql
SELECT 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;
```

**Beklenen Çıktı:**
```
| tablename     | policyname                               | cmd    |
|---------------|------------------------------------------|--------|
| conversations | Customers can create conversations       | INSERT |
| conversations | Partners can create conversations        | INSERT |
| conversations | Customers can view their conversations   | SELECT |
| conversations | Partners can view their conversations    | SELECT |
| conversations | Customers can update their conversations | UPDATE |
| conversations | Partners can update their conversations  | UPDATE |
```

### Adım 4: Test Et

1. Müşteri olarak giriş yap
2. Bir partner detay sayfasına git
3. "Mesaj Gönder" butonuna tıkla
4. Mesaj yaz ve gönder
5. ✅ Artık "403 Forbidden" hatası almamalısınız!

## 🎯 Ne Değişti?

### Öncesi (YANLIŞ):
```sql
-- Sadece SELECT policy'leri var
CREATE POLICY "Customers can view their conversations" ON conversations FOR SELECT ...
-- ❌ INSERT yok!
```

### Sonrası (DOĞRU):
```sql
-- SELECT + INSERT + UPDATE policy'leri var
CREATE POLICY "Customers can view their conversations" ON conversations FOR SELECT ...
CREATE POLICY "Customers can create conversations" ON conversations FOR INSERT ...
CREATE POLICY "Customers can update their conversations" ON conversations FOR UPDATE ...
```

## 📋 RLS Policy Mantığı

### INSERT (Yeni konuşma oluşturma)
- ✅ Customer kendi `customer_id`'si ile oluşturabilir
- ✅ Partner kendi `partner_id`'si ile oluşturabilir
- ❌ Başkası adına oluşturamaz

### SELECT (Konuşmaları görüntüleme)
- ✅ Customer kendi konuşmalarını görebilir
- ✅ Partner kendi konuşmalarını görebilir (kilitli olsa bile)
- ❌ Başkasının konuşmalarını göremez

### UPDATE (Konuşma bilgilerini güncelleme)
- ✅ Customer kendi konuşmalarını güncelleyebilir (okundu işaretleme, arşivleme)
- ✅ Partner kendi konuşmalarını güncelleyebilir (kilidi açma, okundu işaretleme)
- ❌ Başkasının konuşmalarını güncelleyemez

## 🔐 Güvenlik

Bu policy'ler şunları sağlar:
- ✅ Müşteriler sadece kendi adlarına konuşma başlatabilir
- ✅ Partnerler sadece kendi konuşmalarını görebilir
- ✅ Cross-user veri erişimi engellenir
- ✅ SQL injection koruması (RLS engine seviyesinde)

## 🚀 Alternatif: Terminal Üzerinden

Eğer Supabase CLI kuruluysa:

```bash
cd /workspaces/yolmov
npx supabase db push --file migrations/043_fix_conversations_insert_policy.sql
```

veya

```bash
psql $DATABASE_URL -f migrations/043_fix_conversations_insert_policy.sql
```

## ✅ Test Sonucu

Bu migration'dan sonra:
- ✅ Müşteriler partnerlere mesaj gönderebilir
- ✅ 403 Forbidden hatası alınmaz
- ✅ Konuşmalar güvenli bir şekilde oluşturulur

---

**Son Güncelleme:** 12 Aralık 2025  
**Dosya:** `/migrations/043_fix_conversations_insert_policy.sql`
