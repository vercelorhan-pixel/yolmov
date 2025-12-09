-- Campaigns Table Migration
-- Admin yönetimli kampanyalar için tablo

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  badge_text TEXT,
  valid_until TEXT, -- e.g. "31 Aralık 2024"
  discount INTEGER, -- e.g. 30 for 30%
  code TEXT, -- e.g. "ILKKULLANIM30"
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Herkes aktif kampanyaları okuyabilir
CREATE POLICY "Public can read active campaigns"
ON campaigns FOR SELECT
USING (is_active = true);

-- Adminler tüm kampanyaları okuyabilir
CREATE POLICY "Admins can read all campaigns"
ON campaigns FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Adminler kampanya oluşturabilir
CREATE POLICY "Admins can create campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Adminler kampanya güncelleyebilir
CREATE POLICY "Admins can update campaigns"
ON campaigns FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Adminler kampanya silebilir
CREATE POLICY "Admins can delete campaigns"
ON campaigns FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- Örnek kampanyalar ekle
INSERT INTO campaigns (title, description, image_url, badge_text, valid_until, discount, code, is_active, sort_order) VALUES
(
  'İlk Kullanıcılara %30 İndirim',
  'Yeni üyelere özel ilk hizmetlerinde %30 indirim fırsatı! Akü takviyesi, lastik değişimi ve daha fazlası...',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800',
  'Yeni Üyelere Özel',
  '31 Aralık 2024',
  30,
  'ILKKULLANIM30',
  true,
  1
),
(
  'Kış Bakım Paketi',
  'Aracınızı kışa hazırlayın! Akü kontrolü + Lastik kontrolü paket fiyatına.',
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=800',
  'Mevsimsel Kampanya',
  '28 Şubat 2025',
  25,
  'KISBAKIM25',
  true,
  2
);
