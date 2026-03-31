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
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { calcDiffDias, parseMonetary } from "@/lib/parse";
import { buildEvolucao } from "@/lib/evolucao";

type ProcRow = {
  id: string;
  contato_id: string | null;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  tipo_paciente: string | null;
  modalidade_pagamento: string | null;
  origem: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
  data_pagamento: string | null;
  valor_atribuido: string | null;
  custo_anestesia: string | null;
  custo_comissao: string | null;
  custo_hospital: string | null;
  custo_instrumentacao: string | null;
  impostos: string | null;
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

const FUNIL_ORDER = [
  "Captação",
  "Negociação",
  "Perdido",
  "Agendado",
  "Realizado",
  "Não compareceu",
  "Retorno Agendado",
  "Compareceu Retorno",
  "Não Compareceu Retorno",
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

function getCostBreakdown(row: ProcRow) {
  return {
    anestesia: parseMonetary(row.custo_anestesia),
    comissao: parseMonetary(row.custo_comissao),
    hospital: parseMonetary(row.custo_hospital),
    impostos: parseMonetary(row.impostos),
    instrumentacao: parseMonetary(row.custo_instrumentacao),
  };
}

function custoRow(row: ProcRow) {
  const costs = getCostBreakdown(row);
  return (
    costs.anestesia +
    costs.comissao +
    costs.hospital +
    costs.impostos +
    costs.instrumentacao
  );
}

function valorLiquidoRow(row: ProcRow) {
  return parseMonetary(row.valor_atribuido) - custoRow(row);
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

function buildProcedimentosMetrics(
  rows: ProcRow[],
  contatoOrigemMap: Map<string, ContatoOrigemRow>,
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode
) {
  const agendadosRows = rows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );

  const realizadasRows = agendadosRows.filter((row) =>
    ETAPAS_REALIZADAS.has(normalizeStage(row.etapa_no_crm))
  );

  const noShowConsultaRows = agendadosRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );

  const noShowRetornoRows = agendadosRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_RETORNO
  );

  const agendados = agendadosRows.length;
  const fechados_qtd = agendadosRows.length;
  const realizados = realizadasRows.length;
  const no_show_consulta = noShowConsultaRows.length;
  const no_show_retorno = noShowRetornoRows.length;
  const no_show_consulta_pct = agendados > 0 ? no_show_consulta / agendados : 0;
  const no_show_retorno_pct = realizados > 0 ? no_show_retorno / realizados : 0;

  const fechados_valor = agendadosRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const faturamento = realizadasRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const valor_liquido_total = realizadasRows.reduce(
    (sum, row) => sum + valorLiquidoRow(row),
    0
  );

  const costTotals = realizadasRows.reduce(
    (acc, row) => {
      const costs = getCostBreakdown(row);
      acc.anestesia += costs.anestesia;
      acc.comissao += costs.comissao;
      acc.hospital += costs.hospital;
      acc.impostos += costs.impostos;
      acc.instrumentacao += costs.instrumentacao;
      return acc;
    },
    {
      anestesia: 0,
      comissao: 0,
      hospital: 0,
      impostos: 0,
      instrumentacao: 0,
    }
  );

  const custo_total =
    costTotals.anestesia +
    costTotals.comissao +
    costTotals.hospital +
    costTotals.impostos +
    costTotals.instrumentacao;

  const custo_medio = realizados > 0 ? custo_total / realizados : 0;
  const margem_bruta = faturamento - custo_total;

  const pacientesRealizados = getUniqueContatoIds(realizadasRows);
  const ticket_medio =
    pacientesRealizados.size > 0 ? faturamento / pacientesRealizados.size : 0;

  const pagos = agendadosRows.filter((row) => Boolean(row.data_pagamento));
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
  }));

  const por_tipoMap: Record<string, { fat: number; liq: number }> = {};
  realizadasRows.forEach((row) => {
    const tipo = getDimensionLabel(row.tipo_paciente);
    if (!por_tipoMap[tipo]) por_tipoMap[tipo] = { fat: 0, liq: 0 };
    por_tipoMap[tipo].fat += parseMonetary(row.valor_atribuido);
    por_tipoMap[tipo].liq += valorLiquidoRow(row);
  });

  const por_tipo = Object.entries(por_tipoMap)
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) => b.fat - a.fat);

  const por_modalidadeMap: Record<string, number> = {};
  realizadasRows.forEach((row) => {
    const modalidade = getDimensionLabel(row.modalidade_pagamento);
    por_modalidadeMap[modalidade] =
      (por_modalidadeMap[modalidade] ?? 0) + parseMonetary(row.valor_atribuido);
  });

  const por_modalidade = Object.entries(por_modalidadeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const por_origemMap: Record<string, number> = {};
  agendadosRows.forEach((row) => {
    const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
    const origem = contato ? getContatoOrigemAgrupada(contato) : "Não definido";
    por_origemMap[origem] = (por_origemMap[origem] ?? 0) + 1;
  });

  const por_origem = Object.entries(por_origemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const custos_por_categoria = [
    { name: "Hospital", value: costTotals.hospital },
    { name: "Anestesia", value: costTotals.anestesia },
    { name: "Comissão", value: costTotals.comissao },
    { name: "Impostos", value: costTotals.impostos },
    { name: "Instrumentação", value: costTotals.instrumentacao },
  ].filter((item) => item.value > 0);

  const evolucao = buildEvolucao(realizadasRows, dataInicio, dataFim, tipoData);

  const taxa_conversao = agendados > 0 ? realizados / agendados : 0;

  const ticketPorRespMap: Record<string, { fat: number; contatos: Set<string> }> = {};
  realizadasRows.forEach((row) => {
    const resp = (row.responsavel ?? "").trim() || "Não definido";
    if (!ticketPorRespMap[resp]) ticketPorRespMap[resp] = { fat: 0, contatos: new Set() };
    ticketPorRespMap[resp].fat += parseMonetary(row.valor_atribuido);
    if (row.contato_id) ticketPorRespMap[resp].contatos.add(row.contato_id);
  });
  const ticket_por_responsavel = Object.entries(ticketPorRespMap)
    .map(([name, { fat, contatos }]) => ({
      name,
      ticket: contatos.size > 0 ? fat / contatos.size : 0,
      qtd: contatos.size,
      fat,
    }))
    .sort((a, b) => b.fat - a.fat);

  let fatAcumulado = 0;
  const evolucao_acumulada = evolucao.map((point) => {
    fatAcumulado += point.value;
    return { date: point.date, value: point.value, acumulado: fatAcumulado };
  });

  const tabela = [...agendadosRows]
    .sort((a, b) => (b.data_agendamento ?? "").localeCompare(a.data_agendamento ?? ""))
    .slice(0, 60)
    .map((row) => ({
      id: row.id,
      nome: row.nome_contato ?? "—",
      data_agendamento: row.data_agendamento ?? "—",
      tipo: getDimensionLabel(row.tipo_paciente),
      modalidade: getDimensionLabel(row.modalidade_pagamento),
      etapa: getDimensionLabel(row.etapa_no_crm),
      valor_bruto: parseMonetary(row.valor_atribuido),
      custo: custoRow(row),
      valor_liq: valorLiquidoRow(row),
      pago: Boolean(row.data_pagamento),
    }));

  const funil_registros: FunnelStageDrilldownRecord[] = [...rows]
    .sort((a, b) => (b.data_agendamento ?? "").localeCompare(a.data_agendamento ?? ""))
    .map((row) => {
      const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
      const costs = getCostBreakdown(row);

      return {
        id: row.id,
        nome: row.nome_contato ?? "—",
        etapa: getDimensionLabel(row.etapa_no_crm),
        dataAgendamento: row.data_agendamento ?? "—",
        responsavel: getDimensionLabel(row.responsavel),
        valor: parseMonetary(row.valor_atribuido),
        dataReferencia: getRowDateByMode(row, tipoData),
        detalhes: [
          getDimensionLabel(row.tipo_paciente),
          getDimensionLabel(row.modalidade_pagamento),
          contato ? getContatoOrigemAgrupada(contato) : "Não definido",
        ],
        meta: {
          tipo: getDimensionLabel(row.tipo_paciente),
          modalidade: getDimensionLabel(row.modalidade_pagamento),
          origem: contato ? getContatoOrigemAgrupada(contato) : "Não definido",
          custo: custoRow(row),
          custoHospital: costs.hospital,
          custoAnestesia: costs.anestesia,
          custoComissao: costs.comissao,
          custoImpostos: costs.impostos,
          custoInstrumentacao: costs.instrumentacao,
          valorLiquido: valorLiquidoRow(row),
          fechadaBase: !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(
            normalizeStage(row.etapa_no_crm)
          ),
          realizada: ETAPAS_REALIZADAS.has(normalizeStage(row.etapa_no_crm)),
          pago: Boolean(row.data_pagamento),
        },
      };
    });

  return {
    agendados,
    fechados_qtd,
    fechados_valor,
    realizados,
    no_show_consulta,
    no_show_retorno,
    no_show_consulta_pct,
    no_show_retorno_pct,
    faturamento,
    valor_liquido_total,
    margem_bruta,
    ticket_medio,
    custo_total,
    custo_medio,
    custo_anestesia_total: costTotals.anestesia,
    custo_comissao_total: costTotals.comissao,
    custo_hospital_total: costTotals.hospital,
    custo_impostos_total: costTotals.impostos,
    custo_instrumentacao_total: costTotals.instrumentacao,
    pago_qtd,
    pago_no_dia,
    pago_no_dia_pct,
    prazo_medio,
    funil,
    por_tipo,
    por_modalidade,
    por_origem,
    custos_por_categoria,
    evolucao,
    taxa_conversao,
    ticket_por_responsavel,
    evolucao_acumulada,
    tabela,
    funil_registros,
  };
}

export function useProcedimentosData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, tipoData, responsavel, somenteAnuncios } = filters;
  const previousRange = useMemo(
    () => getPreviousPeriodRange(dataInicio, dataFim),
    [dataFim, dataInicio]
  );

  const { data: allRows = [], isLoading: loadingMain } = useQuery({
    queryKey: ["procedimentos_all_v4"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedimentos_cirurgicos")
        .select(
          "id, contato_id, nome_contato, responsavel, etapa_no_crm, tipo_paciente, " +
            "modalidade_pagamento, origem, data_criacao_card, " +
            "data_agendamento, data_pagamento, valor_atribuido, " +
            "custo_anestesia, custo_comissao, custo_hospital, custo_instrumentacao, impostos"
        );

      if (error) throw error;
      return (data ?? []) as ProcRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allContatoOrigens = [], isLoading: loadingContatos } = useQuery({
    queryKey: ["contatos_origem_lookup_all_v1"],
    queryFn: fetchAllContatoOrigens,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingMain || loadingContatos;

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

    const current = buildProcedimentosMetrics(
      filterRowsByPeriod(dataInicio, dataFim),
      contatoOrigemMap,
      dataInicio,
      dataFim,
      tipoData
    );

    const previous = buildProcedimentosMetrics(
      filterRowsByPeriod(previousRange.dataInicio, previousRange.dataFim),
      contatoOrigemMap,
      previousRange.dataInicio,
      previousRange.dataFim,
      tipoData
    );

    const comparisons = {
      kpis: buildMetricComparisons(
        {
          agendados: current.agendados,
          fechados_qtd: current.fechados_qtd,
          fechados_valor: current.fechados_valor,
          realizados: current.realizados,
          no_show_consulta: current.no_show_consulta,
          no_show_retorno: current.no_show_retorno,
          faturamento: current.faturamento,
          valor_liquido_total: current.valor_liquido_total,
          margem_bruta: current.margem_bruta,
          ticket_medio: current.ticket_medio,
          custo_total: current.custo_total,
          custo_medio: current.custo_medio,
          pago_qtd: current.pago_qtd,
          pago_no_dia: current.pago_no_dia,
          pago_no_dia_pct: current.pago_no_dia_pct,
          prazo_medio: current.prazo_medio,
          taxa_conversao: current.taxa_conversao,
        },
        {
          agendados: previous.agendados,
          fechados_qtd: previous.fechados_qtd,
          fechados_valor: previous.fechados_valor,
          realizados: previous.realizados,
          no_show_consulta: previous.no_show_consulta,
          no_show_retorno: previous.no_show_retorno,
          faturamento: previous.faturamento,
          valor_liquido_total: previous.valor_liquido_total,
          margem_bruta: previous.margem_bruta,
          ticket_medio: previous.ticket_medio,
          custo_total: previous.custo_total,
          custo_medio: previous.custo_medio,
          pago_qtd: previous.pago_qtd,
          pago_no_dia: previous.pago_no_dia,
          pago_no_dia_pct: previous.pago_no_dia_pct,
          prazo_medio: previous.prazo_medio,
          taxa_conversao: previous.taxa_conversao,
        }
      ),
      charts: {
        performance: buildMetricComparison(
          current.realizados,
          previous.realizados
        ),
        recebimento: buildMetricComparison(
          current.pago_qtd,
          previous.pago_qtd
        ),
        resultado_financeiro: buildMetricComparison(
          current.valor_liquido_total,
          previous.valor_liquido_total
        ),
        funil: buildMetricComparison(
          sumByNumberKey(current.funil, "value"),
          sumByNumberKey(previous.funil, "value")
        ),
        por_tipo: buildMetricComparison(
          sumByNumberKey(current.por_tipo, "fat"),
          sumByNumberKey(previous.por_tipo, "fat")
        ),
        custos_por_categoria: buildMetricComparison(
          sumByNumberKey(current.custos_por_categoria, "value"),
          sumByNumberKey(previous.custos_por_categoria, "value")
        ),
        por_modalidade: buildMetricComparison(
          sumByNumberKey(current.por_modalidade, "value"),
          sumByNumberKey(previous.por_modalidade, "value")
        ),
        por_origem: buildMetricComparison(
          sumByNumberKey(current.por_origem, "value"),
          sumByNumberKey(previous.por_origem, "value")
        ),
        evolucao: buildMetricComparison(
          sumByNumberKey(current.evolucao, "value"),
          sumByNumberKey(previous.evolucao, "value")
        ),
        ticket_por_responsavel: buildMetricComparison(
          sumByNumberKey(current.ticket_por_responsavel, "fat"),
          sumByNumberKey(previous.ticket_por_responsavel, "fat")
        ),
      },
    };

    return {
      ...current,
      comparisons,
    };
  }, [
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
