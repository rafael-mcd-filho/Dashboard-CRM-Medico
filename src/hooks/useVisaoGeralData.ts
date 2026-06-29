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
  parseTags,
} from "@/lib/contactOrigins";
import {
  getValorFaturavel,
  hasRecebimentoFinanceiro,
  isRetornoSemCobranca,
  RETORNO_AGENDA_TAG,
} from "@/lib/billing";
import {
  getRowDateByMode,
  isRowInDateModeRange,
  type DashboardDateMode,
} from "@/lib/dateMode";
import { buildEvolucao } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import {
  buildCombinedLossOrigins,
  buildCombinedLossReasons,
  buildLossDiagnostics,
} from "@/lib/lossReasons";
import { calcDiffDias, isInDateRange, parseMonetary } from "@/lib/parse";

type ContatoRow = {
  contato_id: string;
  nome: string | null;
  criado_em: string | null;
  tags: string | null;
  origem_contato: string | null;
};

type RowBase = {
  id: string;
  nome_contato: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
  tipo_consulta?: string | null;
  tipo_paciente?: string | null;
  modalidade_pagamento?: string | null;
  quantidade_codigos?: string | null;
  valor_atribuido: string | null;
  forma_pagamento: string | null;
  tag_id_card: string | null;
  data_criacao_card: string | null;
  data_pagamento: string | null;
  data_agendamento: string | null;
  contato_id: string | null;
};

type ConsultaRow = RowBase & {
  key: string;
};

type ExameRow = RowBase & {
};

type CirurgiaRow = RowBase & {
  custo_anestesia: string | null;
  custo_comissao: string | null;
  custo_hospital: string | null;
  custo_instrumentacao: string | null;
  impostos: string | null;
};

const PAGE_SIZE = 1000;

const ETAPAS_EXCLUIDAS_AGENDAMENTO = new Set([
  "captacao",
  "negociacao",
  "perdido",
]);

const ETAPAS_REALIZADAS_CONSULTA = new Set([
  "realizado",
  "retorno agendado",
  "compareceu retorno",
  "nao compareceu retorno",
  "finalizado/concluido",
]);

const ETAPAS_REALIZADAS_ESPIRO = new Set([
  "realizado",
  "finalizado/concluido",
]);

const ETAPAS_REALIZADAS_BRONCO = new Set([
  "realizado",
  "exames / resultados",
  "retorno agendado",
  "compareceu retorno",
  "nao compareceu retorno",
  "finalizado/concluido",
]);

const ETAPAS_REALIZADAS_CIRURGIA = new Set([
  "realizado",
  "retorno agendado",
  "compareceu retorno",
  "nao compareceu retorno",
  "finalizado/concluido",
]);

const ETAPA_NO_SHOW_CONSULTA = "nao compareceu";
const ETAPA_NO_SHOW_RETORNO = "nao compareceu retorno";

function normalizeStage(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getDimensionLabel(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : "Nao definido";
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

function calcPrazoMedio(rows: RowBase[]) {
  const pagos = rows.filter(hasRecebimentoFinanceiro);
  const diffs = pagos
    .map((row) => calcDiffDias(row.data_pagamento, row.data_agendamento))
    .filter((diff): diff is number => diff !== null && diff >= 0);

  return diffs.length > 0
    ? diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length
    : 0;
}

function getPaidCount(rows: RowBase[]) {
  return rows.filter(hasRecebimentoFinanceiro).length;
}

function getCirurgiaCost(row: CirurgiaRow) {
  if (isRetornoSemCobranca(row.forma_pagamento)) return 0;

  return (
    parseMonetary(row.custo_anestesia) +
    parseMonetary(row.custo_comissao) +
    parseMonetary(row.custo_hospital) +
    parseMonetary(row.custo_instrumentacao) +
    parseMonetary(row.impostos)
  );
}

function getCirurgiaCostBreakdown(row: CirurgiaRow) {
  if (isRetornoSemCobranca(row.forma_pagamento)) {
    return {
      anestesia: 0,
      comissao: 0,
      hospital: 0,
      impostos: 0,
      instrumentacao: 0,
    };
  }

  return {
    anestesia: parseMonetary(row.custo_anestesia),
    comissao: parseMonetary(row.custo_comissao),
    hospital: parseMonetary(row.custo_hospital),
    impostos: parseMonetary(row.impostos),
    instrumentacao: parseMonetary(row.custo_instrumentacao),
  };
}

function getCirurgiaValorLiquido(row: CirurgiaRow) {
  return getValorFaturavel(row) - getCirurgiaCost(row);
}

function groupCount<T>(rows: T[], getName: (row: T) => string) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const name = getName(row);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value !== a.value ? b.value - a.value : a.name.localeCompare(b.name)));
}

function groupRevenue<T extends RowBase>(rows: T[], getName: (row: T) => string) {
  const groups = new Map<string, { qtd: number; faturamento: number }>();

  rows.forEach((row) => {
    const name = getName(row);
    const current = groups.get(name) ?? { qtd: 0, faturamento: 0 };
    current.qtd += 1;
    current.faturamento += getValorFaturavel(row);
    groups.set(name, current);
  });

  return Array.from(groups.entries())
    .map(([name, values]) => ({ name, ...values }))
    .sort((a, b) =>
      b.faturamento !== a.faturamento
        ? b.faturamento - a.faturamento
        : b.qtd - a.qtd
    );
}

function normalizeAnalyticsKey(value: string) {
  return getDimensionLabel(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function calcShare(value: number, total: number) {
  return total > 0 ? value / total : 0;
}

function toCountDistribution(
  items: Array<{ name: string; value: number }>,
  total: number
) {
  return items.map((item) => ({
    nome: item.name,
    chave: normalizeAnalyticsKey(item.name),
    quantidade: item.value,
    percentual_do_total: calcShare(item.value, total),
  }));
}

function toRevenueDistribution(
  items: Array<{ name: string; qtd: number; faturamento: number }>,
  totalRevenue: number
) {
  return items.map((item) => ({
    nome: item.name,
    chave: normalizeAnalyticsKey(item.name),
    quantidade: item.qtd,
    faturamento_reais: item.faturamento,
    percentual_do_faturamento_total: calcShare(item.faturamento, totalRevenue),
  }));
}

function getCountByKey(items: Array<{ name: string; value: number }>, key: string) {
  return (
    items.find((item) => normalizeAnalyticsKey(item.name) === key)?.value ?? 0
  );
}

function getTopItem<T extends { quantidade?: number; faturamento_reais?: number }>(
  items: T[],
  key: "quantidade" | "faturamento_reais"
) {
  return items[0] && (items[0][key] ?? 0) > 0 ? items[0] : null;
}

function toComparisonValue(
  label: string,
  unit: "quantidade" | "reais" | "percentual" | "dias",
  comparison: {
    current: number;
    previous: number;
    delta: number;
    deltaPct: number | null;
    direction: "up" | "down" | "flat";
  }
) {
  const tendencia =
    comparison.direction === "up"
      ? "aumentou"
      : comparison.direction === "down"
        ? "diminuiu"
        : "ficou_estavel";

  return {
    metrica: label,
    unidade: unit,
    valor_atual: comparison.current,
    valor_periodo_anterior: comparison.previous,
    diferenca_absoluta: comparison.delta,
    variacao_percentual: comparison.deltaPct,
    tendencia,
  };
}

function calcTicketMedio(rows: RowBase[]) {
  const rowsFaturaveis = rows.filter(
    (row) => !isRetornoSemCobranca(row.forma_pagamento)
  );
  const contatoIds = getUniqueContatoIds(rowsFaturaveis);
  const faturamento = rows.reduce((sum, row) => sum + getValorFaturavel(row), 0);

  return contatoIds.size > 0 ? faturamento / contatoIds.size : 0;
}

function calcRecebimento(rows: RowBase[]) {
  const pagos = rows.filter(hasRecebimentoFinanceiro);
  const pago_no_dia = pagos.filter(
    (row) =>
      row.data_pagamento &&
      row.data_agendamento &&
      row.data_pagamento.substring(0, 10) === row.data_agendamento.substring(0, 10)
  ).length;

  return {
    quantidade_com_pagamento: pagos.length,
    quantidade_paga_no_dia: pago_no_dia,
    percentual_pago_no_dia: pagos.length > 0 ? pago_no_dia / pagos.length : 0,
    prazo_medio_recebimento_dias: calcPrazoMedio(rows),
  };
}

function buildEvolucaoPorFunil(
  consultas: RowBase[],
  espirometria: RowBase[],
  broncoscopia: RowBase[],
  cirurgia: RowBase[],
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode
) {
  const consultasEvolucao = buildEvolucao(consultas, dataInicio, dataFim, tipoData);
  const espirometriaEvolucao = buildEvolucao(espirometria, dataInicio, dataFim, tipoData);
  const broncoscopiaEvolucao = buildEvolucao(broncoscopia, dataInicio, dataFim, tipoData);
  const cirurgiaEvolucao = buildEvolucao(cirurgia, dataInicio, dataFim, tipoData);

  return consultasEvolucao.map((item, index) => ({
    date: item.date,
    consultas: item.value,
    espirometria: espirometriaEvolucao[index]?.value ?? 0,
    broncoscopia: broncoscopiaEvolucao[index]?.value ?? 0,
    cirurgia: cirurgiaEvolucao[index]?.value ?? 0,
  }));
}

async function fetchAllContatos() {
  const rows: ContatoRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contatos")
      .select("contato_id, nome, criado_em, tags, origem_contato")
      .order("contato_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const batch = (data ?? []) as ContatoRow[];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

function buildVisaoGeralMetrics(
  contatos: ContatoRow[],
  consultaRows: ConsultaRow[],
  espiroRows: ExameRow[],
  broncoRows: ExameRow[],
  cirurgiaRows: CirurgiaRow[],
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode,
  contatoOrigemMap: Map<string, ContatoRow>
) {
  const leads_novos = contatos.length;

  const consultasAgendadasRows = consultaRows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );
  const consultasRealizadasRows = consultasAgendadasRows.filter((row) =>
    ETAPAS_REALIZADAS_CONSULTA.has(normalizeStage(row.etapa_no_crm))
  );
  const consultasNoShowRows = consultasAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );
  const consultasNoShowRetornoRows = consultasAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_RETORNO
  );

  const espiroAgendadasRows = espiroRows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );
  const espiroRealizadasRows = espiroAgendadasRows.filter((row) =>
    ETAPAS_REALIZADAS_ESPIRO.has(normalizeStage(row.etapa_no_crm))
  );
  const espiroNoShowRows = espiroAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );

  const broncoAgendadasRows = broncoRows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );
  const broncoRealizadasRows = broncoAgendadasRows.filter((row) =>
    ETAPAS_REALIZADAS_BRONCO.has(normalizeStage(row.etapa_no_crm))
  );
  const broncoNoShowRows = broncoAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );
  const broncoNoShowRetornoRows = broncoAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_RETORNO
  );

  const cirurgiaAgendadasRows = cirurgiaRows.filter(
    (row) => !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
  );
  const cirurgiaRealizadasRows = cirurgiaAgendadasRows.filter((row) =>
    ETAPAS_REALIZADAS_CIRURGIA.has(normalizeStage(row.etapa_no_crm))
  );
  const cirurgiaNoShowRows = cirurgiaAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_CONSULTA
  );
  const cirurgiaNoShowRetornoRows = cirurgiaAgendadasRows.filter(
    (row) => normalizeStage(row.etapa_no_crm) === ETAPA_NO_SHOW_RETORNO
  );

  const consultas_agendadas = consultasAgendadasRows.length;
  const consultas_realizadas = consultasRealizadasRows.length;
  const consultas_no_show = consultasNoShowRows.length;
  const consultas_no_show_retorno = consultasNoShowRetornoRows.length;
  const consultas_no_show_pct =
    consultas_agendadas > 0 ? consultas_no_show / consultas_agendadas : 0;
  const consultas_no_show_retorno_pct =
    consultas_realizadas > 0
      ? consultas_no_show_retorno / consultas_realizadas
      : 0;
  const fat_consultas = consultasRealizadasRows.reduce(
    (sum, row) => sum + getValorFaturavel(row),
    0
  );

  const espiro_total = espiroAgendadasRows.length;
  const espiro_realizadas = espiroRealizadasRows.length;
  const espiro_no_show = espiroNoShowRows.length;
  const fat_espiro = espiroRealizadasRows.reduce(
    (sum, row) => sum + getValorFaturavel(row),
    0
  );

  const bronco_total = broncoAgendadasRows.length;
  const bronco_realizadas = broncoRealizadasRows.length;
  const bronco_no_show = broncoNoShowRows.length;
  const bronco_no_show_retorno = broncoNoShowRetornoRows.length;
  const fat_bronco = broncoRealizadasRows.reduce(
    (sum, row) => sum + getValorFaturavel(row),
    0
  );

  const cirurgia_agendados = cirurgiaAgendadasRows.length;
  const cirurgia_realizados = cirurgiaRealizadasRows.length;
  const cirurgia_no_show = cirurgiaNoShowRows.length;
  const cirurgia_no_show_retorno = cirurgiaNoShowRetornoRows.length;
  const cirurgia_no_show_pct =
    cirurgia_agendados > 0 ? cirurgia_no_show / cirurgia_agendados : 0;
  const cirurgia_no_show_retorno_pct =
    cirurgia_realizados > 0
      ? cirurgia_no_show_retorno / cirurgia_realizados
      : 0;
  const fat_cirurgia = cirurgiaRealizadasRows.reduce(
    (sum, row) => sum + getValorFaturavel(row),
    0
  );
  const cirurgia_fechados_valor = cirurgiaAgendadasRows.reduce(
    (sum, row) => sum + getValorFaturavel(row),
    0
  );
  const vliq_cirurgia = cirurgiaRealizadasRows.reduce(
    (sum, row) => sum + getCirurgiaValorLiquido(row),
    0
  );

  const prazo_consultas = calcPrazoMedio(consultasAgendadasRows);
  const prazo_espiro = calcPrazoMedio(espiroAgendadasRows);
  const prazo_bronco = calcPrazoMedio(broncoAgendadasRows);
  const prazo_cirurgia = calcPrazoMedio(cirurgiaAgendadasRows);

  const pagos_consultas = getPaidCount(consultasAgendadasRows);
  const pagos_espiro = getPaidCount(espiroAgendadasRows);
  const pagos_bronco = getPaidCount(broncoAgendadasRows);
  const pagos_cirurgia = getPaidCount(cirurgiaAgendadasRows);
  const pagos_total =
    pagos_consultas + pagos_espiro + pagos_bronco + pagos_cirurgia;

  const prazo_medio_geral =
    pagos_total > 0
      ? (prazo_consultas * pagos_consultas +
          prazo_espiro * pagos_espiro +
          prazo_bronco * pagos_bronco +
          prazo_cirurgia * pagos_cirurgia) /
        pagos_total
      : 0;

  const consultaContatoIds = getUniqueContatoIds(consultasAgendadasRows);
  const espiroContatoIds = getUniqueContatoIds(espiroAgendadasRows);
  const broncoContatoIds = getUniqueContatoIds(broncoAgendadasRows);
  const cirurgiaContatoIds = getUniqueContatoIds(cirurgiaAgendadasRows);

  const conv_espirometria = getIntersectionSize(
    consultaContatoIds,
    espiroContatoIds
  );
  const conv_broncoscopia = getIntersectionSize(
    consultaContatoIds,
    broncoContatoIds
  );
  const conv_cirurgia = getIntersectionSize(
    consultaContatoIds,
    cirurgiaContatoIds
  );
  const consulta_base_contatos = consultaContatoIds.size;
  const conv_espirometria_pct =
    consulta_base_contatos > 0
      ? conv_espirometria / consulta_base_contatos
      : 0;
  const conv_broncoscopia_pct =
    consulta_base_contatos > 0
      ? conv_broncoscopia / consulta_base_contatos
      : 0;
  const conv_cirurgia_pct =
    consulta_base_contatos > 0 ? conv_cirurgia / consulta_base_contatos : 0;

  const total_agendadas = consultasAgendadasRows.length + espiroAgendadasRows.length + broncoAgendadasRows.length + cirurgiaAgendadasRows.length;
  const total_realizadas = consultasRealizadasRows.length + espiroRealizadasRows.length + broncoRealizadasRows.length + cirurgiaRealizadasRows.length;
  const taxa_realizacao_global = total_agendadas > 0 ? total_realizadas / total_agendadas : 0;

  const respRankMap: Record<string, { realizados: number; faturamento: number }> = {};
  const addToRank = (rows: RowBase[]) => {
    rows.forEach((row) => {
      const resp = (row.responsavel ?? "").trim() || "Não definido";
      if (!respRankMap[resp]) respRankMap[resp] = { realizados: 0, faturamento: 0 };
      respRankMap[resp].realizados += 1;
      respRankMap[resp].faturamento += getValorFaturavel(row);
    });
  };
  addToRank(consultasRealizadasRows);
  addToRank(espiroRealizadasRows);
  addToRank(broncoRealizadasRows);
  addToRank(cirurgiaRealizadasRows);

  const ranking_responsaveis = Object.entries(respRankMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.faturamento - a.faturamento);

  const fat_total = fat_consultas + fat_espiro + fat_bronco + fat_cirurgia;
  const exames_realizados = espiro_realizadas + bronco_realizadas;

  const fat_por_funil = [
    { name: "Consultas", value: fat_consultas, color: "#1A56DB" },
    { name: "Espirometria", value: fat_espiro, color: "#0891B2" },
    { name: "Broncoscopia", value: fat_bronco, color: "#059669" },
    { name: "Cirurgia", value: fat_cirurgia, color: "#7C3AED" },
  ].filter((item) => item.value > 0);

  const volume_por_funil = [
    {
      name: "Consultas",
      total: consultas_agendadas,
      realizadas: consultas_realizadas,
      noShow: consultas_no_show + consultas_no_show_retorno,
      color: "#1A56DB",
    },
    {
      name: "Espirometria",
      total: espiro_total,
      realizadas: espiro_realizadas,
      noShow: espiro_no_show,
      color: "#0891B2",
    },
    {
      name: "Broncoscopia",
      total: bronco_total,
      realizadas: bronco_realizadas,
      noShow: bronco_no_show + bronco_no_show_retorno,
      color: "#059669",
    },
    {
      name: "Cirurgia",
      total: cirurgia_agendados,
      realizadas: cirurgia_realizados,
      noShow: cirurgia_no_show + cirurgia_no_show_retorno,
      color: "#7C3AED",
    },
  ];

  const cross_funnel = [
    {
      name: "Espirometria",
      value: conv_espirometria,
      share: conv_espirometria_pct,
      color: "#0891B2",
    },
    {
      name: "Broncoscopia",
      value: conv_broncoscopia,
      share: conv_broncoscopia_pct,
      color: "#059669",
    },
    {
      name: "Cirurgia",
      value: conv_cirurgia,
      share: conv_cirurgia_pct,
      color: "#7C3AED",
    },
  ];

  const motivos_perda = buildCombinedLossReasons([
    { funnel: "consultas", rows: consultaRows },
    { funnel: "espirometria", rows: espiroRows },
    { funnel: "broncoscopia", rows: broncoRows },
    { funnel: "cirurgia", rows: cirurgiaRows },
  ]);
  const getOrigem = (row: RowBase) => {
    const contato = row.contato_id ? contatoOrigemMap.get(row.contato_id) : undefined;
    return contato ? getContatoOrigemAgrupada(contato) : "Não definido";
  };
  const perdas_diagnostico = buildLossDiagnostics(motivos_perda);
  const perdas_por_origem = buildCombinedLossOrigins([
    { rows: consultaRows, getOrigin: getOrigem },
    { rows: espiroRows, getOrigin: getOrigem },
    { rows: broncoRows, getOrigin: getOrigem },
    { rows: cirurgiaRows, getOrigin: getOrigem },
  ]);

  const evolucao_total = buildEvolucao(
    [
      ...consultasRealizadasRows,
      ...espiroRealizadasRows,
      ...broncoRealizadasRows,
      ...cirurgiaRealizadasRows,
    ],
    dataInicio,
    dataFim,
    tipoData
  );

  const evolucao_por_funil = buildEvolucaoPorFunil(
    consultasRealizadasRows,
    espiroRealizadasRows,
    broncoRealizadasRows,
    cirurgiaRealizadasRows,
    dataInicio,
    dataFim,
    tipoData
  );

  const leadContatoIds = new Set(contatos.map((contato) => contato.contato_id));
  const cirurgiaRealizadaContatoIds = getUniqueContatoIds(cirurgiaRealizadasRows);
  const total_no_show =
    consultas_no_show +
    consultas_no_show_retorno +
    espiro_no_show +
    bronco_no_show +
    bronco_no_show_retorno +
    cirurgia_no_show +
    cirurgia_no_show_retorno;
  const ticket_medio_global = total_realizadas > 0 ? fat_total / total_realizadas : 0;
  const custo_oportunidade_no_show = total_no_show * ticket_medio_global;
  const taxa_no_show_total =
    total_agendadas > 0 ? total_no_show / total_agendadas : 0;
  const conversao_captacao_realizado =
    leads_novos > 0 ? total_realizadas / leads_novos : 0;
  const faturamento_procedimentos_de_leads = cirurgiaRealizadasRows
    .filter((row) => row.contato_id && leadContatoIds.has(row.contato_id))
    .reduce((sum, row) => sum + getValorFaturavel(row), 0);

  const leadTags = contatos.flatMap((contato) => [
    ...new Set(parseTags(contato.tags)),
  ]);
  const leads_por_origem = groupCount(contatos, getContatoOrigemAgrupada);
  const leads_por_tag = groupCount(leadTags, (tag) => tag).slice(0, 25);

  const cirurgiaCostTotals = cirurgiaRealizadasRows.reduce(
    (acc, row) => {
      const costs = getCirurgiaCostBreakdown(row);
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
  const custo_cirurgia_total =
    cirurgiaCostTotals.anestesia +
    cirurgiaCostTotals.comissao +
    cirurgiaCostTotals.hospital +
    cirurgiaCostTotals.impostos +
    cirurgiaCostTotals.instrumentacao;

  const distribuicaoLeadsPorOrigem = toCountDistribution(
    leads_por_origem,
    leads_novos
  );
  const distribuicaoLeadsPorTag = toCountDistribution(leads_por_tag, leads_novos);
  const leadsPorAnuncio = getCountByKey(leads_por_origem, "anuncio");
  const percentualLeadsPorAnuncio = calcShare(leadsPorAnuncio, leads_novos);
  const faturamentoPorFunil = fat_por_funil.map((item) => ({
    funil: item.name,
    chave: normalizeAnalyticsKey(item.name),
    faturamento_reais: item.value,
    percentual_do_faturamento_total: calcShare(item.value, fat_total),
  }));
  const volumePorFunil = volume_por_funil.map((item) => ({
    funil: item.name,
    chave: normalizeAnalyticsKey(item.name),
    quantidade_agendada: item.total,
    quantidade_realizada: item.realizadas,
    quantidade_no_show: item.noShow,
    taxa_realizacao: calcShare(item.realizadas, item.total),
    taxa_no_show: calcShare(item.noShow, item.total),
  }));
  const origemComMaisLeads = getTopItem(distribuicaoLeadsPorOrigem, "quantidade");
  const funilComMaiorFaturamento = getTopItem(
    faturamentoPorFunil,
    "faturamento_reais"
  );

  const analise_export = {
    respostas_diretas: {
      faturamento_total_reais: fat_total,
      leads_por_anuncio: {
        quantidade_leads: leadsPorAnuncio,
        percentual_dos_leads: percentualLeadsPorAnuncio,
        origem_considerada: "Anuncio",
      },
      total_leads_novos: leads_novos,
      origem_com_mais_leads: origemComMaisLeads,
      funil_com_maior_faturamento: funilComMaiorFaturamento,
      total_realizado_em_todos_os_funis: total_realizadas,
      total_agendado_em_todos_os_funis: total_agendadas,
      taxa_realizacao_global,
    },
    indicadores_principais: {
      faturamento_total_reais: fat_total,
      leads_novos_total: leads_novos,
      leads_por_anuncio_quantidade: leadsPorAnuncio,
      leads_por_anuncio_percentual: percentualLeadsPorAnuncio,
      agendamentos_total: total_agendadas,
      procedimentos_ou_atendimentos_realizados_total: total_realizadas,
      taxa_realizacao_global,
      no_show_total: total_no_show,
      no_show_percentual: taxa_no_show_total,
      ticket_medio_global_reais: ticket_medio_global,
      prazo_medio_recebimento_dias: prazo_medio_geral,
      custo_oportunidade_no_show_reais: custo_oportunidade_no_show,
      conversao_leads_para_realizados_percentual: conversao_captacao_realizado,
    },
    leads_e_origens: {
      total_leads_novos: leads_novos,
      leads_por_anuncio: {
        quantidade_leads: leadsPorAnuncio,
        percentual_dos_leads: percentualLeadsPorAnuncio,
      },
      leads_por_origem: distribuicaoLeadsPorOrigem,
      leads_por_tag: distribuicaoLeadsPorTag,
      jornada_dos_leads_nos_funis: {
        chegaram_em_consultas: getIntersectionSize(leadContatoIds, consultaContatoIds),
        chegaram_em_espirometria: getIntersectionSize(
          leadContatoIds,
          espiroContatoIds
        ),
        chegaram_em_broncoscopia: getIntersectionSize(
          leadContatoIds,
          broncoContatoIds
        ),
        fecharam_procedimento_cirurgico: getIntersectionSize(
          leadContatoIds,
          cirurgiaContatoIds
        ),
        realizaram_procedimento_cirurgico: getIntersectionSize(
          leadContatoIds,
          cirurgiaRealizadaContatoIds
        ),
        taxa_lead_para_procedimento_fechado: calcShare(
          getIntersectionSize(leadContatoIds, cirurgiaContatoIds),
          leads_novos
        ),
        taxa_lead_para_procedimento_realizado: calcShare(
          getIntersectionSize(leadContatoIds, cirurgiaRealizadaContatoIds),
          leads_novos
        ),
        faturamento_reais_de_procedimentos_realizados_por_leads:
          faturamento_procedimentos_de_leads,
      },
    },
    faturamento: {
      faturamento_total_reais: fat_total,
      faturamento_por_funil: faturamentoPorFunil,
      evolucao_do_faturamento_total: evolucao_total.map((item) => ({
        periodo: item.date,
        faturamento_reais: item.value,
      })),
      evolucao_do_faturamento_por_funil: evolucao_por_funil.map((item) => ({
        periodo: item.date,
        consultas_reais: item.consultas,
        espirometria_reais: item.espirometria,
        broncoscopia_reais: item.broncoscopia,
        procedimentos_cirurgicos_reais: item.cirurgia,
      })),
    },
    funis: {
      consultas: {
        nome_funil: "Consultas",
        cards_no_periodo: consultaRows.length,
        quantidade_agendada: consultas_agendadas,
        quantidade_realizada: consultas_realizadas,
        quantidade_no_show_consulta: consultas_no_show,
        quantidade_no_show_retorno: consultas_no_show_retorno,
        taxa_realizacao: calcShare(consultas_realizadas, consultas_agendadas),
        taxa_no_show_consulta: consultas_no_show_pct,
        taxa_no_show_retorno: consultas_no_show_retorno_pct,
        faturamento_reais: fat_consultas,
        ticket_medio_reais: calcTicketMedio(consultasRealizadasRows),
        recebimento: calcRecebimento(consultasAgendadasRows),
        etapas_do_funil: toCountDistribution(
          groupCount(consultaRows, (row) => getDimensionLabel(row.etapa_no_crm)),
          consultaRows.length
        ),
        consultas_por_tipo: toCountDistribution(
          groupCount(consultasAgendadasRows, (row) =>
            getDimensionLabel(row.tipo_consulta)
          ),
          consultas_agendadas
        ),
        faturamento_por_tipo: toRevenueDistribution(
          groupRevenue(consultasRealizadasRows, (row) =>
            getDimensionLabel(row.tipo_consulta)
          ),
          fat_consultas
        ),
        faturamento_por_modalidade_pagamento: toRevenueDistribution(
          groupRevenue(consultasRealizadasRows, (row) =>
            getDimensionLabel(row.modalidade_pagamento)
          ),
          fat_consultas
        ),
        consultas_por_origem: toCountDistribution(
          groupCount(consultasAgendadasRows, getOrigem),
          consultas_agendadas
        ),
        faturamento_por_origem: toRevenueDistribution(
          groupRevenue(consultasRealizadasRows, getOrigem),
          fat_consultas
        ),
      },
      espirometria: {
        nome_funil: "Espirometria",
        cards_no_periodo: espiroRows.length,
        quantidade_agendada: espiro_total,
        quantidade_realizada: espiro_realizadas,
        quantidade_no_show: espiro_no_show,
        taxa_realizacao: calcShare(espiro_realizadas, espiro_total),
        taxa_no_show: calcShare(espiro_no_show, espiro_total),
        faturamento_reais: fat_espiro,
        ticket_medio_reais: calcTicketMedio(espiroRealizadasRows),
        recebimento: calcRecebimento(espiroAgendadasRows),
        conversao_com_consultas: {
          quantidade_contatos_tambem_em_consultas: conv_espirometria,
          percentual_sobre_base_de_consultas: conv_espirometria_pct,
        },
        etapas_do_funil: toCountDistribution(
          groupCount(espiroRows, (row) => getDimensionLabel(row.etapa_no_crm)),
          espiroRows.length
        ),
        faturamento_por_modalidade_pagamento: toRevenueDistribution(
          groupRevenue(espiroRealizadasRows, (row) =>
            getDimensionLabel(row.modalidade_pagamento)
          ),
          fat_espiro
        ),
        espirometrias_por_origem: toCountDistribution(
          groupCount(espiroAgendadasRows, getOrigem),
          espiro_total
        ),
        faturamento_por_origem: toRevenueDistribution(
          groupRevenue(espiroRealizadasRows, getOrigem),
          fat_espiro
        ),
      },
      broncoscopia: {
        nome_funil: "Broncoscopia",
        cards_no_periodo: broncoRows.length,
        quantidade_agendada: bronco_total,
        quantidade_realizada: bronco_realizadas,
        quantidade_no_show: bronco_no_show,
        quantidade_no_show_retorno: bronco_no_show_retorno,
        taxa_realizacao: calcShare(bronco_realizadas, bronco_total),
        taxa_no_show: calcShare(bronco_no_show, bronco_total),
        taxa_no_show_retorno: calcShare(
          bronco_no_show_retorno,
          bronco_realizadas
        ),
        faturamento_reais: fat_bronco,
        ticket_medio_reais: calcTicketMedio(broncoRealizadasRows),
        recebimento: calcRecebimento(broncoAgendadasRows),
        conversao_com_consultas: {
          quantidade_contatos_tambem_em_consultas: conv_broncoscopia,
          percentual_sobre_base_de_consultas: conv_broncoscopia_pct,
        },
        etapas_do_funil: toCountDistribution(
          groupCount(broncoRows, (row) => getDimensionLabel(row.etapa_no_crm)),
          broncoRows.length
        ),
        broncoscopias_por_tipo_paciente: toCountDistribution(
          groupCount(broncoAgendadasRows, (row) =>
            getDimensionLabel(row.tipo_paciente)
          ),
          bronco_total
        ),
        broncoscopias_por_quantidade_codigos: toCountDistribution(
          groupCount(broncoAgendadasRows, (row) =>
            getDimensionLabel(row.quantidade_codigos)
          ),
          bronco_total
        ),
        faturamento_por_modalidade_pagamento: toRevenueDistribution(
          groupRevenue(broncoRealizadasRows, (row) =>
            getDimensionLabel(row.modalidade_pagamento)
          ),
          fat_bronco
        ),
        broncoscopias_por_origem: toCountDistribution(
          groupCount(broncoAgendadasRows, getOrigem),
          bronco_total
        ),
        faturamento_por_origem: toRevenueDistribution(
          groupRevenue(broncoRealizadasRows, getOrigem),
          fat_bronco
        ),
      },
      procedimentos_cirurgicos: {
        nome_funil: "Procedimentos cirurgicos",
        cards_no_periodo: cirurgiaRows.length,
        quantidade_procedimentos_fechados: cirurgia_agendados,
        valor_fechado_reais: cirurgia_fechados_valor,
        quantidade_realizada: cirurgia_realizados,
        quantidade_no_show_consulta: cirurgia_no_show,
        quantidade_no_show_retorno: cirurgia_no_show_retorno,
        taxa_realizacao: calcShare(cirurgia_realizados, cirurgia_agendados),
        taxa_no_show_consulta: cirurgia_no_show_pct,
        taxa_no_show_retorno: cirurgia_no_show_retorno_pct,
        faturamento_bruto_reais: fat_cirurgia,
        valor_liquido_reais: vliq_cirurgia,
        custo_total_reais: custo_cirurgia_total,
        margem_bruta_reais: fat_cirurgia - custo_cirurgia_total,
        ticket_medio_reais: calcTicketMedio(cirurgiaRealizadasRows),
        recebimento: calcRecebimento(cirurgiaAgendadasRows),
        etapas_do_funil: toCountDistribution(
          groupCount(cirurgiaRows, (row) => getDimensionLabel(row.etapa_no_crm)),
          cirurgiaRows.length
        ),
        faturamento_por_tipo_paciente: groupRevenue(
          cirurgiaRealizadasRows,
          (row) => getDimensionLabel(row.tipo_paciente)
        ).map((item) => ({
          nome: item.name,
          chave: normalizeAnalyticsKey(item.name),
          quantidade: item.qtd,
          faturamento_reais: item.faturamento,
          valor_liquido_reais: cirurgiaRealizadasRows
            .filter((row) => getDimensionLabel(row.tipo_paciente) === item.name)
            .reduce((sum, row) => sum + getCirurgiaValorLiquido(row), 0),
          percentual_do_faturamento_total: calcShare(item.faturamento, fat_cirurgia),
        })),
        faturamento_por_modalidade_pagamento: toRevenueDistribution(
          groupRevenue(cirurgiaRealizadasRows, (row) =>
            getDimensionLabel(row.modalidade_pagamento)
          ),
          fat_cirurgia
        ),
        procedimentos_por_origem: toCountDistribution(
          groupCount(cirurgiaAgendadasRows, getOrigem),
          cirurgia_agendados
        ),
        faturamento_por_origem: toRevenueDistribution(
          groupRevenue(cirurgiaRealizadasRows, getOrigem),
          fat_cirurgia
        ),
        custos_por_categoria: toCountDistribution(
          [
            { name: "Hospital", value: cirurgiaCostTotals.hospital },
            { name: "Anestesia", value: cirurgiaCostTotals.anestesia },
            { name: "Comissao", value: cirurgiaCostTotals.comissao },
            { name: "Impostos", value: cirurgiaCostTotals.impostos },
            { name: "Instrumentacao", value: cirurgiaCostTotals.instrumentacao },
          ].filter((item) => item.value > 0),
          custo_cirurgia_total
        ).map((item) => ({
          categoria: item.nome,
          chave: item.chave,
          custo_reais: item.quantidade,
          percentual_do_custo_total: item.percentual_do_total,
        })),
      },
    },
    perdas: {
      motivos_de_perda_consolidados: toCountDistribution(
        motivos_perda,
        perdas_diagnostico.total
      ),
      perdas_por_origem: toCountDistribution(
        perdas_por_origem,
        perdas_diagnostico.total
      ),
      diagnostico: {
        perdas_total: perdas_diagnostico.total,
        perdas_sem_motivo_mapeado: perdas_diagnostico.unmapped,
        perdas_sem_motivo_mapeado_percentual: perdas_diagnostico.unmappedPct,
        perdas_sem_retorno: perdas_diagnostico.semRetorno,
        perdas_sem_retorno_percentual: perdas_diagnostico.semRetornoPct,
      },
    },
    consolidado: {
      faturamento_por_funil: faturamentoPorFunil,
      volume_por_funil: volumePorFunil,
      contatos_de_consultas_em_outros_funis: cross_funnel.map((item) => ({
        funil: item.name,
        chave: normalizeAnalyticsKey(item.name),
        quantidade_contatos: item.value,
        percentual_sobre_base_de_consultas: item.share,
      })),
      ranking_responsaveis: ranking_responsaveis.map((item) => ({
        responsavel: item.name,
        quantidade_realizada: item.realizados,
        faturamento_reais: item.faturamento,
      })),
    },
    privacidade: {
      contem_registros_nominais: false,
      observacao:
        "Este JSON contem somente metricas agregadas e distribuicoes. Nomes de pacientes e registros individuais nao sao exportados.",
    },
  };

  const buildRecords = (
    rows: RowBase[],
    funnel: string,
    onlyRealizadas: boolean
  ): FunnelStageDrilldownRecord[] =>
    rows
      .filter((row) =>
        onlyRealizadas
          ? (() => {
              const stage = normalizeStage(row.etapa_no_crm);
              if (funnel === "Consultas") return ETAPAS_REALIZADAS_CONSULTA.has(stage);
              if (funnel === "Espirometria") return ETAPAS_REALIZADAS_ESPIRO.has(stage);
              if (funnel === "Broncoscopia") return ETAPAS_REALIZADAS_BRONCO.has(stage);
              return ETAPAS_REALIZADAS_CIRURGIA.has(stage);
            })()
          : !ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(row.etapa_no_crm))
      )
      .sort((a, b) => (b.data_agendamento ?? "").localeCompare(a.data_agendamento ?? ""))
      .map((row) => ({
        id: `${funnel}-${onlyRealizadas ? "realizadas" : "agendadas"}-${row.id}`,
        nome: row.nome_contato ?? "—",
        etapa: row.etapa_no_crm ?? "Não definido",
        dataAgendamento: row.data_agendamento ?? "—",
        responsavel: (row.responsavel ?? "").trim() || "Não definido",
        valor: getValorFaturavel(row),
        dataReferencia: getRowDateByMode(row, tipoData),
        detalhes: [
          funnel,
          ...(isRetornoSemCobranca(row.forma_pagamento) ? [RETORNO_AGENDA_TAG] : []),
        ],
        meta: {
          funil: funnel,
          base: onlyRealizadas ? "realizadas" : "agendadas",
          semCobranca: isRetornoSemCobranca(row.forma_pagamento),
        },
      }));

  const registros_funis = [
    ...buildRecords(consultaRows, "Consultas", false),
    ...buildRecords(consultaRows, "Consultas", true),
    ...buildRecords(espiroRows, "Espirometria", false),
    ...buildRecords(espiroRows, "Espirometria", true),
    ...buildRecords(broncoRows, "Broncoscopia", false),
    ...buildRecords(broncoRows, "Broncoscopia", true),
    ...buildRecords(cirurgiaRows, "Cirurgia", false),
    ...buildRecords(cirurgiaRows, "Cirurgia", true),
  ];

  return {
    leads_novos,
    consultas_agendadas,
    consultas_realizadas,
    consultas_no_show,
    consultas_no_show_retorno,
    consultas_no_show_pct,
    consultas_no_show_retorno_pct,
    fat_consultas,
    espiro_total,
    espiro_realizadas,
    espiro_no_show,
    fat_espiro,
    bronco_total,
    bronco_realizadas,
    bronco_no_show,
    bronco_no_show_retorno,
    fat_bronco,
    exames_realizados,
    cirurgia_agendados,
    cirurgia_realizados,
    cirurgia_no_show,
    cirurgia_no_show_retorno,
    cirurgia_no_show_pct,
    cirurgia_no_show_retorno_pct,
    fat_cirurgia,
    vliq_cirurgia,
    cirurgia_fechados_valor,
    fat_total,
    prazo_medio_geral,
    consulta_base_contatos,
    conv_espirometria,
    conv_espirometria_pct,
    conv_broncoscopia,
    conv_broncoscopia_pct,
    conv_cirurgia,
    conv_cirurgia_pct,
    total_agendadas,
    total_realizadas,
    taxa_realizacao_global,
    ranking_responsaveis,
    fat_por_funil,
    volume_por_funil,
    cross_funnel,
    motivos_perda,
    perdas_diagnostico,
    perdas_por_origem,
    evolucao_total,
    evolucao_por_funil,
    registros_funis,
    analise_export,
  };
}

export function useVisaoGeralData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, atalho, tipoData, responsavel, somenteAnuncios } = filters;
  const previousRange = useMemo(
    () => getPreviousPeriodRange(dataInicio, dataFim),
    [dataFim, dataInicio]
  );

  const { data: allContatos = [], isLoading: loadingContatos } = useQuery({
    queryKey: ["vg_contatos_all_v2"],
    queryFn: fetchAllContatos,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allConsultaRows = [], isLoading: loadingConsultas } = useQuery({
    queryKey: ["vg_consultas_all_v5"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select(
          "id, nome_contato, key, responsavel, etapa_no_crm, tipo_consulta, modalidade_pagamento, valor_atribuido, forma_pagamento, tag_id_card, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as unknown as ConsultaRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEspiroRows = [], isLoading: loadingEspiro } = useQuery({
    queryKey: ["vg_espirometria_all_v5"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("espirometria")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, modalidade_pagamento, valor_atribuido, forma_pagamento, tag_id_card, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as ExameRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allBroncoRows = [], isLoading: loadingBronco } = useQuery({
    queryKey: ["vg_broncoscopia_all_v5"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broncoscopia")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, tipo_paciente, modalidade_pagamento, quantidade_codigos, valor_atribuido, forma_pagamento, tag_id_card, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as ExameRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCirurgiaRows = [], isLoading: loadingCirurgia } = useQuery({
    queryKey: ["vg_cirurgia_all_v6"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedimentos_cirurgicos")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, tipo_paciente, modalidade_pagamento, valor_atribuido, forma_pagamento, tag_id_card, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id, custo_anestesia, " +
            "custo_comissao, custo_hospital, custo_instrumentacao, impostos"
        );

      if (error) throw error;
      return (data ?? []) as CirurgiaRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const contatoOrigemMap = useMemo(
    () => new Map(allContatos.map((contato) => [contato.contato_id, contato])),
    [allContatos]
  );

  const isLoading =
    loadingContatos ||
    loadingConsultas ||
    loadingEspiro ||
    loadingBronco ||
    loadingCirurgia;

  const metrics = useMemo(() => {
    const filterContatosByPeriod = (start: Date, end: Date) =>
      allContatos.filter(
        (contato) =>
          isInDateRange(contato.criado_em, start, end) &&
          matchesSomenteAnunciosFilter(
            contato.contato_id,
            contatoOrigemMap,
            somenteAnuncios
          )
      );

    const filterRowsByPeriod = <T extends RowBase>(rows: T[], start: Date, end: Date) =>
      rows.filter(
        (row) =>
          isRowInDateModeRange(row, start, end, tipoData) &&
          matchesGlobalCardFilters(row, { responsavel }) &&
          matchesSomenteAnunciosFilter(
            row.contato_id,
            contatoOrigemMap,
            somenteAnuncios
          )
      );

    const current = buildVisaoGeralMetrics(
      filterContatosByPeriod(dataInicio, dataFim),
      filterRowsByPeriod(allConsultaRows, dataInicio, dataFim),
      filterRowsByPeriod(allEspiroRows, dataInicio, dataFim),
      filterRowsByPeriod(allBroncoRows, dataInicio, dataFim),
      filterRowsByPeriod(allCirurgiaRows, dataInicio, dataFim),
      dataInicio,
      dataFim,
      tipoData,
      contatoOrigemMap
    );

    const previous = buildVisaoGeralMetrics(
      filterContatosByPeriod(previousRange.dataInicio, previousRange.dataFim),
      filterRowsByPeriod(
        allConsultaRows,
        previousRange.dataInicio,
        previousRange.dataFim
      ),
      filterRowsByPeriod(allEspiroRows, previousRange.dataInicio, previousRange.dataFim),
      filterRowsByPeriod(allBroncoRows, previousRange.dataInicio, previousRange.dataFim),
      filterRowsByPeriod(
        allCirurgiaRows,
        previousRange.dataInicio,
        previousRange.dataFim
      ),
      previousRange.dataInicio,
      previousRange.dataFim,
      tipoData,
      contatoOrigemMap
    );

    const comparisons = {
      kpis: buildMetricComparisons(
        {
          leads_novos: current.leads_novos,
          consultas_agendadas: current.consultas_agendadas,
          consultas_realizadas: current.consultas_realizadas,
          consultas_no_show: current.consultas_no_show,
          consultas_no_show_pct: current.consultas_no_show_pct,
          fat_consultas: current.fat_consultas,
          espiro_total: current.espiro_total,
          espiro_realizadas: current.espiro_realizadas,
          bronco_total: current.bronco_total,
          bronco_realizadas: current.bronco_realizadas,
          fat_espiro: current.fat_espiro,
          fat_bronco: current.fat_bronco,
          cirurgia_agendados: current.cirurgia_agendados,
          cirurgia_realizados: current.cirurgia_realizados,
          cirurgia_no_show: current.cirurgia_no_show,
          cirurgia_no_show_retorno: current.cirurgia_no_show_retorno,
          fat_cirurgia: current.fat_cirurgia,
          vliq_cirurgia: current.vliq_cirurgia,
          conv_espirometria: current.conv_espirometria,
          conv_broncoscopia: current.conv_broncoscopia,
          conv_cirurgia: current.conv_cirurgia,
          fat_total: current.fat_total,
          prazo_medio_geral: current.prazo_medio_geral,
          perdas_sem_motivo_pct: current.perdas_diagnostico.unmappedPct,
          perdas_sem_retorno_pct: current.perdas_diagnostico.semRetornoPct,
          exames_realizados: current.exames_realizados,
          taxa_realizacao_global: current.taxa_realizacao_global,
        },
        {
          leads_novos: previous.leads_novos,
          consultas_agendadas: previous.consultas_agendadas,
          consultas_realizadas: previous.consultas_realizadas,
          consultas_no_show: previous.consultas_no_show,
          consultas_no_show_pct: previous.consultas_no_show_pct,
          fat_consultas: previous.fat_consultas,
          espiro_total: previous.espiro_total,
          espiro_realizadas: previous.espiro_realizadas,
          bronco_total: previous.bronco_total,
          bronco_realizadas: previous.bronco_realizadas,
          fat_espiro: previous.fat_espiro,
          fat_bronco: previous.fat_bronco,
          cirurgia_agendados: previous.cirurgia_agendados,
          cirurgia_realizados: previous.cirurgia_realizados,
          cirurgia_no_show: previous.cirurgia_no_show,
          cirurgia_no_show_retorno: previous.cirurgia_no_show_retorno,
          fat_cirurgia: previous.fat_cirurgia,
          vliq_cirurgia: previous.vliq_cirurgia,
          conv_espirometria: previous.conv_espirometria,
          conv_broncoscopia: previous.conv_broncoscopia,
          conv_cirurgia: previous.conv_cirurgia,
          fat_total: previous.fat_total,
          prazo_medio_geral: previous.prazo_medio_geral,
          perdas_sem_motivo_pct: previous.perdas_diagnostico.unmappedPct,
          perdas_sem_retorno_pct: previous.perdas_diagnostico.semRetornoPct,
          exames_realizados: previous.exames_realizados,
          taxa_realizacao_global: previous.taxa_realizacao_global,
        }
      ),
      charts: {
        presenca_por_funil: buildMetricComparison(
          current.total_realizadas,
          previous.total_realizadas
        ),
        cross_funnel: buildMetricComparison(
          sumByNumberKey(current.cross_funnel, "value"),
          sumByNumberKey(previous.cross_funnel, "value")
        ),
        motivos_perda: buildMetricComparison(
          sumByNumberKey(current.motivos_perda, "value"),
          sumByNumberKey(previous.motivos_perda, "value")
        ),
        perdas_por_origem: buildMetricComparison(
          sumByNumberKey(current.perdas_por_origem, "value"),
          sumByNumberKey(previous.perdas_por_origem, "value")
        ),
        fat_por_funil: buildMetricComparison(
          sumByNumberKey(current.fat_por_funil, "value"),
          sumByNumberKey(previous.fat_por_funil, "value")
        ),
        volume_por_funil: buildMetricComparison(
          sumByNumberKey(current.volume_por_funil, "total"),
          sumByNumberKey(previous.volume_por_funil, "total")
        ),
        evolucao_total: buildMetricComparison(
          sumByNumberKey(current.evolucao_total, "value"),
          sumByNumberKey(previous.evolucao_total, "value")
        ),
        evolucao_por_funil: buildMetricComparison(
          current.fat_total,
          previous.fat_total
        ),
        ranking_responsaveis: buildMetricComparison(
          sumByNumberKey(current.ranking_responsaveis, "faturamento"),
          sumByNumberKey(previous.ranking_responsaveis, "faturamento")
        ),
      },
    };

    const comparacao_com_periodo_anterior = {
      indicadores_principais: [
        toComparisonValue("Leads novos", "quantidade", comparisons.kpis.leads_novos),
        toComparisonValue(
          "Faturamento total",
          "reais",
          comparisons.kpis.fat_total
        ),
        toComparisonValue(
          "Taxa de realizacao global",
          "percentual",
          comparisons.kpis.taxa_realizacao_global
        ),
        toComparisonValue(
          "Prazo medio de recebimento",
          "dias",
          comparisons.kpis.prazo_medio_geral
        ),
        toComparisonValue(
          "Exames realizados",
          "quantidade",
          comparisons.kpis.exames_realizados
        ),
      ],
      por_funil: [
        toComparisonValue(
          "Consultas agendadas",
          "quantidade",
          comparisons.kpis.consultas_agendadas
        ),
        toComparisonValue(
          "Consultas realizadas",
          "quantidade",
          comparisons.kpis.consultas_realizadas
        ),
        toComparisonValue(
          "Faturamento de consultas",
          "reais",
          comparisons.kpis.fat_consultas
        ),
        toComparisonValue(
          "Espirometrias agendadas",
          "quantidade",
          comparisons.kpis.espiro_total
        ),
        toComparisonValue(
          "Espirometrias realizadas",
          "quantidade",
          comparisons.kpis.espiro_realizadas
        ),
        toComparisonValue(
          "Faturamento de espirometria",
          "reais",
          comparisons.kpis.fat_espiro
        ),
        toComparisonValue(
          "Broncoscopias agendadas",
          "quantidade",
          comparisons.kpis.bronco_total
        ),
        toComparisonValue(
          "Broncoscopias realizadas",
          "quantidade",
          comparisons.kpis.bronco_realizadas
        ),
        toComparisonValue(
          "Faturamento de broncoscopia",
          "reais",
          comparisons.kpis.fat_bronco
        ),
        toComparisonValue(
          "Procedimentos cirurgicos fechados",
          "quantidade",
          comparisons.kpis.cirurgia_agendados
        ),
        toComparisonValue(
          "Procedimentos cirurgicos realizados",
          "quantidade",
          comparisons.kpis.cirurgia_realizados
        ),
        toComparisonValue(
          "Faturamento de procedimentos cirurgicos",
          "reais",
          comparisons.kpis.fat_cirurgia
        ),
      ],
      perdas: [
        toComparisonValue(
          "Perdas sem motivo mapeado",
          "percentual",
          comparisons.kpis.perdas_sem_motivo_pct
        ),
        toComparisonValue(
          "Perdas sem retorno",
          "percentual",
          comparisons.kpis.perdas_sem_retorno_pct
        ),
      ],
      graficos_consolidados: [
        toComparisonValue(
          "Volume realizado nos funis",
          "quantidade",
          comparisons.charts.presenca_por_funil
        ),
        toComparisonValue(
          "Contatos de consultas em outros funis",
          "quantidade",
          comparisons.charts.cross_funnel
        ),
        toComparisonValue(
          "Faturamento por funil",
          "reais",
          comparisons.charts.fat_por_funil
        ),
        toComparisonValue(
          "Volume agendado por funil",
          "quantidade",
          comparisons.charts.volume_por_funil
        ),
      ],
    };

    const exportacao_metricas = {
      tipo_de_arquivo: "metricas_agregadas_para_analise_por_ia",
      versao_do_schema: "dashboard_crm_medico_visao_geral_v2",
      como_uma_ia_deve_usar_este_json: {
        instrucao:
          "Use primeiro respostas_diretas para perguntas objetivas. Use faturamento, leads_e_origens, funis e perdas para explicar causas, distribuicoes e comparacoes.",
        exemplo_pergunta_faturamento:
          "Para responder 'qual meu faturamento?', use respostas_diretas.faturamento_total_reais.",
        exemplo_pergunta_leads_anuncio:
          "Para responder 'quantos leads chegaram por anuncio?', use respostas_diretas.leads_por_anuncio.quantidade_leads.",
      },
      contexto_do_periodo_e_filtros: {
        periodo_analisado: {
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
          atalho,
        },
        periodo_anterior_para_comparacao: {
          data_inicio: previousRange.dataInicio.toISOString(),
          data_fim: previousRange.dataFim.toISOString(),
        },
        filtros_aplicados: {
          tipo_data_usada_nos_funis: tipoData,
          responsavel: responsavel || null,
          somente_contatos_de_anuncio: somenteAnuncios,
        },
        regras_calculo_importantes: {
          leads_novos:
            "Contatos criados no periodo. Respeita o filtro de anuncios, mas nao o filtro de responsavel porque contato nao possui responsavel direto.",
          funis:
            "Cards filtrados pelo periodo, tipo de data, responsavel e filtro de anuncios.",
          faturamento:
            "Soma valor_atribuido somente dos cards considerados realizados. Retorno sem cobranca entra como zero.",
          procedimentos_cirurgicos_fechados:
            "Procedimentos fora das etapas captacao, negociacao e perdido.",
          privacidade:
            "O JSON contem metricas agregadas e distribuicoes, sem nomes de pacientes.",
        },
      },
      ...current.analise_export,
      comparacao_com_periodo_anterior,
    };

    return {
      ...current,
      comparisons,
      exportacao_metricas,
    };
  }, [
    allBroncoRows,
    allCirurgiaRows,
    allConsultaRows,
    allContatos,
    allEspiroRows,
    atalho,
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
