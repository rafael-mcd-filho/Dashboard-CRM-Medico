CREATE TABLE public.procedimentos_cirurgicos (
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
  tipo_paciente text,
  modalidade_pagamento text,
  data_agendamento text,
  horario_agendamento text,
  origem text,
  custo_anestesia text,
  custo_comissao text,
  custo_hospital text,
  custo_instrumentacao text,
  impostos text,
  data_pagamento text,
  vinculo text,
  valor_liquido numeric,
  valor_atribuido text,
  data_atualizacao_conversa text,
  link_da_conversa text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.procedimentos_cirurgicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read procedimentos" ON public.procedimentos_cirurgicos FOR SELECT USING (true);
CREATE POLICY "Allow public insert procedimentos" ON public.procedimentos_cirurgicos FOR INSERT TO anon, authenticated WITH CHECK (true);