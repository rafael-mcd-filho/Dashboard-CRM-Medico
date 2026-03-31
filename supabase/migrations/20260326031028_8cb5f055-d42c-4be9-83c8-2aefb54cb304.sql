-- Drop the old minimal consultas table and recreate with all fields
DROP TABLE IF EXISTS public.consultas;

CREATE TABLE public.consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text,
  id_do_card text,
  contato_id text,
  nome_contato text,
  tag_names text,
  funil_painel_crm text,
  etapa_no_crm text,
  responsavel text,
  data_criacao_card text,
  data_atualizacao_card text,
  tipo_consulta text,
  modalidade_pagamento text,
  data_agendamento text,
  horario_agendamento text,
  origem text,
  data_pagamento text,
  valor_atribuido text,
  data_atualizacao_conversa text,
  link_da_conversa text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read consultas" ON public.consultas FOR SELECT USING (true);
CREATE POLICY "Allow public insert consultas" ON public.consultas FOR INSERT TO anon, authenticated WITH CHECK (true);