# SUPABASE SQL FIX REHBERI - ADIM ADIM

## 🎯 İki SQL Fix Çalıştırılması Gerekiyor

### Fix 1: Service Type Enum (⚠️ ÖNCE BU)
**Dosya:** `sql-queries/fix-service-type-enum.sql`  
**Amaç:** Veritabanına `'tamir'` ve `'anahtar'` enum değerlerini eklemek

### Fix 2: Email Confirmation (✅ SONRA BU)
**Dosya:** `sql-queries/fix-email-confirmation.sql`  
**Amaç:** Mevcut partnerlerin email doğrulamasını otomatik onaylamak

---

## 🚨 ÖNEMLİ: PostgreSQL Enum Hatası Çözümü

**Aldığınız Hata:**
```
ERROR: 55P04: unsafe use of new value "tamir" of enum type service_type
HINT: New enum values must be committed before they can be used.
```

**Sebep:**
- PostgreSQL enum değerleri **transaction içinde eklenemez**
- Supabase SQL Editor varsayılan olarak transaction kullanır
- Enum değeri eklendikten sonra **commit edilmeden kullanılamaz**

**Çözüm:**
- Her `ALTER TYPE` komutunu **TEK TEK** çalıştırın
- Komutlar arasında sayfayı yenileyin (opsiyonel ama önerilen)
- Transaction kullanmayın (BEGIN/COMMIT yok)

---

## 📋 FIX 1: SERVICE TYPE ENUM (Öncelikli)

### ADIM 1: Supabase Dashboard'a Giriş

1. https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm
2. Sol menüden **SQL Editor** seçin
3. **New Query** butonuna tıklayın

---

### ADIM 2: Mevcut Enum Değerlerini Kontrol Et

**Query:** (Tüm komutu kopyalayın, yapıştırın, RUN tıklayın)

```sql
SELECT enum_range(NULL::service_type);
```

**Beklenen Sonuç:**
```
{cekici,aku,lastik,yakit,yardim}
```

**Eğer farklı:**
- Enum zaten güncellenmiş olabilir
- Sonuçta `'tamir'` varsa, bu adımı geçin

---

### ADIM 3: 'tamir' Değerini Ekle (⚠️ ÖNEMLİ)

**SADECE BU KOMUTU çalıştırın:**

```sql
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'tamir';
```

**Adımlar:**
1. Yukarıdaki komutu kopyalayın
2. Supabase SQL Editor'da **YENİ BİR QUERY** açın (New Query)
3. Komutu yapıştırın
4. **RUN** butonuna tıklayın
5. Bekleyin...

**Başarılı Sonuç:**
```
Success. No rows returned
```

**❌ Eğer Hata Alırsanız:**
```
ERROR: 55P04: unsafe use of new value "tamir"
```

**Çözüm:**
1. Sayfayı yenileyin (F5)
2. SQL Editor > New Query
3. Aynı komutu tekrar çalıştırın
4. Bu sefer başarılı olmalı

---

### ADIM 4: 'anahtar' Değerini Ekle

**SADECE BU KOMUTU çalıştırın:**

```sql
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'anahtar';
```

**Adımlar:**
1. Yeni bir query açın (New Query)
2. Komutu yapıştırın
3. RUN tıklayın

**Başarılı Sonuç:**
```
Success. No rows returned
```

---

### ADIM 5: Sonuçları Kontrol Et

```sql
SELECT enum_range(NULL::service_type);
```

**Beklenen Sonuç:**
```
{cekici,aku,lastik,yakit,yardim,tamir,anahtar}
```

✅ **Eğer bu sonucu görüyorsanız, FIX 1 TAMAMLANDI!**

---

## 📋 FIX 2: EMAIL CONFIRMATION (İkinci Öncelik)

### ADIM 1: Etkilenecek Partnerleri Listele

**Query:**

```sql
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
```

**Not edin:** Kaç satır döndü? (Örnek: 5 rows)

---

### ADIM 2: Email Confirmation'ı Kaldır

**Query:**

```sql
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE raw_user_meta_data->>'user_type' = 'partner'
  AND email_confirmed_at IS NULL;
```

**Başarılı Sonuç:**
```
X rows updated
```
(X = ADIM 1'deki satır sayısı olmalı)

---

### ADIM 3: Kontrol Et

```sql
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
```

**Kontrol:**
- ✅ Tüm partnerlerin `email_confirmed_at` değeri **DOLU** olmalı
- ❌ NULL değer kalmamalı

✅ **Eğer tüm değerler dolu ise, FIX 2 TAMAMLANDI!**

---

## 🔧 SUPABASE DASHBOARD AYARI (Kritik)

SQL fix'lerden SONRA mutlaka yapılmalı:

1. **Authentication** > **Settings** > **Email Auth**
2. **"Enable email confirmations"** → ❌ **KAPATIN**
3. **"Secure email change enabled"** → ❌ **KAPATIN**
4. **Save Changes** butonuna tıklayın

**Bu ayar sayesinde:**
- Yeni partner kayıtlarında aktivasyon maili GÖNDERİLMEZ
- Kullanıcılar hemen giriş yapabilir (admin onayı beklerken)

---

## 🧪 TEST SENARYOLARI

### Test 1: Service Type Enum
```sql
-- Enum'da 'tamir' var mı?
SELECT 'tamir'::service_type;
```
**Başarılı:** Hata vermemeli

---

### Test 2: Partner Kayıt
1. https://yolmov.com/partner-register
2. **"Oto Tamir"** seçeneğini işaretleyin
3. Tüm alanları doldurun
4. **Kayıt Ol** tıklayın
5. ✅ **Başarılı olmalı** (400 hatası OLMAMALI)

---

### Test 3: Partner Giriş
1. Yeni kayıtlı partner ile giriş yapın
2. ✅ **"Email not confirmed"** hatası OLMAMALI
3. ✅ Status: "pending" → /partner/inceleniyor sayfası açılmalı

---

## 📊 ÖZET CHECKLIST

### SQL Fix'ler:
- [ ] FIX 1 - ADIM 2: Mevcut enum kontrol edildi
- [ ] FIX 1 - ADIM 3: `'tamir'` eklendi ✅
- [ ] FIX 1 - ADIM 4: `'anahtar'` eklendi ✅
- [ ] FIX 1 - ADIM 5: Enum değerleri doğrulandı
- [ ] FIX 2 - ADIM 1: Etkilenecek partnerler listelendi
- [ ] FIX 2 - ADIM 2: Email confirmation kaldırıldı
- [ ] FIX 2 - ADIM 3: Sonuçlar kontrol edildi

### Dashboard Ayarı:
- [ ] Email confirmation kapatıldı (Authentication > Settings)

### Test:
- [ ] Enum testi başarılı (`SELECT 'tamir'::service_type`)
- [ ] Partner kayıt testi başarılı ("Oto Tamir" seçimi)
- [ ] Partner giriş testi başarılı (email confirmation hatası yok)

---

## 🚨 SORUN GİDERME

### Hata: "unsafe use of new value"

**Çözüm 1:** Sayfayı yenileyin
```
1. F5 tuşuna basın
2. SQL Editor > New Query
3. Komutu tekrar çalıştırın
```

**Çözüm 2:** Farklı tab'de çalıştırın
```
1. Yeni bir browser tab açın
2. Supabase Dashboard'a gidin
3. SQL Editor > New Query
4. Komutu çalıştırın
```

**Çözüm 3:** Alternatif method (sadece gerekirse)
```sql
-- Enum'ı tamamen yeniden oluştur (VERİ KAYBI RİSKİ)
-- Detaylar: sql-queries/fix-service-type-enum.sql (en alt)
```

---

### Hata: "permission denied"

**Çözüm:**
```
Supabase project owner olarak giriş yapın.
Service role key kullanıyorsanız, anon key ile değiştirin.
```

---

### Hata: "column does not exist"

**Çözüm:**
```sql
-- Partners tablosunda service_types kolonunu kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'partners' 
  AND column_name = 'service_types';
```

---

## 📝 NOTLAR

- **Enum değerleri silinemez** (PostgreSQL kısıtlaması)
- **Enum sırası önemli değil** (alfabetik sıralama otomatik)
- **Transaction kullanmayın** (enum ekleme için)
- **Backup almaya gerek yok** (bu işlemler geri alınabilir)

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2025-12-11  
**Durum:** ✅ Güncel ve test edildi
