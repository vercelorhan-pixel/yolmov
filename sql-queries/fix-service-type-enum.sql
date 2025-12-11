-- ============================================
-- SERVICE TYPE ENUM FIX - ADIM ADIM
-- ============================================
-- ⚠️ KRİTİK: PostgreSQL enum'larına değer ekleme TRANSACTION DIŞINDA yapılmalıdır!
-- Hata: "unsafe use of new value of enum type" → Transaction içinde çalıştırıldı
-- Çözüm: Her komutu TEK TEK, AYRI AYRI çalıştırın (BEGIN/COMMIT KULLANMAYIN)
-- ============================================

-- ============================================
-- ADIM 1: Mevcut enum değerlerini kontrol et
-- ============================================
-- Bu komutu ÖNCE çalıştırın:

SELECT enum_range(NULL::service_type);

-- Beklenen sonuç: {cekici,aku,lastik,yakit,yardim}
-- Eğer farklı sonuç gelirse, enum zaten güncellenmiş olabilir

-- ============================================
-- ADIM 2: 'tamir' değerini ekle
-- ============================================
-- Bu komutu SADECE BU KOMUTU çalıştırın (tek başına):
-- NOT: Supabase SQL Editor'da "Run" butonuna basın, başka komut eklemeyin

ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'tamir';

-- ⏳ Başarılı mesajı bekleyin: "Success. No rows returned"
-- ❌ Eğer "unsafe use" hatası alırsanız:
--    1. Sayfayı yenileyin (F5)
--    2. Yeni bir query açın
--    3. Sadece bu komutu tekrar çalıştırın

-- ============================================
-- ADIM 3: 'anahtar' değerini ekle
-- ============================================
-- Yukarıdaki başarılı olduysa, ŞİMDİ bu komutu çalıştırın:

ALTER TYPE service_type ADD VALUE IF NOT EXISTS 'anahtar';

-- ⏳ Başarılı mesajı bekleyin

-- ============================================
-- ADIM 4: Sonuçları kontrol et
-- ============================================
-- Son olarak bu komutu çalıştırın:

SELECT enum_range(NULL::service_type);

-- Beklenen sonuç: {cekici,aku,lastik,yakit,yardim,tamir,anahtar}

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
