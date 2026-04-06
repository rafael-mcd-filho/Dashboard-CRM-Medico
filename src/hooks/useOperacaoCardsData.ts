import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedFunnelCard } from "@/lib/funnelCards";
import { parseBRDate } from "@/lib/parse";

const PAGE_SIZE = 1000;

type BaseOperacaoRow = {
  id: string;
  key: string;
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
};

type ConsultaOperacaoRow = BaseOperacaoRow & {
  tipo_consulta: string | null;
};

type EspirometriaOperacaoRow = BaseOperacaoRow;

type BroncoscopiaOperacaoRow = BaseOperacaoRow & {
  tipo_paciente: string | null;
  quantidade_codigos: string | null;
};

type ProcedimentoOperacaoRow = BaseOperacaoRow & {
  tipo_paciente: string | null;
  custo_anestesia: string | null;
  custo_comissao: string | null;
  custo_hospital: string | null;
  custo_instrumentacao: string | null;
  impostos: string | null;
};

async function fetchAllRows<T>(table: string, select: string) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data ?? []) as T[];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

function getSortTime(card: UnifiedFunnelCard) {
  return (
    parseBRDate(card.data_agendamento)?.getTime() ??
    parseBRDate(card.data_criacao_card)?.getTime() ??
    0
  );
}

export function useOperacaoCardsData() {
  return useQuery({
    queryKey: ["operacao_cards_v1"],
    queryFn: async () => {
      const [consultas, espirometria, broncoscopia, procedimentos] =
        await Promise.all([
          fetchAllRows<ConsultaOperacaoRow>(
            "consultas",
            "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_criacao_card, data_agendamento, horario_agendamento, data_pagamento, valor_atribuido, descricao_card, link_da_conversa, id_do_card, tipo_consulta"
          ),
          fetchAllRows<EspirometriaOperacaoRow>(
            "espirometria",
            "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_criacao_card, data_agendamento, horario_agendamento, data_pagamento, valor_atribuido, descricao_card, link_da_conversa, id_do_card"
          ),
          fetchAllRows<BroncoscopiaOperacaoRow>(
            "broncoscopia",
            "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_criacao_card, data_agendamento, horario_agendamento, data_pagamento, valor_atribuido, descricao_card, link_da_conversa, id_do_card, tipo_paciente, quantidade_codigos"
          ),
          fetchAllRows<ProcedimentoOperacaoRow>(
            "procedimentos_cirurgicos",
            "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_criacao_card, data_agendamento, horario_agendamento, data_pagamento, valor_atribuido, descricao_card, link_da_conversa, id_do_card, tipo_paciente, custo_anestesia, custo_comissao, custo_hospital, custo_instrumentacao, impostos"
          ),
        ]);

      const cards: UnifiedFunnelCard[] = [
        ...consultas.map((row) => ({
          ...row,
          sourceId: row.id,
          table: "consultas" as const,
          funnel: "consultas" as const,
          tipo_paciente: null,
          quantidade_codigos: null,
          custo_anestesia: null,
          custo_comissao: null,
          custo_hospital: null,
          custo_instrumentacao: null,
          impostos: null,
        })),
        ...espirometria.map((row) => ({
          ...row,
          sourceId: row.id,
          table: "espirometria" as const,
          funnel: "espirometria" as const,
          tipo_consulta: null,
          tipo_paciente: null,
          quantidade_codigos: null,
          custo_anestesia: null,
          custo_comissao: null,
          custo_hospital: null,
          custo_instrumentacao: null,
          impostos: null,
        })),
        ...broncoscopia.map((row) => ({
          ...row,
          sourceId: row.id,
          table: "broncoscopia" as const,
          funnel: "broncoscopia" as const,
          tipo_consulta: null,
          custo_anestesia: null,
          custo_comissao: null,
          custo_hospital: null,
          custo_instrumentacao: null,
          impostos: null,
        })),
        ...procedimentos.map((row) => ({
          ...row,
          sourceId: row.id,
          table: "procedimentos_cirurgicos" as const,
          funnel: "cirurgia" as const,
          tipo_consulta: null,
          quantidade_codigos: null,
        })),
      ].sort((a, b) => {
        const diff = getSortTime(b) - getSortTime(a);
        if (diff !== 0) return diff;

        return (a.nome_contato ?? "").localeCompare(
          b.nome_contato ?? "",
          "pt-BR"
        );
      });

      return cards;
    },
    staleTime: 2 * 60 * 1000,
  });
}
