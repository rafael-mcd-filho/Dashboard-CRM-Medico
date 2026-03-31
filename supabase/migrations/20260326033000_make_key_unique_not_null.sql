DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.broncoscopia
    WHERE key IS NULL OR btrim(key) = ''
  ) THEN
    RAISE EXCEPTION 'broncoscopia.key contains null or empty values';
  END IF;

  IF EXISTS (
    SELECT key
    FROM public.broncoscopia
    GROUP BY key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'broncoscopia.key contains duplicate values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.consultas
    WHERE key IS NULL OR btrim(key) = ''
  ) THEN
    RAISE EXCEPTION 'consultas.key contains null or empty values';
  END IF;

  IF EXISTS (
    SELECT key
    FROM public.consultas
    GROUP BY key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'consultas.key contains duplicate values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.espirometria
    WHERE key IS NULL OR btrim(key) = ''
  ) THEN
    RAISE EXCEPTION 'espirometria.key contains null or empty values';
  END IF;

  IF EXISTS (
    SELECT key
    FROM public.espirometria
    GROUP BY key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'espirometria.key contains duplicate values';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.procedimentos_cirurgicos
    WHERE key IS NULL OR btrim(key) = ''
  ) THEN
    RAISE EXCEPTION 'procedimentos_cirurgicos.key contains null or empty values';
  END IF;

  IF EXISTS (
    SELECT key
    FROM public.procedimentos_cirurgicos
    GROUP BY key
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'procedimentos_cirurgicos.key contains duplicate values';
  END IF;
END $$;

ALTER TABLE public.broncoscopia
ALTER COLUMN key SET NOT NULL;

ALTER TABLE public.broncoscopia
ADD CONSTRAINT broncoscopia_key_unique UNIQUE (key);

ALTER TABLE public.consultas
ALTER COLUMN key SET NOT NULL;

ALTER TABLE public.consultas
ADD CONSTRAINT consultas_key_unique UNIQUE (key);

ALTER TABLE public.espirometria
ALTER COLUMN key SET NOT NULL;

ALTER TABLE public.espirometria
ADD CONSTRAINT espirometria_key_unique UNIQUE (key);

ALTER TABLE public.procedimentos_cirurgicos
ALTER COLUMN key SET NOT NULL;

ALTER TABLE public.procedimentos_cirurgicos
ADD CONSTRAINT procedimentos_cirurgicos_key_unique UNIQUE (key);
