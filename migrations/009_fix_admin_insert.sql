-- Manuel admin kaydı ekle (f00b69dd-77b3-4098-9859-c1b387d33fab)
INSERT INTO admin_users (id, email, name, role, permissions, created_at)
VALUES (
  'f00b69dd-77b3-4098-9859-c1b387d33fab',
  'kilicorhaan+99@gmail.com',
  'Orhan Kılıç',
  'super_admin',
  ARRAY['all'],
  now()
)
ON CONFLICT (id) DO NOTHING;

-- RLS politikasını yeniden kontrol et ve düzelt
DROP POLICY IF EXISTS "Allow first admin bootstrap" ON admin_users;

CREATE POLICY "Allow first admin bootstrap"
ON admin_users
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1)
);

-- Admin'lerin kendi kayıtlarını görebilmesi için SELECT politikası
DROP POLICY IF EXISTS "Admin can view their own record" ON admin_users;

CREATE POLICY "Admin can view their own record"
ON admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Tüm adminler birbirini görebilir (admin paneli için)
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;

CREATE POLICY "Admins can view all admins"
ON admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
);
