-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- Customer bildirim tercihleri için
-- ============================================

CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Bildirim Kanalları
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  
  -- Bildirim Türleri
  order_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT false,
  newsletter BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast customer lookups
CREATE INDEX idx_notification_prefs_customer_id ON customer_notification_preferences(customer_id);

-- RLS Policies
ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi tercihlerini görebilir
CREATE POLICY "Users can view own notification preferences"
  ON customer_notification_preferences
  FOR SELECT
  USING (auth.uid() = customer_id);

-- Kullanıcılar sadece kendi tercihlerini ekleyebilir
CREATE POLICY "Users can insert own notification preferences"
  ON customer_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Kullanıcılar sadece kendi tercihlerini güncelleyebilir
CREATE POLICY "Users can update own notification preferences"
  ON customer_notification_preferences
  FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Kullanıcılar sadece kendi tercihlerini silebilir
CREATE POLICY "Users can delete own notification preferences"
  ON customer_notification_preferences
  FOR DELETE
  USING (auth.uid() = customer_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON customer_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

COMMENT ON TABLE customer_notification_preferences IS 'Müşteri bildirim tercihleri - email, push, sipariş güncellemeleri, kampanyalar vb.';
