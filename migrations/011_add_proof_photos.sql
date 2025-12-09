-- Add proof photo columns to requests table
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS start_proof_photo TEXT,
ADD COLUMN IF NOT EXISTS end_proof_photo TEXT;

-- Add comments
COMMENT ON COLUMN public.requests.start_proof_photo IS 'Partner başlangıç kanıt fotoğrafı URL';
COMMENT ON COLUMN public.requests.end_proof_photo IS 'Partner bitiş kanıt fotoğrafı URL';
