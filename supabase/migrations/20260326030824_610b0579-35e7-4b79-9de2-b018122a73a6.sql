CREATE TABLE public.broncoscopia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text,
  id_do_card text,
  contato_id text,
  nome_contato text,
  tag_names text,
  funil_painel_crm text,
  etapa_no_crm text,
  data_criacao_card text,
  data_atualizacao_card text,
  tipo_paciente text,
  modalidade_pagamento text,
  data_agendamento text,
  horario_agendamento text,
  origem text,
  data_pagamento text,
  quantidade_codigos text,
  custo text,
  vinculo text,
  valor_atribuido text,
  data_atualizacao_conversa text,
  link_da_conversa text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broncoscopia ENABLE ROW LEVEL SECURITY;