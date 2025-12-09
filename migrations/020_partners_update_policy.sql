-- Partners tablosu için UPDATE policy ekle
-- Admin ve authenticated kullanıcıların partner güncellemesine izin ver

-- Önce mevcut update policy'leri kaldır
DROP POLICY IF EXISTS "Allow update for authenticated users" ON partners;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON partners;
DROP POLICY IF EXISTS "Admins can update partners" ON partners;
DROP POLICY IF EXISTS "Partners can update own data" ON partners;

-- Yeni policy: Authenticated kullanıcılar tüm partner'ları güncelleyebilir (admin için)
CREATE POLICY "Enable update for authenticated users" ON partners
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Alternatif: Anon kullanıcılar da güncelleyebilsin (test için)
DROP POLICY IF EXISTS "Allow update for anon users" ON partners;
CREATE POLICY "Allow update for anon users" ON partners
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS'nin aktif olduğundan emin ol
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;


-- ============================================
-- VEHICLE_RETURN_ROUTES TABLE RLS POLICIES
-- ============================================

-- Önce mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow insert for anon users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow update for anon users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow delete for anon users" ON vehicle_return_routes;
DROP POLICY IF EXISTS "Allow select for all users" ON vehicle_return_routes;

-- RLS aktif et
ALTER TABLE vehicle_return_routes ENABLE ROW LEVEL SECURITY;

-- SELECT: Herkes okuyabilir
CREATE POLICY "Allow select for all users" ON vehicle_return_routes
  FOR SELECT
  USING (true);

-- INSERT: Authenticated ve anon kullanıcılar ekleyebilir
CREATE POLICY "Allow insert for authenticated users" ON vehicle_return_routes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert for anon users" ON vehicle_return_routes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- UPDATE: Authenticated ve anon kullanıcılar güncelleyebilir
CREATE POLICY "Allow update for authenticated users" ON vehicle_return_routes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow update for anon users" ON vehicle_return_routes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- DELETE: Authenticated ve anon kullanıcılar silebilir
CREATE POLICY "Allow delete for authenticated users" ON vehicle_return_routes
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete for anon users" ON vehicle_return_routes
  FOR DELETE
  TO anon
  USING (true);
