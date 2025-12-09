# 🚀 SUPABASE DEVELOPMENT KURULUM

## Hızlı Başlangıç (5 Dakika)

### 1️⃣ Supabase SQL Çalıştır

**Supabase Dashboard > SQL Editor** adresine git ve sırayla çalıştır:

```sql
-- 1. CLEANUP (Eğer daha önce çalıştırdıysan)
-- supabase/CLEANUP.sql

-- 2. SCHEMA
-- supabase/schema.sql

-- 3. RLS'İ KAPAT (Development için)
-- supabase/DISABLE_RLS.sql

-- 4. TEST VERİLERİ (Opsiyonel)
-- supabase/seed.sql
```

### 2️⃣ Vercel Environment Variables

**Vercel Dashboard > Project Settings > Environment Variables**

```
VITE_SUPABASE_URL = https://uwslxmciglqxpvfbgjzm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Test Kullanıcıları

**B2C Müşteri (Kayıt):**
- Giriş sayfasında "Kayıt Ol" butonuna tıkla
- Email, Ad, Soyad gir
- Şifre belirle
- ✅ Otomatik olarak Supabase'e kaydedilir

**B2B Partner (Giriş):**
- Email: `hizli@partner.com`
- Şifre: (gerekli değil - dev mode)

**Admin (Giriş):**
- Email: `admin@yolmov.com`
- Şifre: (gerekli değil - dev mode)

---

## ⚠️ ÖNEMLİ NOTLAR

### RLS Neden Kapalı?

Development aşamasında RLS policies sonsuz döngüye neden oluyor:
- `admin_users` tablosunda `infinite recursion detected`
- Auth olmadan policy'ler çalışmıyor

**Çözüm:** `DISABLE_RLS.sql` ile tüm RLS'leri kapat.

**Production için:** Auth entegrasyonu tamamlandıktan sonra RLS'i tekrar aktif et.

---

## 📊 Veritabanı Durumu

**Tablolar:** 17 adet
- ✅ customers
- ✅ partners
- ✅ requests
- ✅ offers
- ✅ completed_jobs
- ✅ admin_users
- ... ve daha fazlası

**Test Verileri:**
- 4 Admin
- 5 Müşteri
- 5 Partner
- 5 Talep
- 5 Teklif

---

## 🔧 Sorun Giderme

### "Invalid API key" hatası
➡️ Vercel environment variables kontrol et

### "infinite recursion in policy"
➡️ `DISABLE_RLS.sql` çalıştır

### "relation does not exist"
➡️ `schema.sql` çalıştır

---

## 🎯 Sonraki Adımlar

1. ✅ Müşteri kayıt formu (email bazlı)
2. 🔄 Talep oluşturma (Supabase'e kaydet)
3. 🔄 Partner teklif verme
4. 🔄 Real-time bildirimler
5. 🔄 Auth entegrasyonu (production için)
