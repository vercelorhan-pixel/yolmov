-- Add archived field to requests table
-- Arşivlenen talepler listelemeden gizlenir ama silinmez

ALTER TABLE requests
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_archived ON requests(archived);

COMMENT ON COLUMN requests.archived IS 'Talep arşivlendi mi?';
COMMENT ON COLUMN requests.archived_at IS 'Talep ne zaman arşivlendi?';
