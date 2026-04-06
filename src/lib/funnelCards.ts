import {
  CalendarDays,
  Microscope,
  Stethoscope,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type FunnelCardTable =
  | "consultas"
  | "espirometria"
  | "broncoscopia"
  | "procedimentos_cirurgicos";

export type FunnelCardKey =
  | "consultas"
  | "espirometria"
  | "broncoscopia"
  | "cirurgia";

export type UnifiedFunnelCard = {
  id: string;
  sourceId: string;
  key: string;
  table: FunnelCardTable;
  funnel: FunnelCardKey;
  contato_id: string | null;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  modalidade_pagamento: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
  horario_agendamento: string | null;
  data_pagamento: string | null;
  valor_atribuido: string | null;
  descricao_card: string | null;
  link_da_conversa: string | null;
  id_do_card: string | null;
  tipo_consulta: string | null;
  tipo_paciente: string | null;
  quantidade_codigos: string | null;
  custo_anestesia: string | null;
  custo_comissao: string | null;
  custo_hospital: string | null;
  custo_instrumentacao: string | null;
  impostos: string | null;
};

export type FunnelCardDraft = {
  sourceId: string;
  table: FunnelCardTable;
  funnel: FunnelCardKey;
  nome_contato: string;
  contato_id: string;
  responsavel: string;
  etapa_no_crm: string;
  modalidade_pagamento: string;
  data_agendamento: string;
  horario_agendamento: string;
  data_pagamento: string;
  valor_atribuido: string;
  descricao_card: string;
  link_da_conversa: string;
  tipo_consulta: string;
  tipo_paciente: string;
  quantidade_codigos: string;
  custo_anestesia: string;
  custo_comissao: string;
  custo_hospital: string;
  custo_instrumentacao: string;
  impostos: string;
};

export const FUNNEL_CARD_META: Record<
  FunnelCardKey,
  {
    label: string;
    shortLabel: string;
    table: FunnelCardTable;
    icon: LucideIcon;
    color: string;
    soft: string;
    typeLabel: string | null;
  }
> = {
  consultas: {
    label: "Consultas",
    shortLabel: "Consulta",
    table: "consultas",
    icon: CalendarDays,
    color: "#1A56DB",
    soft: "border-[#D7E6FF] bg-[#EEF4FF] text-clinic-blue",
    typeLabel: "Tipo de consulta",
  },
  espirometria: {
    label: "Espirometria",
    shortLabel: "Espiro",
    table: "espirometria",
    icon: Wind,
    color: "#0891B2",
    soft: "border-[#C7F0F8] bg-[#ECFEFF] text-[#0F766E]",
    typeLabel: null,
  },
  broncoscopia: {
    label: "Broncoscopia",
    shortLabel: "Bronco",
    table: "broncoscopia",
    icon: Microscope,
    color: "#059669",
    soft: "border-[#CDEEDC] bg-[#ECFDF3] text-[#047857]",
    typeLabel: "Tipo de paciente",
  },
  cirurgia: {
    label: "Proc. cirurgicos",
    shortLabel: "Cirurgia",
    table: "procedimentos_cirurgicos",
    icon: Stethoscope,
    color: "#7C3AED",
    soft: "border-[#E5D6FF] bg-[#F5F0FF] text-[#6D28D9]",
    typeLabel: "Tipo de paciente",
  },
};

export function getCardTypeValue(
  card: Pick<UnifiedFunnelCard, "tipo_consulta" | "tipo_paciente">
) {
  return card.tipo_consulta ?? card.tipo_paciente ?? null;
}

export function createFunnelCardDraft(card: UnifiedFunnelCard): FunnelCardDraft {
  return {
    sourceId: card.sourceId,
    table: card.table,
    funnel: card.funnel,
    nome_contato: card.nome_contato ?? "",
    contato_id: card.contato_id ?? "",
    responsavel: card.responsavel ?? "",
    etapa_no_crm: card.etapa_no_crm ?? "",
    modalidade_pagamento: card.modalidade_pagamento ?? "",
    data_agendamento: card.data_agendamento ?? "",
    horario_agendamento: card.horario_agendamento ?? "",
    data_pagamento: card.data_pagamento ?? "",
    valor_atribuido: card.valor_atribuido ?? "",
    descricao_card: card.descricao_card ?? "",
    link_da_conversa: card.link_da_conversa ?? "",
    tipo_consulta: card.tipo_consulta ?? "",
    tipo_paciente: card.tipo_paciente ?? "",
    quantidade_codigos: card.quantidade_codigos ?? "",
    custo_anestesia: card.custo_anestesia ?? "",
    custo_comissao: card.custo_comissao ?? "",
    custo_hospital: card.custo_hospital ?? "",
    custo_instrumentacao: card.custo_instrumentacao ?? "",
    impostos: card.impostos ?? "",
  };
}

export function isBroncoscopiaCard(
  card: Pick<UnifiedFunnelCard | FunnelCardDraft, "funnel">
) {
  return card.funnel === "broncoscopia";
}

export function isProcedimentoCard(
  card: Pick<UnifiedFunnelCard | FunnelCardDraft, "funnel">
) {
  return card.funnel === "cirurgia";
}
