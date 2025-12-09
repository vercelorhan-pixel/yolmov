# 🔧 SUPABASE SQL HATALARI DÜZELTİLDİ (v2)

## ⚠️ ÖNEMLİ: Önceki Denemeler Varsa

Eğer daha önce SQL dosyalarını çalıştırdıysanız:

### Adım 0: Temizlik (CLEANUP)
```
1. SQL Editor > New Query
2. supabase/CLEANUP.sql içeriğini kopyala > RUN
3. "Success" mesajını bekle
```
✅ Bu tüm tabloları, ENUM'ları, policies'leri silecek

---

## ✅ Yapılan Düzeltmeler

### 1. Schema (schema.sql)
**Sorun:** ENUM'lar zaten varsa hata veriyor
**Çözüm:** CLEANUP.sql ile önce tüm ENUM'ları sil, sonra yeniden oluştur

### 2. RLS Policies (rls-policies.sql)
**Sorun:** Policy'ler zaten varsa hata veriyor
**Çözüm:** CLEANUP.sql ile önce tüm policy'leri sil, sonra yeniden oluştur

### 3. Seed Data (seed.sql)
**Sorun 1:** UUID cast eksikliği
**Sorun 2:** `created_at` kolonu eksik (credit_transactions, system_logs)

**Çözümler:**
```sql
-- ✅ Tüm UUID'ler cast edildi
'p1111111-1111-1111-1111-111111111111'::uuid

-- ✅ created_at eklendi
INSERT INTO credit_transactions (..., created_at) VALUES
INSERT INTO system_logs (..., created_at) VALUES
```

---

## 🚀 DOĞRU KURULUM SIRASI

### 🧹 Adım 1: Temizlik (Eğer önceden denediyseniz)

```
SQL Editor > New Query
supabase/CLEANUP.sql > Kopyala > RUN
```

### 📊 Adım 2: Schema Oluştur

```
SQL Editor > New Query
supabase/schema.sql > Kopyala > RUN
```
✅ Beklenen: "Success. 17 tables created."

### 🔒 Adım 3: RLS Policies

```
SQL Editor > New Query
supabase/rls-policies.sql > Kopyala > RUN
```
✅ Beklenen: "Success. Policies created."

### 🎲 Adım 4: Test Verisi

```
SQL Editor > New Query
supabase/seed.sql > Kopyala > RUN
```
✅ Beklenen: "Success. 48 rows inserted."

### 📦 Adım 5: Storage Buckets

Storage > New Bucket > 3 bucket:

1. **partner-documents**
   - Public: ❌ NO
   - File size: 10 MB
   - MIME: `application/pdf,image/jpeg,image/png`

2. **customer-photos**
   - Public: ❌ NO
   - File size: 5 MB
   - MIME: `image/jpeg,image/png,image/webp`

3. **vehicle-images**
   - Public: ✅ YES
   - File size: 5 MB
   - MIME: `image/jpeg,image/png,image/webp`

---

## 🧪 Doğrulama

```sql
-- Tablo sayısı
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Beklenen: 17

-- Veri sayısı
SELECT 
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM partners) as partners,
  (SELECT COUNT(*) FROM requests) as requests,
  (SELECT COUNT(*) FROM offers) as offers;
-- Beklenen: 5, 5, 5, 5

-- ENUM'lar
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
-- Beklenen: 19 ENUM
```

---

## ✨ Test Kullanıcıları

### Admin:
```
Email: admin@yolmov.com
ID: a1111111-1111-1111-1111-111111111111
```

### Partner:
```
Email: hizli@partner.com
Name: Hızlı Çekici Hizmetleri
ID: p1111111-1111-1111-1111-111111111111
```

### Müşteri:
```
Email: ahmet@example.com
Phone: 05321234567
ID: c1111111-1111-1111-1111-111111111111
```

---

## 🎯 Sonraki Adım

SQL başarılı olduktan sonra:
- ✅ Component migration devam
- ✅ QuoteWizard.tsx güncelle
- ✅ PartnerDashboard.tsx güncelle
- ✅ Real-time test

---

**Güncellenme:** 28 Kasım 2025 - v2 (Cleanup eklendi)
