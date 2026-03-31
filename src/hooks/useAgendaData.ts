import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getContatoOrigemAgrupada,
  isContatoOrigemAnuncio,
} from "@/lib/contactOrigins";
import {
  getAgendaDisplayLabel,
  getAgendaTurn,
  isAgendaStageVisible,
  normalizeAgendaTime,
  parseAgendaDate,
  sortAgendaEvents,
  type AgendaEvent,
  type AgendaFunnelKey,
} from "@/lib/agenda";
import { parseMonetary } from "@/lib/parse";

type BaseAgendaRow = {
  id: string;
  key: string;
  contato_id: string | null;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  modalidade_pagamento: string | null;
  data_agendamento: string | null;
  horario_agendamento: string | null;
  valor_atribuido: string | null;
  link_da_conversa: string | null;
  id_do_card: string | null;
  descricao_card: string | null;
};

type ConsultaAgendaRow = BaseAgendaRow & {
  tipo_consulta: string | null;
};

type EspirometriaAgendaRow = BaseAgendaRow;

type BroncoscopiaAgendaRow = BaseAgendaRow & {
  tipo_paciente: string | null;
};

type ProcedimentoAgendaRow = BaseAgendaRow & {
  tipo_paciente: string | null;
};

type ContatoOrigemRow = {
  contato_id: string;
  tags: string | null;
  origem_contato: string | null;
};

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  table:
    | "consultas"
    | "espirometria"
    | "broncoscopia"
    | "procedimentos_cirurgicos"
    | "contatos",
  select: string
) {
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

function mapAgendaEvent(
  row:
    | ConsultaAgendaRow
    | EspirometriaAgendaRow
    | BroncoscopiaAgendaRow
    | ProcedimentoAgendaRow,
  funnel: AgendaFunnelKey,
  contatoMap: Map<string, ContatoOrigemRow>
): AgendaEvent | null {
  const dateValue = parseAgendaDate(row.data_agendamento);

  if (!dateValue || !row.data_agendamento || !isAgendaStageVisible(row.etapa_no_crm)) {
    return null;
  }

  const timeLabel = normalizeAgendaTime(row.horario_agendamento);
  const timeMinutes =
    timeLabel === null
      ? null
      : Number(timeLabel.slice(0, 2)) * 60 + Number(timeLabel.slice(3, 5));

  const contato = row.contato_id ? contatoMap.get(row.contato_id) : undefined;
  const origin = contato ? getContatoOrigemAgrupada(contato) : "Não definido";
  const isAds = Boolean(contato && isContatoOrigemAnuncio(contato));

  let typeLabel: string | null = null;
  if ("tipo_consulta" in row) {
    typeLabel = getAgendaDisplayLabel(row.tipo_consulta);
  } else if ("tipo_paciente" in row) {
    typeLabel = getAgendaDisplayLabel(row.tipo_paciente);
  }

  return {
    id: `${funnel}-${row.id}`,
    funnel,
    patientName: (row.nome_contato ?? "").trim() || "Paciente sem nome",
    dateLabel: row.data_agendamento,
    dateValue,
    timeLabel,
    timeMinutes,
    turn: getAgendaTurn(timeLabel),
    responsible: getAgendaDisplayLabel(row.responsavel),
    stage: getAgendaDisplayLabel(row.etapa_no_crm),
    modality: getAgendaDisplayLabel(row.modalidade_pagamento),
    typeLabel,
    amount: parseMonetary(row.valor_atribuido),
    origin,
    isAds,
    contactId: row.contato_id,
    conversationLink: row.link_da_conversa,
    cardId: row.id_do_card,
    crmKey: row.key,
    cardDescription: row.descricao_card?.trim() || null,
  };
}

export function useAgendaData() {
  const { data, isLoading } = useQuery({
    queryKey: ["agenda_events_v1"],
    queryFn: async () => {
      const [
        consultas,
        espirometria,
        broncoscopia,
        procedimentos,
        contatos,
      ] = await Promise.all([
        fetchAllRows<ConsultaAgendaRow>(
          "consultas",
          "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_agendamento, horario_agendamento, valor_atribuido, link_da_conversa, id_do_card, descricao_card, tipo_consulta"
        ),
        fetchAllRows<EspirometriaAgendaRow>(
          "espirometria",
          "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_agendamento, horario_agendamento, valor_atribuido, link_da_conversa, id_do_card, descricao_card"
        ),
        fetchAllRows<BroncoscopiaAgendaRow>(
          "broncoscopia",
          "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_agendamento, horario_agendamento, valor_atribuido, link_da_conversa, id_do_card, descricao_card, tipo_paciente"
        ),
        fetchAllRows<ProcedimentoAgendaRow>(
          "procedimentos_cirurgicos",
          "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, data_agendamento, horario_agendamento, valor_atribuido, link_da_conversa, id_do_card, descricao_card, tipo_paciente"
        ),
        fetchAllRows<ContatoOrigemRow>(
          "contatos",
          "id, contato_id, tags, origem_contato"
        ),
      ]);

      const contatoMap = new Map(
        contatos.map((contato) => [contato.contato_id, contato])
      );

      const events = [
        ...consultas
          .map((row) => mapAgendaEvent(row, "consultas", contatoMap))
          .filter((row): row is AgendaEvent => Boolean(row)),
        ...espirometria
          .map((row) => mapAgendaEvent(row, "espirometria", contatoMap))
          .filter((row): row is AgendaEvent => Boolean(row)),
        ...broncoscopia
          .map((row) => mapAgendaEvent(row, "broncoscopia", contatoMap))
          .filter((row): row is AgendaEvent => Boolean(row)),
        ...procedimentos
          .map((row) => mapAgendaEvent(row, "cirurgia", contatoMap))
          .filter((row): row is AgendaEvent => Boolean(row)),
      ].sort(sortAgendaEvents);

      return events;
    },
    staleTime: 5 * 60 * 1000,
  });

  const responsavelOptions = useMemo(() => {
    const options = Array.from(
      new Set((data ?? []).map((event) => event.responsible))
    );

    return options.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [data]);

  return {
    events: data ?? [],
    responsavelOptions,
    isLoading,
  };
}
