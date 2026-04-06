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
import { matchesSomenteAnunciosFilter } from "@/lib/contactOrigins";
import {
  getRowDateByMode,
  isRowInDateModeRange,
  type DashboardDateMode,
} from "@/lib/dateMode";
import { buildEvolucao } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
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
  valor_atribuido: string | null;
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
  const pagos = rows.filter((row) => Boolean(row.data_pagamento));
  const diffs = pagos
    .map((row) => calcDiffDias(row.data_pagamento, row.data_agendamento))
    .filter((diff): diff is number => diff !== null && diff >= 0);

  return diffs.length > 0
    ? diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length
    : 0;
}

function getPaidCount(rows: RowBase[]) {
  return rows.filter((row) => Boolean(row.data_pagamento)).length;
}

function getCirurgiaCost(row: CirurgiaRow) {
  return (
    parseMonetary(row.custo_anestesia) +
    parseMonetary(row.custo_comissao) +
    parseMonetary(row.custo_hospital) +
    parseMonetary(row.custo_instrumentacao) +
    parseMonetary(row.impostos)
  );
}

function getCirurgiaValorLiquido(row: CirurgiaRow) {
  return parseMonetary(row.valor_atribuido) - getCirurgiaCost(row);
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
  tipoData: DashboardDateMode
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
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const espiro_total = espiroAgendadasRows.length;
  const espiro_realizadas = espiroRealizadasRows.length;
  const espiro_no_show = espiroNoShowRows.length;
  const fat_espiro = espiroRealizadasRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
    0
  );

  const bronco_total = broncoAgendadasRows.length;
  const bronco_realizadas = broncoRealizadasRows.length;
  const bronco_no_show = broncoNoShowRows.length;
  const bronco_no_show_retorno = broncoNoShowRetornoRows.length;
  const fat_bronco = broncoRealizadasRows.reduce(
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
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
    (sum, row) => sum + parseMonetary(row.valor_atribuido),
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
  const addToRank = (rows: typeof consultasRealizadasRows) => {
    rows.forEach((row) => {
      const resp = (row.responsavel ?? "").trim() || "Não definido";
      if (!respRankMap[resp]) respRankMap[resp] = { realizados: 0, faturamento: 0 };
      respRankMap[resp].realizados += 1;
      respRankMap[resp].faturamento += parseMonetary(row.valor_atribuido);
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
        valor: parseMonetary(row.valor_atribuido),
        dataReferencia: getRowDateByMode(row, tipoData),
        detalhes: [funnel],
        meta: {
          funil: funnel,
          base: onlyRealizadas ? "realizadas" : "agendadas",
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
    evolucao_total,
    evolucao_por_funil,
    registros_funis,
  };
}

export function useVisaoGeralData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, tipoData, responsavel, somenteAnuncios } = filters;
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
    queryKey: ["vg_consultas_all_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select(
          "id, nome_contato, key, responsavel, etapa_no_crm, valor_atribuido, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as unknown as ConsultaRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEspiroRows = [], isLoading: loadingEspiro } = useQuery({
    queryKey: ["vg_espirometria_all_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("espirometria")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, valor_atribuido, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as ExameRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allBroncoRows = [], isLoading: loadingBronco } = useQuery({
    queryKey: ["vg_broncoscopia_all_v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broncoscopia")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, valor_atribuido, data_criacao_card, " +
            "data_pagamento, data_agendamento, contato_id"
        );

      if (error) throw error;
      return (data ?? []) as ExameRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCirurgiaRows = [], isLoading: loadingCirurgia } = useQuery({
    queryKey: ["vg_cirurgia_all_v3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedimentos_cirurgicos")
        .select(
          "id, nome_contato, responsavel, etapa_no_crm, valor_atribuido, data_criacao_card, " +
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
      tipoData
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
      tipoData
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

    return {
      ...current,
      comparisons,
    };
  }, [
    allBroncoRows,
    allCirurgiaRows,
    allConsultaRows,
    allContatos,
    allEspiroRows,
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
