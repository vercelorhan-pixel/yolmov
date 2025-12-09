-- PostgreSQL Trigger: Partner rating otomatik güncelleme
-- Her yeni review eklendiğinde veya güncellendiğinde partner'ın rating'ini hesapla

-- 1. Rating hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION update_partner_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Yeni veya güncellenen review'ın partner'ı için ortalama hesapla
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
