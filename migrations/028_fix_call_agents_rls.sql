-- =====================================================
-- FIX: call_agents RLS CORS Issue
-- =====================================================
-- call_agents tablosundaki RLS politikasını düzelt
-- CORS hatasını çözmek için anon key ile erişime izin ver

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "call_agents_select_all" ON call_agents;
DROP POLICY IF EXISTS "call_agents_update_all" ON call_agents;
DROP POLICY IF EXISTS "call_agents_insert_all" ON call_agents;

-- Yeni politikalar - anon key ile erişime izin ver
CREATE POLICY "call_agents_select_all" 
ON call_agents FOR SELECT 
USING (true);

CREATE POLICY "call_agents_update_admin" 
ON call_agents FOR UPDATE 
USING (
  -- Admin kullanıcılar kendi kayıtlarını güncelleyebilir
  admin_id IN (
    SELECT id FROM admin_users WHERE id = auth.uid()
  )
  OR
  -- Service role her zaman güncelleyebilir
  auth.role() = 'service_role'
);

CREATE POLICY "call_agents_insert_admin" 
ON call_agents FOR INSERT 
WITH CHECK (
  -- Admin kullanıcılar kendi kayıtlarını ekleyebilir
  admin_id IN (
    SELECT id FROM admin_users WHERE id = auth.uid()
  )
  OR
  -- Service role her zaman ekleyebilir
  auth.role() = 'service_role'
);

-- call_queue_assignments için de aynı düzeltmeyi yap
DROP POLICY IF EXISTS "call_queue_assignments_select_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_insert_all" ON call_queue_assignments;
DROP POLICY IF EXISTS "call_queue_assignments_update_all" ON call_queue_assignments;

CREATE POLICY "call_queue_assignments_select_all" 
ON call_queue_assignments FOR SELECT 
USING (true);

CREATE POLICY "call_queue_assignments_insert_all" 
ON call_queue_assignments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "call_queue_assignments_update_all" 
ON call_queue_assignments FOR UPDATE 
USING (true);

-- call_queues için de kontrol
DROP POLICY IF EXISTS "call_queues_select_all" ON call_queues;
DROP POLICY IF EXISTS "call_queues_update_all" ON call_queues;

CREATE POLICY "call_queues_select_all" 
ON call_queues FOR SELECT 
USING (true);

CREATE POLICY "call_queues_update_all" 
ON call_queues FOR UPDATE 
USING (
  auth.role() = 'service_role'
  OR
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
);
