-- Allow anonymous dashboard access when the request carries an allowed userid
-- through the x-dashboard-userid header. This keeps write operations behind
-- authenticated access and only opens read access for explicit public links.

CREATE TABLE IF NOT EXISTS public.dashboard_public_access (
  external_userid text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_public_access ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_read_dashboard_anonymously()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dashboard_public_access dpa
    WHERE dpa.external_userid =
      NULLIF(current_setting('request.headers', true)::json ->> 'x-dashboard-userid', '')
      AND dpa.active = true
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_dashboard_anonymously() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_dashboard_anonymously() TO anon, authenticated;

INSERT INTO public.dashboard_public_access (external_userid, active)
VALUES
  ('8d971874-ab74-406f-a1a6-d7425ee3527b', true),
  ('cf2f9f63-cc46-4231-bb8d-9e898bfdd089', true),
  ('eafdc413-36ff-4c11-bf85-aa76c25fe068', true)
ON CONFLICT (external_userid) DO UPDATE
SET active = EXCLUDED.active;

DROP POLICY IF EXISTS "Anonymous dashboard users can read contatos by userid" ON public.contatos;
DROP POLICY IF EXISTS "Anonymous dashboard users can read consultas by userid" ON public.consultas;
DROP POLICY IF EXISTS "Anonymous dashboard users can read espirometria by userid" ON public.espirometria;
DROP POLICY IF EXISTS "Anonymous dashboard users can read broncoscopia by userid" ON public.broncoscopia;
DROP POLICY IF EXISTS "Anonymous dashboard users can read procedimentos by userid" ON public.procedimentos_cirurgicos;

CREATE POLICY "Anonymous dashboard users can read contatos by userid"
  ON public.contatos
  FOR SELECT
  TO anon
  USING ((SELECT public.can_read_dashboard_anonymously()));

CREATE POLICY "Anonymous dashboard users can read consultas by userid"
  ON public.consultas
  FOR SELECT
  TO anon
  USING ((SELECT public.can_read_dashboard_anonymously()));

CREATE POLICY "Anonymous dashboard users can read espirometria by userid"
  ON public.espirometria
  FOR SELECT
  TO anon
  USING ((SELECT public.can_read_dashboard_anonymously()));

CREATE POLICY "Anonymous dashboard users can read broncoscopia by userid"
  ON public.broncoscopia
  FOR SELECT
  TO anon
  USING ((SELECT public.can_read_dashboard_anonymously()));

CREATE POLICY "Anonymous dashboard users can read procedimentos by userid"
  ON public.procedimentos_cirurgicos
  FOR SELECT
  TO anon
  USING ((SELECT public.can_read_dashboard_anonymously()));
