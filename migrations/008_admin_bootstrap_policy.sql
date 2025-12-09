-- Idempotent bootstrap policy for first admin creation
DO $$
BEGIN
  -- Ensure RLS enabled
  BEGIN
    EXECUTE 'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN others THEN
    NULL;
  END;

  -- Drop existing policy if name collides
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Allow first admin bootstrap'
  ) THEN
    EXECUTE 'DROP POLICY "Allow first admin bootstrap" ON public.admin_users';
  END IF;

  -- Create bootstrap insert policy: allow insert when table empty
  EXECUTE 'CREATE POLICY "Allow first admin bootstrap" ON public.admin_users FOR INSERT WITH CHECK (NOT EXISTS (SELECT 1 FROM public.admin_users))';
END$$;
