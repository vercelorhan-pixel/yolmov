# 🚀 SUPABASE HIZLI BAŞLANGIÇ

## Manuel Kurulum Adımları

### 1️⃣ SUPABASE DASHBOARD'A GİT
👉 **URL:** https://uwslxmciglqxpvfbgjzm.supabase.co

---

### 2️⃣ SCHEMA OLUŞTUR

**Sol Menü > SQL Editor > New Query**

📋 Dosyayı aç: `supabase/schema.sql`  
✂️ Tüm içeriği kopyala  
📝 SQL Editor'e yapıştır  
▶️ **RUN** butonuna bas

**Beklenen Çıktı:**
```
Success. 17 tables created.
```

---

### 3️⃣ RLS POLICIES EKLE

**SQL Editor > New Query**

📋 Dosyayı aç: `supabase/rls-policies.sql`  
✂️ Tüm içeriği kopyala  
📝 SQL Editor'e yapıştır  
▶️ **RUN** butonuna bas

**Beklenen Çıktı:**
```
Success. Policies created.
```

---

### 4️⃣ TEST VERİLERİNİ YÜKLE

**SQL Editor > New Query**

📋 Dosyayı aç: `supabase/seed.sql`  
✂️ Tüm içeriği kopyala  
📝 SQL Editor'e yapıştır  
▶️ **RUN** butonuna bas

**Beklenen Çıktı:**
```
Success. 40+ rows inserted.
```

---

### 5️⃣ STORAGE BUCKETS OLUŞTUR

**Sol Menü > Storage > New Bucket**

#### Bucket 1: partner-documents
- Name: `partner-documents`
- Public: ❌ **NO**
- File size limit: `10 MB`
- Allowed MIME types: `application/pdf,image/jpeg,image/png`

#### Bucket 2: customer-photos
- Name: `customer-photos`
- Public: ❌ **NO**
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg,image/png,image/webp`

#### Bucket 3: vehicle-images
- Name: `vehicle-images`
- Public: ✅ **YES**
- File size limit: `5 MB`
- Allowed MIME types: `image/jpeg,image/png,image/webp`

---

### 6️⃣ DOĞRULAMA

**SQL Editor > New Query**

```sql
-- Tablo sayısını kontrol et
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Beklenen: 17

-- Veri sayısını kontrol et
SELECT 'customers' as table_name, COUNT(*) as row_count FROM customers
UNION ALL
SELECT 'partners', COUNT(*) FROM partners
UNION ALL
SELECT 'requests', COUNT(*) FROM requests;
-- Beklenen: 5 customer, 5 partner, 5 request
```

---

## ✅ KURULUM TAMAMLANDI!

Şimdi kod tabanını güncelleyebiliriz 🎉

**Sonraki Adımlar:**
1. Component'lerde mockApi → supabaseApi migration
2. Auth entegrasyonu
3. Real-time subscriptions
4. Test

---

## 🆘 Sorun mu yaşıyorsun?

### Hata: "relation does not exist"
➡️ Schema SQL'i çalıştırmayı unuttun. Adım 2'yi tekrarla.

### Hata: "permission denied"
➡️ RLS policies çalışmıyor. Adım 3'ü tekrarla.

### Hata: "bucket not found"
➡️ Storage buckets oluşturulmamış. Adım 5'i tekrarla.

---

## 📞 Test Kullanıcıları

**Admin:**
- Email: `admin@yolmov.com`
- Password: (Supabase Auth'da manuel oluşturulacak)

**Partner:**
- Email: `hizli@partner.com`
- Password: (Supabase Auth'da manuel oluşturulacak)

**Customer:**
- Email: `ahmet@example.com`
- Password: (Supabase Auth'da manuel oluşturulacak)

