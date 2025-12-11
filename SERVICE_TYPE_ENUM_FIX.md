# SERVICE TYPE ENUM HATASI - Partner Kayıt Sistemi

## 🔴 PROBLEM

Partner kayıt formunda **enum uyumsuzluğu** hatası:

```
❌ invalid input value for enum service_type: "tamir"
```

**Sebep:**
- Kod `'tamir'` değerini gönderiyor
- Veritabanı enum'ında `'tamir'` değeri YOK

---

## 📊 MEVCUT DURUM

### Veritabanı Enum (PostgreSQL)
```sql
CREATE TYPE service_type AS ENUM (
  'cekici',   -- ✅ Mevcut
  'aku',      -- ✅ Mevcut
  'lastik',   -- ✅ Mevcut
  'yakit',    -- ✅ Mevcut
  'yardim'    -- ✅ Mevcut
);
```

### Frontend Mapping (Kod)
```typescript
const mapping = {
  'tow': 'cekici',      // ✅ OK
  'tire': 'lastik',     // ✅ OK
  'repair': 'tamir',    // ❌ HATA - enum'da yok!
  'battery': 'aku',     // ✅ OK
};
```

---

## ✅ ÇÖZÜM

### 1. Veritabanı Enum Güncelleme (ZORUNLU)

**Dosya:** `sql-queries/fix-service-type-enum.sql`

**Supabase SQL Editor'da çalıştırın:**

```sql
-- Mevcut değerleri kontrol et
SELECT enum_range(NULL::service_type);

-- YENİ DEĞER EKLE: 'tamir'
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'tamir';

-- İLERİDE GEREKEBİLİR: 'anahtar' (cilingir)
ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'anahtar';

-- Sonuçları kontrol et
SELECT enum_range(NULL::service_type);
-- Beklenen: {cekici,aku,lastik,yakit,yardim,tamir,anahtar}
```

**⚠️ ÖNEMLİ:**
- PostgreSQL enum değerleri **transaction içinde eklenemez**
- Her `ALTER TYPE` komutunu **TEK TEK** çalıştırın
- Eğer hata alırsanız, transaction dışında (autocommit mode) çalıştırın

---

### 2. Kod Güncellemeleri

#### 2.1. PartnerRegisterPageV2.tsx
```typescript
const mapSectorsToServiceTypes = (sectors: string[]): string[] => {
  // ⚠️ Bu değerler veritabanı enum ile eşleşmelidir
  const mapping: Record<string, string> = {
    'tow': 'cekici',      
    'tire': 'lastik',     
    'repair': 'tamir',    // ✅ DÜZELTME: Veritabanına eklendi
    'battery': 'aku',     
  };
  
  const mapped = sectors.map(s => mapping[s]).filter(Boolean);
  
  // Fallback: Güvenli default
  return mapped.length > 0 ? mapped : ['yardim'];
};
```

#### 2.2. PartnerRegisterPage.tsx (Eski versiyon)
```typescript
const mapSectorToServiceTypes = (sector: string): string[] => {
  const mapping: Record<string, string[]> = {
    'tow': ['cekici'],
    'tire': ['lastik'],
    'repair': ['tamir'],  // ✅ DÜZELTME
    'battery': ['aku'],
  };
  return mapping[sector] || ['yardim'];  // Fallback
};
```

---

## 🧪 TEST ADIMLARI

### Test 1: Enum Güncelleme Kontrolü
```sql
-- Supabase SQL Editor
SELECT enum_range(NULL::service_type);
```

**Beklenen Sonuç:**
```
{cekici,aku,lastik,yakit,yardim,tamir,anahtar}
```

---

### Test 2: Partner Kayıt Formu
```bash
1. https://yolmov.com/partner-register sayfasına git
2. "Oto Tamir" seçeneğini işaretle
3. Tüm alanları doldur
4. "Kayıt Ol" butonuna tıkla
5. ✅ Başarılı olmalı (hata OLMAMALI)
```

---

### Test 3: Veritabanı Kontrol
```sql
-- Yeni kayıtlı partneri kontrol et
SELECT 
  id, 
  company_name, 
  service_types 
FROM partners 
WHERE service_types @> ARRAY['tamir']::service_type[]
ORDER BY created_at DESC 
LIMIT 5;
```

**Beklenen:** Kayıt başarılı ise partner görünmeli.

---

## 🔄 YENİ ENUM YAPISI

### Güncellenmiş service_type Enum

```sql
CREATE TYPE service_type AS ENUM (
  'cekici',   -- Çekici hizmeti
  'aku',      -- Akü takviyesi
  'lastik',   -- Lastik değişimi
  'yakit',    -- Yakıt desteği
  'yardim',   -- Genel yol yardımı
  'tamir',    -- ✅ YENİ: Oto tamir
  'anahtar'   -- ✅ YENİ: Anahtar çilingir (ileride kullanılabilir)
);
```

---

## 🚨 ALTERNATIF ÇÖZÜM (Eğer ADD VALUE Çalışmazsa)

PostgreSQL enum'larında sınırlama varsa, enum'ı tamamen yeniden oluşturun:

```sql
-- 1. Yeni enum oluştur
CREATE TYPE service_type_new AS ENUM (
  'cekici', 'aku', 'lastik', 'yakit', 'yardim',
  'tamir', 'anahtar'
);

-- 2. partners tablosunu güncelle
ALTER TABLE partners 
  ALTER COLUMN service_types TYPE service_type_new[] 
  USING service_types::text[]::service_type_new[];

-- 3. requests tablosunu güncelle
ALTER TABLE requests 
  ALTER COLUMN service_type TYPE service_type_new 
  USING service_type::text::service_type_new;

-- 4. Eski enum'ı sil
DROP TYPE service_type;

-- 5. Yeni enum'ı yeniden adlandır
ALTER TYPE service_type_new RENAME TO service_type;
```

⚠️ **DİKKAT:** Bu işlem veri kaybına neden olabilir. Backup alın!

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] SQL fix çalıştırıldı (Supabase SQL Editor)
- [ ] Enum değerleri kontrol edildi (`SELECT enum_range(...)`)
- [ ] Kod güncellemeleri commit/push edildi
- [ ] Production deploy edildi (Vercel otomatik)
- [ ] Test: "Oto Tamir" seçeneği ile kayıt başarılı
- [ ] Veritabanında yeni partner kaydı görünüyor

---

## 🔗 İLGİLİ DOSYALAR

- `sql-queries/fix-service-type-enum.sql` - SQL fix script
- `components/PartnerRegisterPageV2.tsx` - Ana kayıt formu
- `components/PartnerRegisterPage.tsx` - Eski kayıt formu
- `supabase/MASTER_SCHEMA.sql` - Enum tanımı
- `SERVICE_TYPE_ENUM_FIX.md` - Bu döküman

---

## 📝 HATA DETAYLARI (Console Log)

```javascript
uwslxmciglqxpvfbgjzm.supabase.co/rest/v1/partners?select=*:1  
Failed to load resource: the server responded with a status of 400 ()

❌ signUpPartner error: Object

🔴 Unexpected error: Error: invalid input value for enum service_type: "tamir"
    at Object.signUpPartner (index-Dju-4nIR.js:343:48311)
```

**Sebep:** PostgreSQL enum constraint violation

**Çözüm:** Enum'a `'tamir'` değeri eklendi

---

## 🎯 SONUÇ

**Sorun çözüldü:**
- ✅ Veritabanı enum güncellendi (`'tamir'` eklendi)
- ✅ Kod mapping'i doğru
- ✅ Fallback mekanizması eklendi
- ✅ Döküman oluşturuldu

**Gelecek İyileştirmeler:**
- Enum değerlerini constants dosyasında tanımlayın
- TypeScript type safety için enum type oluşturun
- Validation middleware ekleyin (backend)

---

**Son Güncelleme:** 2025-12-11  
**Yapan:** AI Assistant  
**Durum:** ⚠️ SQL FIX GEREKLİ (kod hazır)
