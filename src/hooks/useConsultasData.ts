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

type ConsultaRow = {
  id: string;
  key: string;
  contato_id: string | null;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  tipo_consulta: string | null;
  modalidade_pagamento: string | null;
  origem: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
  data_pagamento: string | null;
  valor_atribuido: string | null;
};

type FunnelCardRow = {
  contato_id: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
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

const ETAPAS_REALIZADAS = new Set([
  "realizado",
  "retorno agendado",
  "compareceu retorno",
  "nao compareceu retorno",
  "finalizado/concluido",
]);

const ETAPA_NO_SHOW_CONSULTA = "nao compareceu";
const ETAPA_NO_SHOW_RETORNO = "nao compareceu retorno";
const ETAPAS_INVALIDAS_CONVERSAO = new Set([
  "captacao",
  "negociacao",
  "perdido",
]);

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
  "Retorno Agendado",
  "Compareceu Retorno",
  "Não Compareceu Retorno",
  "Finalizado/Concluído",
];

const FUNIL_COLORS: Record<string, string> = {
  "Captação": "#9BAAB8",
  "Negociação": "#60A5FA",
  Agendado: "#1A56DB",
  "Em Confirmação": "#3B82F6",
  Confirmado: "#0891B2",
  "Não Confirmado": "#F59E0B",
  Lembrete: "#8B5CF6",
  Realizado: "#0E9F6E",
  "Retorno Agendado": "#0891B2",
  "Compareceu Retorno": "#0E9F6E",
  "Não compareceu": "#DC2626",
  "Não Compareceu Retorno": "#EF4444",
  "Finalizado/Concluído": "#065F46",
  Perdido: "#6B7280",
};

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

function filterFunnelRows(
  rows: FunnelCardRow[],
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode,
  responsavel: string,
  somenteAnuncios: boolean,
  contatoOrigemMap: Map<string, ContatoOrigemRow>
) {
  return rows.filter(
    (row) =>
      isRowInDateModeRange(row, dataInicio, dataFim, tipoData) &&
      matchesGlobalCardFilters(row, { responsavel }) &&
      matchesSomenteAnunciosFilter(
        row.contato_id,
        contatoOrigemMap,
        somenteAnuncios
      ) &&
      !ETAPAS_INVALIDAS_CONVERSAO.has(normalizeStage(row.etapa_no_crm))
  );
}

function getUniqueContatoIds(rows: Array<{ contato_id: string | null }>) {
  return new Set(
    rows.map((row) => row.contato_id).filter((id): id is string => Boolean(id))
  );
}

function getIntersectionSize(baseIds: Set<string>, compareIds: Set<string>) {
  let count = 0;

  baseIds.forEach((id) => {
    if (compareIds.has(id)) {
      count += 1;
    }
  });

  return count;
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

function buildConsultasMetrics(
  rows: ConsultaRow[],
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode,
  responsavel: string,
  somenteAnuncios: boolean,
  contatoOrigemMap: Map<string, ContatoOrigemRow>,
  allEspiroCards: FunnelCardRow[],
  allBroncoCards: FunnelCardRow[],
  allCirurgiaCards: FunnelCardRow[]
) {
  const agendadasRows = rows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );

  const realizadasRows = agendadasRows.filter((row) =>
    ETAPAS_REALIZADAS.has(normalizeStage(row.etapa_no_crm))
  );

  const noShowConsultaRows = agendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );

  const noShowRetornoRows = agendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_RETORNO
  );

  const agendadas = agendadasRows.length;
  const realizadas = realizadasRows.length;
  const no_show_consulta = noShowConsultaRows.length;
  const no_show_retorno = noShowRetornoRows.length;
  const no_show_consulta_pct = agendadas > 0 ? no_show_consulta / agendadas : 0;
  const no_show_retorno_pct = realizadas > 0 ? no_show_retorno / realizadas : 0;

  const faturamento = realizadasRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const pacientesRealizados = getUniqueContatoIds(realizadasRows);
  const ticket_medio =
    pacientesRealizados.size > 0 ? faturamento / pacientesRealizados.size : 0;

  const pagos = rows.filter((row) => Boolean(row.data_pagamento));
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

  const funil = FUNIL_ORDER.filter((stage) => Boolean(etapaMap[stage])).map((stage) => ({
    name: stage,
    value: etapaMap[stage],
    color: FUNIL_COLORS[stage] ?? "#1A56DB",
  }));

  const tipoMap: Record<string, { qtd: number; fat: number }> = {};
  agendadasRows.forEach((row) => {
    const tipo = getDimensionLabel(row.tipo_consulta);
    if (!tipoMap[tipo]) tipoMap[tipo] = { qtd: 0, fat: 0 };
    tipoMap[tipo].qtd += 1;
    tipoMap[tipo].fat += parseMonetary(row.valor_atribuido);
  });

  const por_tipo = Object.entries(tipoMap)
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.qtd - a.qtd);

  const modalidadeMap: Record<string, { fat: number; qtd: number }> = {};
  realizadasRows.forEach((row) => {
    const modalidade = getDimensionLabel(row.modalidade_pagamento);
    if (!modalidadeMap[modalidade]) modalidadeMap[modalidade] = { fat: 0, qtd: 0 };
    modalidadeMap[modalidade].fat += parseMonetary(row.valor_atribuido);
    modalidadeMap[modalidade].qtd += 1;
  });

  const por_modalidade = Object.entries(modalidadeMap)
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.fat - a.fat);

  const origemMap: Record<string, number> = {};
  agendadasRows.forEach((row) => {
    const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
    const origem = contato ? getContatoOrigemAgrupada(contato) : "Não definido";
    origemMap[origem] = (origemMap[origem] ?? 0) + 1;
  });

  const por_origem = Object.entries(origemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const evolucao = buildEvolucao(realizadasRows, dataInicio, dataFim, tipoData);

  const baseConsultaContatoIds = getUniqueContatoIds(agendadasRows);
  const baseConsultaContatos = baseConsultaContatoIds.size;

  const espiroRows = filterFunnelRows(
    allEspiroCards,
    dataInicio,
    dataFim,
    tipoData,
    responsavel,
    somenteAnuncios,
    contatoOrigemMap
  );
  const broncoRows = filterFunnelRows(
    allBroncoCards,
    dataInicio,
    dataFim,
    tipoData,
    responsavel,
    somenteAnuncios,
    contatoOrigemMap
  );
  const cirurgiaRows = filterFunnelRows(
    allCirurgiaCards,
    dataInicio,
    dataFim,
    tipoData,
    responsavel,
    somenteAnuncios,
    contatoOrigemMap
  );

  const espiroContatoIds = getUniqueContatoIds(espiroRows);
  const broncoContatoIds = getUniqueContatoIds(broncoRows);
  const cirurgiaContatoIds = getUniqueContatoIds(cirurgiaRows);

  const conversao_espirometria = getIntersectionSize(
    baseConsultaContatoIds,
    espiroContatoIds
  );
  const conversao_broncoscopia = getIntersectionSize(
    baseConsultaContatoIds,
    broncoContatoIds
  );
  const conversao_cirurgia = getIntersectionSize(
    baseConsultaContatoIds,
    cirurgiaContatoIds
  );

  const conversao_espirometria_pct =
    baseConsultaContatos > 0 ? conversao_espirometria / baseConsultaContatos : 0;
  const conversao_broncoscopia_pct =
    baseConsultaContatos > 0 ? conversao_broncoscopia / baseConsultaContatos : 0;
  const conversao_cirurgia_pct =
    baseConsultaContatos > 0 ? conversao_cirurgia / baseConsultaContatos : 0;

  const taxa_conversao = agendadas > 0 ? realizadas / agendadas : 0;

  const temposCaptacao = agendadasRows
    .map((row) => calcDiffDias(row.data_agendamento, row.data_criacao_card))
    .filter((diff): diff is number => diff !== null && diff >= 0);
  const tempo_medio_captacao =
    temposCaptacao.length > 0
      ? temposCaptacao.reduce((sum, d) => sum + d, 0) / temposCaptacao.length
      : 0;

  const porResponsavelMap: Record<string, number> = {};
  realizadasRows.forEach((row) => {
    const resp = (row.responsavel ?? "").trim() || "Não definido";
    porResponsavelMap[resp] = (porResponsavelMap[resp] ?? 0) + 1;
  });
  const realizadas_por_responsavel = Object.entries(porResponsavelMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

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
    .map((row) => ({
      id: row.id,
      nome: row.nome_contato ?? "—",
      data_agendamento: row.data_agendamento ?? "—",
      tipo: getDimensionLabel(row.tipo_consulta),
      modalidade: getDimensionLabel(row.modalidade_pagamento),
      origem: row.contato_id
        ? getContatoOrigemAgrupada(
            contatoOrigemMap.get(row.contato_id) ?? {
              tags: null,
              origem_contato: null,
            }
          )
        : "Não definido",
      etapa: getDimensionLabel(row.etapa_no_crm),
      valor: parseMonetary(row.valor_atribuido),
      pago: Boolean(row.data_pagamento),
    }));

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
          getDimensionLabel(row.tipo_consulta),
          getDimensionLabel(row.modalidade_pagamento),
          contato ? getContatoOrigemAgrupada(contato) : "Não definido",
        ],
        meta: {
          tipo: getDimensionLabel(row.tipo_consulta),
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
    no_show_consulta,
    no_show_retorno,
    no_show_consulta_pct,
    no_show_retorno_pct,
    faturamento,
    ticket_medio,
    pago_qtd,
    pago_no_dia,
    pago_no_dia_pct,
    prazo_medio,
    funil,
    por_tipo,
    por_modalidade,
    por_origem,
    evolucao,
    taxa_conversao,
    tempo_medio_captacao,
    realizadas_por_responsavel,
    faturamento_por_origem,
    tabela,
    funil_registros,
    base_consulta_contatos: baseConsultaContatos,
    conversao_espirometria,
    conversao_broncoscopia,
    conversao_cirurgia,
    conversao_espirometria_pct,
    conversao_broncoscopia_pct,
    conversao_cirurgia_pct,
  };
}

export function useConsultasData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, tipoData, responsavel, somenteAnuncios } = filters;
  const previousRange = useMemo(
    () => getPreviousPeriodRange(dataInicio, dataFim),
    [dataFim, dataInicio]
  );

  const { data: allRows = [], isLoading: loadingMain } = useQuery({
    queryKey: ["consultas_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select(
          "id, key, contato_id, nome_contato, responsavel, etapa_no_crm, tipo_consulta, " +
            "modalidade_pagamento, origem, data_criacao_card, " +
            "data_agendamento, data_pagamento, valor_atribuido"
        );

      if (error) throw error;
      return (data ?? []) as ConsultaRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allContatoOrigens = [], isLoading: loadingContatos } = useQuery({
    queryKey: ["contatos_origem_lookup_all_v1"],
    queryFn: fetchAllContatoOrigens,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEspiroCards = [], isLoading: loadingEspiro } = useQuery({
    queryKey: ["espirometria_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("espirometria")
        .select("contato_id, data_criacao_card, data_agendamento, responsavel, etapa_no_crm");

      if (error) throw error;
      return (data ?? []) as FunnelCardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allBroncoCards = [], isLoading: loadingBronco } = useQuery({
    queryKey: ["broncoscopia_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broncoscopia")
        .select("contato_id, data_criacao_card, data_agendamento, responsavel, etapa_no_crm");

      if (error) throw error;
      return (data ?? []) as FunnelCardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCirurgiaCards = [], isLoading: loadingCirurgia } = useQuery({
    queryKey: ["procedimentos_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedimentos_cirurgicos")
        .select("contato_id, data_criacao_card, data_agendamento, responsavel, etapa_no_crm");

      if (error) throw error;
      return (data ?? []) as FunnelCardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    loadingMain ||
    loadingContatos ||
    loadingEspiro ||
    loadingBronco ||
    loadingCirurgia;

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

    const current = buildConsultasMetrics(
      filterRowsByPeriod(dataInicio, dataFim),
      dataInicio,
      dataFim,
      tipoData,
      responsavel,
      somenteAnuncios,
      contatoOrigemMap,
      allEspiroCards,
      allBroncoCards,
      allCirurgiaCards
    );

    const previous = buildConsultasMetrics(
      filterRowsByPeriod(previousRange.dataInicio, previousRange.dataFim),
      previousRange.dataInicio,
      previousRange.dataFim,
      tipoData,
      responsavel,
      somenteAnuncios,
      contatoOrigemMap,
      allEspiroCards,
      allBroncoCards,
      allCirurgiaCards
    );

    const comparisons = {
      kpis: buildMetricComparisons(
        {
          agendadas: current.agendadas,
          realizadas: current.realizadas,
          no_show_consulta: current.no_show_consulta,
          no_show_retorno: current.no_show_retorno,
          faturamento: current.faturamento,
          ticket_medio: current.ticket_medio,
          pago_qtd: current.pago_qtd,
          pago_no_dia_pct: current.pago_no_dia_pct,
          prazo_medio: current.prazo_medio,
          conversao_espirometria: current.conversao_espirometria,
          conversao_broncoscopia: current.conversao_broncoscopia,
          conversao_cirurgia: current.conversao_cirurgia,
          taxa_conversao: current.taxa_conversao,
          tempo_medio_captacao: current.tempo_medio_captacao,
        },
        {
          agendadas: previous.agendadas,
          realizadas: previous.realizadas,
          no_show_consulta: previous.no_show_consulta,
          no_show_retorno: previous.no_show_retorno,
          faturamento: previous.faturamento,
          ticket_medio: previous.ticket_medio,
          pago_qtd: previous.pago_qtd,
          pago_no_dia_pct: previous.pago_no_dia_pct,
          prazo_medio: previous.prazo_medio,
          conversao_espirometria: previous.conversao_espirometria,
          conversao_broncoscopia: previous.conversao_broncoscopia,
          conversao_cirurgia: previous.conversao_cirurgia,
          taxa_conversao: previous.taxa_conversao,
          tempo_medio_captacao: previous.tempo_medio_captacao,
        }
      ),
      charts: {
        cross_funnel: buildMetricComparison(
          current.conversao_espirometria +
            current.conversao_broncoscopia +
            current.conversao_cirurgia,
          previous.conversao_espirometria +
            previous.conversao_broncoscopia +
            previous.conversao_cirurgia
        ),
        funil: buildMetricComparison(
          sumByNumberKey(current.funil, "value"),
          sumByNumberKey(previous.funil, "value")
        ),
        por_tipo: buildMetricComparison(
          sumByNumberKey(current.por_tipo, "qtd"),
          sumByNumberKey(previous.por_tipo, "qtd")
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
        realizadas_por_responsavel: buildMetricComparison(
          sumByNumberKey(current.realizadas_por_responsavel, "value"),
          sumByNumberKey(previous.realizadas_por_responsavel, "value")
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
    allBroncoCards,
    allCirurgiaCards,
    allEspiroCards,
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

  return {
    isLoading,
    ...metrics,
  };
}
