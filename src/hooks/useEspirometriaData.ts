import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters } from "@/contexts/FiltersContext";
import { matchesGlobalCardFilters } from "@/lib/cardFilters";
import {
  buildMetricComparison,
  buildMetricComparisons,
  getPreviousPeriodRange,
  sumByNumberKey,
} from "@/lib/comparison";
import {
  getContatoOrigemAgrupada,
  matchesSomenteAnunciosFilter,
} from "@/lib/contactOrigins";
import {
  getRowDateByMode,
  isRowInDateModeRange,
  type DashboardDateMode,
} from "@/lib/dateMode";
import { buildEvolucao } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { calcDiffDias, parseMonetary } from "@/lib/parse";

type EspirometriaRow = {
  id: string;
  contato_id: string | null;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  modalidade_pagamento: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
  data_pagamento: string | null;
  valor_atribuido: string | null;
};

type ContatoOrigemRow = {
  contato_id: string;
  tags: string | null;
  origem_contato: string | null;
};

const PAGE_SIZE = 1000;

const ETAPAS_EXCLUIDAS_AGENDAMENTO = new Set([
  "captacao",
  "negociacao",
  "perdido",
]);

const ETAPAS_REALIZADAS = new Set(["realizado", "finalizado/concluido"]);
const ETAPA_NO_SHOW = "nao compareceu";

const FUNIL_ORDER = [
  "Captação",
  "Negociação",
  "Perdido",
  "Agendado",
  "Em Confirmação",
  "Confirmado",
  "Não Confirmado",
  "Lembrete",
  "Realizado",
  "Não compareceu",
  "Finalizado/Concluído",
];

function normalizeStage(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getDimensionLabel(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : "Não definido";
}

function getUniqueContatoIds(rows: Array<{ contato_id: string | null }>) {
  return new Set(
    rows.map((row) => row.contato_id).filter((id): id is string => Boolean(id))
  );
}

async function fetchAllContatoOrigens() {
  const rows: ContatoOrigemRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contatos")
      .select("contato_id, tags, origem_contato")
      .order("contato_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data ?? []) as ContatoOrigemRow[];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

function getIntersectionSize(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const id of a) if (b.has(id)) count++;
  return count;
}

function buildEspirometriaMetrics(
  rows: EspirometriaRow[],
  consultaContatoIds: Set<string>,
  contatoOrigemMap: Map<string, ContatoOrigemRow>,
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode
) {
  const agendadasRows = rows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );

  const realizadasRows = agendadasRows.filter((row) =>
    ETAPAS_REALIZADAS.has(normalizeStage(row.etapa_no_crm))
  );

  const noShowRows = agendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW
  );

  const agendadas = agendadasRows.length;
  const realizadas = realizadasRows.length;
  const no_show = noShowRows.length;
  const no_show_pct = agendadas > 0 ? no_show / agendadas : 0;

  const espiroContatoIds = getUniqueContatoIds(agendadasRows);
  const base_contatos = espiroContatoIds.size;
  const conversao_consulta = getIntersectionSize(espiroContatoIds, consultaContatoIds);
  const conversao_consulta_pct =
    base_contatos > 0 ? conversao_consulta / base_contatos : 0;

  const faturamento = realizadasRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const contatosRealizados = getUniqueContatoIds(realizadasRows);
  const ticket_medio =
    contatosRealizados.size > 0 ? faturamento / contatosRealizados.size : 0;

  const pagos = agendadasRows.filter((row) => Boolean(row.data_pagamento));
  const pago_qtd = pagos.length;
  const pago_no_dia = pagos.filter(
    (row) =>
      row.data_pagamento &&
      row.data_agendamento &&
      row.data_pagamento.substring(0, 10) === row.data_agendamento.substring(0, 10)
  ).length;
  const pago_no_dia_pct = pago_qtd > 0 ? pago_no_dia / pago_qtd : 0;

  const diffs = pagos
    .map((row) => calcDiffDias(row.data_pagamento, row.data_agendamento))
    .filter((diff): diff is number => diff !== null && diff >= 0);
  const prazo_medio =
    diffs.length > 0 ? diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length : 0;

  const etapaMap: Record<string, number> = {};
  rows.forEach((row) => {
    const stage = getDimensionLabel(row.etapa_no_crm);
    etapaMap[stage] = (etapaMap[stage] ?? 0) + 1;
  });

  const orderedStages = FUNIL_ORDER.filter((stage) => Boolean(etapaMap[stage])).map(
    (stage) => ({
      name: stage,
      value: etapaMap[stage],
    })
  );

  const extraStages = Object.entries(etapaMap)
    .filter(([stage]) => !FUNIL_ORDER.includes(stage))
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const funil = [...orderedStages, ...extraStages];

  const porModalidadeMap: Record<string, { fat: number; qtd: number }> = {};
  realizadasRows.forEach((row) => {
    const modalidade = getDimensionLabel(row.modalidade_pagamento);
    if (!porModalidadeMap[modalidade]) {
      porModalidadeMap[modalidade] = { fat: 0, qtd: 0 };
    }
    porModalidadeMap[modalidade].fat += parseMonetary(row.valor_atribuido);
    porModalidadeMap[modalidade].qtd += 1;
  });

  const por_modalidade = Object.entries(porModalidadeMap)
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.fat - a.fat);

  const porOrigemMap: Record<string, number> = {};
  agendadasRows.forEach((row) => {
    const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
    const origem = contato ? getContatoOrigemAgrupada(contato) : "Não definido";
    porOrigemMap[origem] = (porOrigemMap[origem] ?? 0) + 1;
  });

  const por_origem = Object.entries(porOrigemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const evolucao = buildEvolucao(realizadasRows, dataInicio, dataFim, tipoData);

  const taxa_conversao = agendadas > 0 ? realizadas / agendadas : 0;

  const fatOrigemMap: Record<string, number> = {};
  realizadasRows.forEach((row) => {
    const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
    const origem = contato ? getContatoOrigemAgrupada(contato) : "Não definido";
    fatOrigemMap[origem] = (fatOrigemMap[origem] ?? 0) + parseMonetary(row.valor_atribuido);
  });
  const faturamento_por_origem = Object.entries(fatOrigemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const tabela = [...agendadasRows]
    .sort((a, b) => (b.data_agendamento ?? "").localeCompare(a.data_agendamento ?? ""))
    .slice(0, 60)
    .map((row) => {
      const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;

      return {
        id: row.id,
        nome: row.nome_contato ?? "—",
        data_agendamento: row.data_agendamento ?? "—",
        modalidade: getDimensionLabel(row.modalidade_pagamento),
        origem: contato ? getContatoOrigemAgrupada(contato) : "Não definido",
        etapa: getDimensionLabel(row.etapa_no_crm),
        valor: parseMonetary(row.valor_atribuido),
        pago: Boolean(row.data_pagamento),
        convertida: row.contato_id ? consultaContatoIds.has(row.contato_id) : false,
      };
    });

  const funil_registros: FunnelStageDrilldownRecord[] = [...rows]
    .sort((a, b) => (b.data_agendamento ?? "").localeCompare(a.data_agendamento ?? ""))
    .map((row) => {
      const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;

      return {
        id: row.id,
        nome: row.nome_contato ?? "—",
        etapa: getDimensionLabel(row.etapa_no_crm),
        dataAgendamento: row.data_agendamento ?? "—",
        responsavel: getDimensionLabel(row.responsavel),
        valor: parseMonetary(row.valor_atribuido),
        dataReferencia: getRowDateByMode(row, tipoData),
        detalhes: [
          getDimensionLabel(row.modalidade_pagamento),
          contato ? getContatoOrigemAgrupada(contato) : "Não definido",
        ],
        meta: {
          modalidade: getDimensionLabel(row.modalidade_pagamento),
          origem: contato ? getContatoOrigemAgrupada(contato) : "Não definido",
          pago: Boolean(row.data_pagamento),
          agendadaBase: !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(
            normalizeStage(row.etapa_no_crm)
          ),
          realizada: ETAPAS_REALIZADAS.has(normalizeStage(row.etapa_no_crm)),
        },
      };
    });

  return {
    agendadas,
    realizadas,
    no_show,
    no_show_pct,
    conversao_consulta,
    conversao_consulta_pct,
    base_contatos,
    faturamento,
    ticket_medio,
    pago_qtd,
    pago_no_dia,
    pago_no_dia_pct,
    prazo_medio,
    funil,
    por_modalidade,
    por_origem,
    evolucao,
    taxa_conversao,
    faturamento_por_origem,
    tabela,
    funil_registros,
  };
}

export function useEspirometriaData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, tipoData, responsavel, somenteAnuncios } = filters;
  const previousRange = useMemo(
    () => getPreviousPeriodRange(dataInicio, dataFim),
    [dataFim, dataInicio]
  );

  const { data: allRows = [], isLoading: loadingMain } = useQuery({
    queryKey: ["espirometria_all_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("espirometria")
        .select(
          "id, contato_id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, " +
            "data_criacao_card, data_agendamento, data_pagamento, valor_atribuido"
        );

      if (error) throw error;
      return (data ?? []) as EspirometriaRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allContatoOrigens = [], isLoading: loadingContatos } = useQuery({
    queryKey: ["contatos_origem_lookup_all_v1"],
    queryFn: fetchAllContatoOrigens,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allConsultaCards = [], isLoading: loadingConsultas } = useQuery({
    queryKey: ["consultas_cards_for_conversion"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("contato_id, responsavel, data_criacao_card, data_agendamento, etapa_no_crm");

      if (error) throw error;
      return (data ?? []) as {
        contato_id: string | null;
        responsavel: string | null;
        data_criacao_card: string | null;
        data_agendamento: string | null;
        etapa_no_crm: string | null;
      }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingMain || loadingContatos || loadingConsultas;

  const contatoOrigemMap = useMemo(
    () => new Map(allContatoOrigens.map((contato) => [contato.contato_id, contato])),
    [allContatoOrigens]
  );

  const metrics = useMemo(() => {
    const filterRowsByPeriod = (start: Date, end: Date) =>
      allRows.filter(
        (row) =>
          isRowInDateModeRange(row, start, end, tipoData) &&
          matchesGlobalCardFilters(row, { responsavel }) &&
          matchesSomenteAnunciosFilter(
            row.contato_id,
            contatoOrigemMap,
            somenteAnuncios
          )
      );

    const filterConsultasByPeriod = (start: Date, end: Date) =>
      allConsultaCards.filter(
        (row) =>
          isRowInDateModeRange(row, start, end, tipoData) &&
          matchesGlobalCardFilters(row, { responsavel }) &&
          matchesSomenteAnunciosFilter(
            row.contato_id,
            contatoOrigemMap,
            somenteAnuncios
          ) &&
          !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
      );

    const currentConsultaContatoIds = getUniqueContatoIds(
      filterConsultasByPeriod(dataInicio, dataFim)
    );
    const previousConsultaContatoIds = getUniqueContatoIds(
      filterConsultasByPeriod(previousRange.dataInicio, previousRange.dataFim)
    );

    const current = buildEspirometriaMetrics(
      filterRowsByPeriod(dataInicio, dataFim),
      currentConsultaContatoIds,
      contatoOrigemMap,
      dataInicio,
      dataFim,
      tipoData
    );

    const previous = buildEspirometriaMetrics(
      filterRowsByPeriod(previousRange.dataInicio, previousRange.dataFim),
      previousConsultaContatoIds,
      contatoOrigemMap,
      previousRange.dataInicio,
      previousRange.dataFim,
      tipoData
    );

    const comparisons = {
      kpis: buildMetricComparisons(
        {
          agendadas: current.agendadas,
          realizadas: current.realizadas,
          no_show: current.no_show,
          no_show_pct: current.no_show_pct,
          conversao_consulta: current.conversao_consulta,
          faturamento: current.faturamento,
          ticket_medio: current.ticket_medio,
          pago_qtd: current.pago_qtd,
          pago_no_dia_pct: current.pago_no_dia_pct,
          prazo_medio: current.prazo_medio,
          taxa_conversao: current.taxa_conversao,
        },
        {
          agendadas: previous.agendadas,
          realizadas: previous.realizadas,
          no_show: previous.no_show,
          no_show_pct: previous.no_show_pct,
          conversao_consulta: previous.conversao_consulta,
          faturamento: previous.faturamento,
          ticket_medio: previous.ticket_medio,
          pago_qtd: previous.pago_qtd,
          pago_no_dia_pct: previous.pago_no_dia_pct,
          prazo_medio: previous.prazo_medio,
          taxa_conversao: previous.taxa_conversao,
        }
      ),
      charts: {
        funil: buildMetricComparison(
          sumByNumberKey(current.funil, "value"),
          sumByNumberKey(previous.funil, "value")
        ),
        por_modalidade: buildMetricComparison(
          sumByNumberKey(current.por_modalidade, "fat"),
          sumByNumberKey(previous.por_modalidade, "fat")
        ),
        por_origem: buildMetricComparison(
          sumByNumberKey(current.por_origem, "value"),
          sumByNumberKey(previous.por_origem, "value")
        ),
        evolucao: buildMetricComparison(
          sumByNumberKey(current.evolucao, "value"),
          sumByNumberKey(previous.evolucao, "value")
        ),
        faturamento_por_origem: buildMetricComparison(
          sumByNumberKey(current.faturamento_por_origem, "value"),
          sumByNumberKey(previous.faturamento_por_origem, "value")
        ),
      },
    };

    return {
      ...current,
      comparisons,
    };
  }, [
    allConsultaCards,
    allRows,
    contatoOrigemMap,
    dataFim,
    dataInicio,
    tipoData,
    previousRange.dataFim,
    previousRange.dataInicio,
    responsavel,
    somenteAnuncios,
  ]);

  return { isLoading, ...metrics };
}
