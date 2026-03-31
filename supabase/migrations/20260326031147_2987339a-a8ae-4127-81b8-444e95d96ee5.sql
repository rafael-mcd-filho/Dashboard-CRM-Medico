CREATE TABLE public.espirometria (
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
  modalidade_pagamento text,
  data_agendamento text,
  horario_agendamento text,
  origem text,
  data_pagamento text,
  vinculo text,
  valor_atribuido text,
  data_atualizacao_conversa text,
  link_da_conversa text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.espirometria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read espirometria" ON public.espirometria FOR SELECT USING (true);
CREATE POLICY "Allow public insert espirometria" ON public.espirometria FOR INSERT TO anon, authenticated WITH CHECK (true);