# Migration 012: Partner Rating Auto-Update Trigger

## Sorun
Müşteri partner'ı değerlendirdiğinde (review verdiğinde), partners tablosundaki `rating` kolonu **otomatik güncellenmiyor**.

Örnek:
- Partner rating: 4.8
- Review veriliyor: 5.0 yıldız
- Beklenen: Partner rating → 4.9
- **Gerçek: Partner rating hala 4.8** ❌

## Çözüm: PostgreSQL Trigger

Otomatik rating güncelleme sistemi:

```sql
-- Her review eklendiğinde/güncellendiğinde/silindiğinde
-- Partner'ın tüm review'larının ortalamasını hesapla
-- Partners tablosundaki rating'i güncelle
```

## Nasıl Çalışır?

### 1. Fonksiyon: `update_partner_rating()`
- Review eklendiğinde tetiklenir
- İlgili partner'ın tüm review'larını sorgular
- Ortalama puan hesaplar (ROUND 1 ondalık)
- Partners.rating kolonunu günceller

### 2. Triggerlar
- **INSERT**: Yeni review → Rating güncelle
- **UPDATE**: Review düzenleme → Rating güncelle  
- **DELETE**: Review silme → Rating güncelle

### 3. İlk Kurulum
Mevcut tüm partner'ların rating'ini düzeltir (one-time fix)

## Supabase SQL Editor'da Çalıştır

1. https://supabase.com/dashboard/project/uwslxmciglqxpvfbgjzm/sql/new
2. Aşağıdaki SQL'i yapıştır:

```sql
-- PostgreSQL Trigger: Partner rating otomatik güncelleme

-- 1. Rating hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION update_partner_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE partners
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM partner_reviews
    WHERE partner_id = COALESCE(NEW.partner_id, OLD.partner_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.partner_id, OLD.partner_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger oluştur: Review INSERT
DROP TRIGGER IF EXISTS partner_review_insert_trigger ON partner_reviews;
CREATE TRIGGER partner_review_insert_trigger
AFTER INSERT ON partner_reviews
FOR EACH ROW
EXECUTE FUNCTION update_partner_rating();

-- 3. Trigger oluştur: Review UPDATE
DROP TRIGGER IF EXISTS partner_review_update_trigger ON partner_reviews;
CREATE TRIGGER partner_review_update_trigger
AFTER UPDATE ON partner_reviews
FOR EACH ROW
EXECUTE FUNCTION update_partner_rating();

-- 4. Trigger oluştur: Review DELETE
DROP TRIGGER IF EXISTS partner_review_delete_trigger ON partner_reviews;
CREATE TRIGGER partner_review_delete_trigger
AFTER DELETE ON partner_reviews
FOR EACH ROW
EXECUTE FUNCTION update_partner_rating();

-- 5. Mevcut tüm partner'ların rating'ini düzelt (tek seferlik)
UPDATE partners p
SET rating = COALESCE((
  SELECT ROUND(AVG(pr.rating)::numeric, 1)
  FROM partner_reviews pr
  WHERE pr.partner_id = p.id
), 0);

-- Başarı mesajı
SELECT 'Rating trigger başarıyla oluşturuldu!' as message;
```

3. **Run** (F5) butonuna bas

## Beklenen Sonuç

✅ Success: "Rating trigger başarıyla oluşturuldu!"

## Test

SQL çalıştırdıktan sonra test:

```sql
-- Test review ekle
INSERT INTO partner_reviews (
  partner_id, 
  customer_id, 
  rating, 
  comment
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test-customer',
  4,
  'Test review'
) RETURNING *;

-- Partner rating'i kontrol et (otomatik güncellenmiş olmalı)
SELECT name, rating FROM partners 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

## Özellikler

✅ **Otomatik**: Manuel kod gerekmez  
✅ **Gerçek Zamanlı**: Review verilir verilmez güncellenir  
✅ **Tutarlı**: Her zaman doğru ortalama  
✅ **Performanslı**: Sadece ilgili partner güncellenir  
✅ **Güvenli**: PostgreSQL seviyesinde çalışır

## Sonuç

Bu trigger sonrası:
- Müşteri 5 yıldız verir → Partner rating otomatik artar
- Müşteri 1 yıldız verir → Partner rating otomatik düşer
- Review silinir → Rating yeniden hesaplanır
- Review düzenlenir → Rating güncellenir
