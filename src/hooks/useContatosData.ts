import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfWeek,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useFilters } from "@/contexts/FiltersContext";
import { matchesGlobalCardFilters } from "@/lib/cardFilters";
import {
  getContatoOrigemAgrupada,
  isContatoOrigemAnuncio,
  parseTags,
} from "@/lib/contactOrigins";
import {
  buildMetricComparison,
  buildMetricComparisons,
  getPreviousPeriodRange,
  sumByNumberKey,
} from "@/lib/comparison";
import { isInDateRange, parseBRDate } from "@/lib/parse";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";

type ContatoRow = {
  contato_id: string;
  nome: string | null;
  tags: string | null;
  origem_contato: string | null;
  criado_em: string | null;
};

type CardRow = {
  contato_id: string | null;
  data_criacao_card: string | null;
  responsavel: string | null;
  etapa_no_crm: string | null;
};

const PAGE_SIZE = 1000;

function buildEvolucao(contatos: ContatoRow[], dataInicio: Date, dataFim: Date) {
  const diff = differenceInDays(dataFim, dataInicio);

  if (diff <= 62) {
    const map: Record<string, number> = {};

    contatos.forEach((contato) => {
      const date = parseBRDate(contato.criado_em);
      if (!date) return;

      const key = format(date, "yyyy-MM-dd");
      map[key] = (map[key] ?? 0) + 1;
    });

    return eachDayOfInterval({ start: dataInicio, end: dataFim }).map((date) => ({
      date: format(date, "dd/MM"),
      value: map[format(date, "yyyy-MM-dd")] ?? 0,
    }));
  }

  if (diff <= 180) {
    const map: Record<string, number> = {};

    contatos.forEach((contato) => {
      const date = parseBRDate(contato.criado_em);
      if (!date) return;

      const key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
      map[key] = (map[key] ?? 0) + 1;
    });

    return eachWeekOfInterval(
      { start: dataInicio, end: dataFim },
      { weekStartsOn: 1 }
    ).map((week) => ({
      date: format(week, "dd/MM"),
      value: map[format(week, "yyyy-MM-dd")] ?? 0,
    }));
  }

  const map: Record<string, number> = {};

  contatos.forEach((contato) => {
    const date = parseBRDate(contato.criado_em);
    if (!date) return;

    const key = format(date, "yyyy-MM");
    map[key] = (map[key] ?? 0) + 1;
  });

  return eachMonthOfInterval({ start: dataInicio, end: dataFim }).map((month) => ({
    date: format(month, "MM/yyyy"),
    value: map[format(month, "yyyy-MM")] ?? 0,
  }));
}

async function fetchAllContatos() {
  const rows: ContatoRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contatos")
      .select("contato_id, nome, tags, origem_contato, criado_em")
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

function buildContatosMetrics(
  contatos: ContatoRow[],
  consultasCards: CardRow[],
  broncoCards: CardRow[],
  espiroCards: CardRow[],
  procCards: CardRow[],
  dataInicio: Date,
  dataFim: Date
) {
  const contatoIds = new Set(contatos.map((contato) => contato.contato_id));

  const consultasCids = new Set(
    consultasCards
      .map((row) => row.contato_id)
      .filter((id): id is string => Boolean(id) && contatoIds.has(id))
  );

  const broncoCids = new Set(
    broncoCards
      .map((row) => row.contato_id)
      .filter((id): id is string => Boolean(id) && contatoIds.has(id))
  );

  const espiroCids = new Set(
    espiroCards
      .map((row) => row.contato_id)
      .filter((id): id is string => Boolean(id) && contatoIds.has(id))
  );

  const procCids = new Set(
    procCards
      .map((row) => row.contato_id)
      .filter((id): id is string => Boolean(id) && contatoIds.has(id))
  );

  const leads_novos = contatos.length;

  const multiFunilIds = contatos
    .map((contato) => contato.contato_id)
    .filter((contatoId) => {
      let count = 0;
      if (consultasCids.has(contatoId)) count += 1;
      if (broncoCids.has(contatoId)) count += 1;
      if (espiroCids.has(contatoId)) count += 1;
      if (procCids.has(contatoId)) count += 1;
      return count >= 2;
    });

  const multiFunilIdsSet = new Set(multiFunilIds);
  const contatos_multi_funil = multiFunilIds.length;

  const multiFilnTable = contatos
    .filter((contato) => multiFunilIdsSet.has(contato.contato_id))
    .map((contato) => ({
      contato_id: contato.contato_id,
      nome: contato.nome ?? contato.contato_id,
      consultas: consultasCids.has(contato.contato_id),
      broncoscopia: broncoCids.has(contato.contato_id),
      espirometria: espiroCids.has(contato.contato_id),
      procedimentos: procCids.has(contato.contato_id),
    }));

  const origemMap: Record<string, number> = {};
  contatos.forEach((contato) => {
    const origem = getContatoOrigemAgrupada(contato);
    origemMap[origem] = (origemMap[origem] ?? 0) + 1;
  });

  const leads_por_origem = Object.entries(origemMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const tagMap: Record<string, number> = {};
  contatos.forEach((contato) => {
    const uniqueTags = [...new Set(parseTags(contato.tags))];

    uniqueTags.forEach((tag) => {
      tagMap[tag] = (tagMap[tag] ?? 0) + 1;
    });
  });

  const leads_por_tag = Object.entries(tagMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const taxa_retencao = leads_novos > 0 ? contatos_multi_funil / leads_novos : 0;

  const evolucao_leads = buildEvolucao(contatos, dataInicio, dataFim);

  const registros: FunnelStageDrilldownRecord[] = contatos
    .slice()
    .sort((a, b) => (b.criado_em ?? "").localeCompare(a.criado_em ?? ""))
    .map((contato) => {
      const origem = getContatoOrigemAgrupada(contato);
      const tags = parseTags(contato.tags);

      return {
        id: contato.contato_id,
        nome: contato.nome ?? contato.contato_id,
        etapa: "Contato",
        dataAgendamento: contato.criado_em ?? "—",
        responsavel: "Não definido",
        valor: 0,
        dataReferencia: contato.criado_em,
        detalhes: [origem, ...tags.slice(0, 4)],
        meta: {
          origem,
          tags: tags.join(" | "),
        },
      };
    });

  return {
    leads_novos,
    contatos_multi_funil,
    taxa_retencao,
    leads_por_origem,
    leads_por_tag,
    evolucao_leads,
    multiFilnTable,
    registros,
  };
}

export function useContatosData() {
  const { filters } = useFilters();
  const { dataInicio, dataFim, responsavel, somenteAnuncios } = filters;
  const previousRange = useMemo(
    () => getPreviousPeriodRange(dataInicio, dataFim),
    [dataFim, dataInicio]
  );

  const { data: allContatos = [], isLoading: loadingContatos } = useQuery({
    queryKey: ["contatos_all_v2"],
    queryFn: fetchAllContatos,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allConsultasCards = [], isLoading: loadingConsultas } = useQuery({
    queryKey: ["consultas_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultas")
        .select("contato_id, data_criacao_card, responsavel, etapa_no_crm");
      if (error) throw error;
      return (data ?? []) as CardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allBroncoCards = [], isLoading: loadingBronco } = useQuery({
    queryKey: ["broncoscopia_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broncoscopia")
        .select("contato_id, data_criacao_card, responsavel, etapa_no_crm");
      if (error) throw error;
      return (data ?? []) as CardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEspiroCards = [], isLoading: loadingEspiro } = useQuery({
    queryKey: ["espirometria_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("espirometria")
        .select("contato_id, data_criacao_card, responsavel, etapa_no_crm");
      if (error) throw error;
      return (data ?? []) as CardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProcCards = [], isLoading: loadingProc } = useQuery({
    queryKey: ["procedimentos_cards_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procedimentos_cirurgicos")
        .select("contato_id, data_criacao_card, responsavel, etapa_no_crm");
      if (error) throw error;
      return (data ?? []) as CardRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    loadingContatos ||
    loadingConsultas ||
    loadingBronco ||
    loadingEspiro ||
    loadingProc;

  const metrics = useMemo(() => {
    const filterContatos = (start: Date, end: Date) =>
      allContatos.filter(
        (contato) =>
          isInDateRange(contato.criado_em, start, end) &&
          (!somenteAnuncios || isContatoOrigemAnuncio(contato))
      );

    const filterCards = (rows: CardRow[], start: Date, end: Date) =>
      rows.filter(
        (row) =>
          isInDateRange(row.data_criacao_card, start, end) &&
          matchesGlobalCardFilters(row, { responsavel })
      );

    const current = buildContatosMetrics(
      filterContatos(dataInicio, dataFim),
      filterCards(allConsultasCards, dataInicio, dataFim),
      filterCards(allBroncoCards, dataInicio, dataFim),
      filterCards(allEspiroCards, dataInicio, dataFim),
      filterCards(allProcCards, dataInicio, dataFim),
      dataInicio,
      dataFim
    );

    const previous = buildContatosMetrics(
      filterContatos(previousRange.dataInicio, previousRange.dataFim),
      filterCards(
        allConsultasCards,
        previousRange.dataInicio,
        previousRange.dataFim
      ),
      filterCards(allBroncoCards, previousRange.dataInicio, previousRange.dataFim),
      filterCards(allEspiroCards, previousRange.dataInicio, previousRange.dataFim),
      filterCards(allProcCards, previousRange.dataInicio, previousRange.dataFim),
      previousRange.dataInicio,
      previousRange.dataFim
    );

    const comparisons = {
      kpis: buildMetricComparisons(
        {
          leads_novos: current.leads_novos,
          contatos_multi_funil: current.contatos_multi_funil,
          taxa_retencao: current.taxa_retencao,
        },
        {
          leads_novos: previous.leads_novos,
          contatos_multi_funil: previous.contatos_multi_funil,
          taxa_retencao: previous.taxa_retencao,
        }
      ),
      charts: {
        evolucao_leads: buildMetricComparison(
          current.leads_novos,
          previous.leads_novos
        ),
        leads_por_origem: buildMetricComparison(
          sumByNumberKey(current.leads_por_origem, "value"),
          sumByNumberKey(previous.leads_por_origem, "value")
        ),
        leads_por_tag: buildMetricComparison(
          sumByNumberKey(current.leads_por_tag, "value"),
          sumByNumberKey(previous.leads_por_tag, "value")
        ),
      },
    };

    return {
      ...current,
      comparisons,
    };
  }, [
    allBroncoCards,
    allConsultasCards,
    allContatos,
    allEspiroCards,
    allProcCards,
    dataFim,
    dataInicio,
    previousRange.dataFim,
    previousRange.dataInicio,
    responsavel,
    somenteAnuncios,
  ]);

  return { isLoading, ...metrics };
}
