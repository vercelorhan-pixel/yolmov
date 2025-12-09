# Migration 011: Proof Photo Columns

## Sorun
Partner konuma vardığında ve iş bittiğinde kanıt fotoğrafı yüklerken hata alıyor:
- `start_proof_photo` kolonu yok
- `end_proof_photo` kolonu yok

## Çözüm
Aşağıdaki SQL'i Supabase SQL Editor'da çalıştır:

### SQL Komutu

```sql
-- Add proof photo columns to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,
ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;

-- Add comments
COMMENT ON COLUMN public.requests.start_proof_photo IS 'Partner başlangıç kanıt fotoğrafı URL';
COMMENT ON COLUMN public.requests.end_proof_photo IS 'Partner bitiş kanıt fotoğrafı URL';
```

### Nasıl Çalıştırılır

1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. **Yolmov** projesini seç
3. Sol menüden **SQL Editor** sekmesini aç
4. **New Query** butonuna bas
5. Yukarıdaki SQL'i yapıştır
6. **Run** (F5) butonuna bas

### Doğrulama

SQL çalıştıktan sonra kontrol et:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
AND column_name IN ('start_proof_photo', 'end_proof_photo');
```

Başarılı olursa 2 satır döner.

## Etkilenen Özellikler

✅ Partner "Konuma Vardım" - Başlangıç fotoğrafı  
✅ Partner "Görevi Tamamla" - Bitiş fotoğrafı  
✅ Fotoğraflar Supabase Storage'a yüklenir  
✅ URL'ler requests tablosuna kaydedilir
