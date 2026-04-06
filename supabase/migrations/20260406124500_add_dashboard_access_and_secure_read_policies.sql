-- Backend auth base for the dashboard:
-- 1. Authenticate users with Supabase Auth
-- 2. Link authenticated users to external dashboard userids
-- 3. Stop public read access on dashboard tables
-- 4. Allow read access only to authenticated users with active dashboard permission

CREATE TABLE IF NOT EXISTS public.dashboard_access (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  external_userid text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id, external_userid)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_access_auth_user_id
  ON public.dashboard_access (auth_user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_access_external_userid
  ON public.dashboard_access (external_userid);

CREATE INDEX IF NOT EXISTS idx_dashboard_access_active
  ON public.dashboard_access (active);

ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own dashboard access" ON public.dashboard_access;
CREATE POLICY "Users can read own dashboard access"
  ON public.dashboard_access
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE OR REPLACE FUNCTION public.can_read_dashboard()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dashboard_access da
    WHERE da.auth_user_id = (SELECT auth.uid())
      AND da.active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_dashboard_access(requested_userid text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dashboard_access da
    WHERE da.auth_user_id = (SELECT auth.uid())
      AND da.external_userid = requested_userid
      AND da.active = true
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_dashboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_dashboard_access(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.can_read_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_dashboard_access(text) TO authenticated;

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espirometria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broncoscopia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos_cirurgicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.broncoscopia;
DROP POLICY IF EXISTS "Allow public read consultas" ON public.consultas;
DROP POLICY IF EXISTS "Allow public read espirometria" ON public.espirometria;
DROP POLICY IF EXISTS "Allow public read procedimentos" ON public.procedimentos_cirurgicos;
DROP POLICY IF EXISTS "Authenticated dashboard users can read contatos" ON public.contatos;
DROP POLICY IF EXISTS "Authenticated dashboard users can read consultas" ON public.consultas;
DROP POLICY IF EXISTS "Authenticated dashboard users can read espirometria" ON public.espirometria;
DROP POLICY IF EXISTS "Authenticated dashboard users can read broncoscopia" ON public.broncoscopia;
DROP POLICY IF EXISTS "Authenticated dashboard users can read procedimentos" ON public.procedimentos_cirurgicos;

CREATE POLICY "Authenticated dashboard users can read contatos"
  ON public.contatos
  FOR SELECT
  TO authenticated
  USING ((SELECT public.can_read_dashboard()));

CREATE POLICY "Authenticated dashboard users can read consultas"
  ON public.consultas
  FOR SELECT
  TO authenticated
  USING ((SELECT public.can_read_dashboard()));

CREATE POLICY "Authenticated dashboard users can read espirometria"
  ON public.espirometria
  FOR SELECT
  TO authenticated
  USING ((SELECT public.can_read_dashboard()));

CREATE POLICY "Authenticated dashboard users can read broncoscopia"
  ON public.broncoscopia
  FOR SELECT
  TO authenticated
  USING ((SELECT public.can_read_dashboard()));

CREATE POLICY "Authenticated dashboard users can read procedimentos"
  ON public.procedimentos_cirurgicos
  FOR SELECT
  TO authenticated
  USING ((SELECT public.can_read_dashboard()));

-- Example permission inserts after creating users in Supabase Auth:
-- INSERT INTO public.dashboard_access (auth_user_id, external_userid)
-- VALUES
--   ('<auth-user-uuid>', '8d971874-ab74-406f-a1a6-d7425ee3527b'),
--   ('<auth-user-uuid>', 'cf2f9f63-cc46-4231-bb8d-9e898bfdd089');
