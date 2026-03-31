DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultas'
      AND column_name = 'tag_names'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consultas'
      AND column_name = 'tag_name_contato'
  ) THEN
    EXECUTE 'ALTER TABLE public.consultas RENAME COLUMN tag_names TO tag_name_contato';
  END IF;
END $$;

ALTER TABLE public.consultas
  ADD COLUMN IF NOT EXISTS tag_id_card text,
  ADD COLUMN IF NOT EXISTS descricao_card text,
  ADD COLUMN IF NOT EXISTS tag_name_contato text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'espirometria'
      AND column_name = 'tag_names'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'espirometria'
      AND column_name = 'tag_name_contato'
  ) THEN
    EXECUTE 'ALTER TABLE public.espirometria RENAME COLUMN tag_names TO tag_name_contato';
  END IF;
END $$;

ALTER TABLE public.espirometria
  ADD COLUMN IF NOT EXISTS tag_id_card text,
  ADD COLUMN IF NOT EXISTS descricao_card text,
  ADD COLUMN IF NOT EXISTS tag_name_contato text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'broncoscopia'
      AND column_name = 'tag_names'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'broncoscopia'
      AND column_name = 'tag_name_contato'
  ) THEN
    EXECUTE 'ALTER TABLE public.broncoscopia RENAME COLUMN tag_names TO tag_name_contato';
  END IF;
END $$;

ALTER TABLE public.broncoscopia
  ADD COLUMN IF NOT EXISTS tag_id_card text,
  ADD COLUMN IF NOT EXISTS descricao_card text,
  ADD COLUMN IF NOT EXISTS tag_name_contato text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'procedimentos_cirurgicos'
      AND column_name = 'tag_names'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'procedimentos_cirurgicos'
      AND column_name = 'tag_name_contato'
  ) THEN
    EXECUTE 'ALTER TABLE public.procedimentos_cirurgicos RENAME COLUMN tag_names TO tag_name_contato';
  END IF;
END $$;

ALTER TABLE public.procedimentos_cirurgicos
  ADD COLUMN IF NOT EXISTS tag_id_card text,
  ADD COLUMN IF NOT EXISTS descricao_card text,
  ADD COLUMN IF NOT EXISTS tag_name_contato text;
