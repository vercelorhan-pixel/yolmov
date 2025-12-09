-- NOTIFICATIONS TABLE
-- Kullanıcı bildirimleri için

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Bildirim İçeriği
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'offer_received',      -- Yeni teklif alındı
    'offer_accepted',      -- Teklif kabul edildi
    'offer_rejected',      -- Teklif reddedildi
    'request_matched',     -- Talep eşleşti
    'request_cancelled',   -- Talep iptal edildi
    'profile_updated',     -- Profil güncellendi
    'system',              -- Sistem bildirimi
    'payment_received',    -- Ödeme alındı
    'service_started',     -- Hizmet başladı
    'service_completed'    -- Hizmet tamamlandı
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,           -- request_id, offer_id veya diğer ilgili kayıt
  related_type VARCHAR(50),  -- 'request', 'offer', 'payment' vb.
  action_url VARCHAR(500),   -- Tıklayınca gidilecek URL
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Indexes için
  CONSTRAINT notifications_customer_fk FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_customer_unread ON notifications(customer_id, read) WHERE read = FALSE;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Sistem bildirimleri oluşturabilir (backend tarafından)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu işareti için)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Kullanıcılar kendi bildirimlerini silebilir
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = customer_id);

-- Trigger: read_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = TRUE AND OLD.read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

COMMENT ON TABLE notifications IS 'Kullanıcı bildirimleri - teklifler, sistem mesajları, güncellemeler';
