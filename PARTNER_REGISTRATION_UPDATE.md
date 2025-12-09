# Partner Registration - Document Upload & TC/VKN Validation

## 🔧 Yapılan Güncellemeler

### 1. TC Kimlik No & Vergi Kimlik No Algoritmaları
**Dosya:** `services/validation.ts`

#### Yeni Fonksiyonlar:
```typescript
// VKN (10 haneli) - T.C. Gelir İdaresi algoritması
export const validateVergiNo(value: string): boolean

// TC veya VKN otomatik tespiti
export const validateTCOrVKN(value: string): {
  isValid: boolean;
  type: 'TC' | 'VKN' | 'unknown';
  message: string;
}
```

#### Algoritmalar:
**TC Kimlik No (11 hane):**
- 10. Hane: `((Tekler * 7) - Çiftler) % 10`
- 11. Hane: `(İlk 10 hane toplamı) % 10`

**Vergi Kimlik No (10 hane):**
- `(hane + (9 - index)) % 10`
- `2^(9-i) ile çarp, mod 9 al`
- Son hane: `(10 - (sum % 10)) % 10`

---

### 2. Belge Yükleme Sistemi
**Dosya:** `components/PartnerRegisterPage.tsx`

#### Yeni Özellikler:
- ✅ **Ticari Sicil Gazetesi** yükleme
- ✅ **Araç Ruhsatı** yükleme
- ✅ Otomatik görsel sıkıştırma (max 1MB)
- ✅ Supabase Storage entegrasyonu
- ✅ Upload progress göstergesi
- ✅ Başarılı yükleme checkmark

#### State Eklendi:
```typescript
const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
const [uploadedDocs, setUploadedDocs] = useState<{
  commercialRegistry?: string;
  vehicleLicense?: string;
}>({});
```

#### Fonksiyonlar:
```typescript
handleDocumentUpload(docType, file)  // Sıkıştır + Upload
triggerFileInput(docType)            // File input trigger
```

---

### 3. Database Migration Güncellemesi
**Dosya:** `migrations/005_partner_registration_fields.sql`

#### Yeni Kolonlar Eklendi:
```sql
commercial_registry_url TEXT  -- Ticari sicil belgesi
vehicle_license_url TEXT       -- Araç ruhsat belgesi
```

#### Güncellenmiş Comment:
```sql
COMMENT ON COLUMN partners.tax_number IS 
  'TC Kimlik No (11 hane) veya Vergi Kimlik No (10 hane)';
```

---

### 4. Form Güncellemeleri

#### Placeholder Değişti:
**Eski:** `"Vergi Numarası"`  
**Yeni:** `"TC Kimlik No (11 hane) veya Vergi No (10 hane)"`

#### Validation Mesajları:
- ✅ "Geçerli TC Kimlik Numarası"
- ✅ "Geçerli Vergi Kimlik Numarası"
- ✅ "Geçersiz TC Kimlik Numarası"
- ✅ "Geçersiz Vergi Kimlik Numarası"
- ✅ "TC Kimlik No (11 hane) veya Vergi Kimlik No (10 hane) giriniz"

#### Buton Durumları:
```tsx
// Yükleniyor
<Loader /> Yükleniyor...

// Yüklendi
<CheckCircle2 /> Ticari Sicil Gazetesi ✓

// Varsayılan
Ticari Sicil Gazetesi Yükle
```

---

## 🚀 Deployment Adımları

### 1. Migration Çalıştırma (ÖNEMLİ!)
```sql
-- Supabase Dashboard > SQL Editor
-- migrations/005_partner_registration_fields.sql dosyasını çalıştır

ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS commercial_registry_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_license_url TEXT;
```

### 2. Supabase Storage Bucket Oluşturma
```sql
-- Supabase Dashboard > Storage > Create Bucket
Bucket Name: documents
Public: false (güvenlik için)

-- RLS Policy ekle (partner belgeler için)
CREATE POLICY "Partners can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND 
            auth.uid() IN (SELECT id FROM partners));

CREATE POLICY "Admins can view documents"
ON storage.objects FOR SELECT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

### 3. Frontend Deploy
```bash
git add .
git commit -m "TC/VKN validation + Document upload"
git push origin main
```

---

## 🧪 Test Senaryoları

### TC Kimlik No Testi:
```
Geçerli TCKN: 12345678901 (örnek)
Test: Form doldurup submit et
Beklenen: ✅ "Geçerli TC Kimlik No" mesajı
```

### Vergi Kimlik No Testi:
```
Geçerli VKN: 1234567890 (örnek)
Test: 10 haneli numara gir
Beklenen: ✅ "Geçerli Vergi Kimlik No" mesajı
```

### Belge Yükleme Testi:
```
1. "Ticari Sicil Gazetesi Yükle" butonuna tıkla
2. Görsel/PDF seç (örn: 5MB JPEG)
3. Otomatik sıkıştırma (1MB'ye düşer)
4. Supabase'e upload
5. Buton: <CheckCircle2 /> Ticari Sicil Gazetesi ✓
```

### Hata Durumları:
```
Geçersiz TC: 00000000000 → "İlk hane 0 olamaz"
Geçersiz VKN: 123456789X → "Sadece rakam giriniz"
Yanlış uzunluk: 123 → "TC (11) veya VKN (10) giriniz"
```

---

## 🔍 Supabase 400 Hatası Çözümü

**Hata:**
```
uwslxmciglqxpvfbgjzm.supabase.co/rest/v1/partners?select=*:1
Failed to load resource: the server responded with a status of 400
```

**Sebep:**  
Migration çalıştırılmamış → `first_name`, `last_name`, `company_name` kolonları yok

**Çözüm:**
1. Supabase Dashboard > SQL Editor
2. `migrations/005_partner_registration_fields.sql` çalıştır
3. Başarı mesajı görünmeli
4. Formu tekrar test et

---

## 📊 Database Schema (Final)

```sql
CREATE TABLE partners (
  -- Mevcut kolonlar
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  city VARCHAR(100),
  district VARCHAR(100),
  service_types service_type[],
  status user_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_jobs INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  
  -- YENİ: Kayıt formu kolonları
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  tax_number VARCHAR(50) UNIQUE,  -- TC (11) veya VKN (10)
  sector VARCHAR(50),
  vehicle_count INTEGER DEFAULT 0,
  vehicle_types TEXT,
  
  -- YENİ: Belge URL'leri
  commercial_registry_url TEXT,
  vehicle_license_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎉 Özet

### ✅ Tamamlanan:
- TC Kimlik No doğrulama algoritması (11 hane)
- Vergi Kimlik No doğrulama algoritması (10 hane)
- Otomatik tip tespiti (TC vs VKN)
- Belge yükleme fonksiyonalitesi
- Görsel sıkıştırma (1MB max)
- Supabase Storage entegrasyonu
- Upload progress göstergesi
- Database migration güncellemesi

### ⚠️ Manuel Adımlar:
1. Migration çalıştır (Supabase SQL Editor)
2. Storage bucket oluştur (`documents`)
3. RLS policies ayarla
4. Test et!

---

**Hazır! 🚀**
