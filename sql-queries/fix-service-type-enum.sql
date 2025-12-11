-- ============================================
-- SERVICE TYPE ENUM FIX
-- Eksik hizmet türlerini enum'a ekleme
-- ============================================

-- Mevcut enum değerlerini kontrol et
SELECT enum_range(NULL::service_type);
-- Beklenen: {cekici,aku,lastik,yakit,yardim}

-- Yeni değerleri ekle (PostgreSQL 9.1+)
-- NOT: Her ALTER TYPE komutu AYRI ÇALIŞTIRILMALIDIR (transaction dışında)

ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'tamir';
-- Oto tamir servisleri için

ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'anahtar';  
-- Anahtar çilingir servisleri için

-- Sonuçları kontrol et
SELECT enum_range(NULL::service_type);
-- Beklenen: {cekici,aku,lastik,yakit,yardim,tamir,anahtar}

-- ============================================
-- NOT: PostgreSQL enum'larına değer ekleme sınırlamaları:
-- 1. Enum değerleri bir transaction içinde eklenemez
-- 2. Bu SQL'i tek başına çalıştırın (transaction dışında)
-- 3. Eğer hata alırsanız, manuel olarak:
--    - Supabase Dashboard > SQL Editor
--    - Her satırı TEK TEK çalıştırın
-- ============================================

-- Alternatif: Eğer yukarıdaki çalışmazsa, enum'ı yeniden oluşturun:
/*
-- SADECE GEREKİRSE KULLANIN:

-- 1. Yeni enum oluştur
CREATE TYPE service_type_new AS ENUM (
  'cekici', 
  'aku', 
  'lastik', 
  'yakit', 
  'yardim',
  'tamir',
  'anahtar'  -- İleride lazım olabilir
);

-- 2. Tabloları güncelle
ALTER TABLE partners 
  ALTER COLUMN service_types TYPE service_type_new[] 
  USING service_types::text[]::service_type_new[];

ALTER TABLE requests 
  ALTER COLUMN service_type TYPE service_type_new 
  USING service_type::text::service_type_new;

-- 3. Eski enum'ı sil ve yenisini adlandır
DROP TYPE service_type;
ALTER TYPE service_type_new RENAME TO service_type;
*/
