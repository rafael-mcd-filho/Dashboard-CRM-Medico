import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
  subWeeks,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  getResponsavelOptions,
  SEM_RESPONSAVEL_VALUE,
} from "@/lib/cardFilters";
import {
  getRowDateByMode,
  type DashboardDateMode,
} from "@/lib/dateMode";
import { isInDateRange, parseBRDate } from "@/lib/parse";

export type TipoData = DashboardDateMode;

export type AtalhosPeriodo =
  | "hoje"
  | "esta_semana"
  | "semana_anterior"
  | "este_mes"
  | "mes_anterior"
  | "este_ano"
  | "todo_periodo"
  | "customizado";

export interface FiltersState {
  dataInicio: Date;
  dataFim: Date;
  atalho: AtalhosPeriodo;
  tipoData: TipoData;
  responsavel: string;
  somenteAnuncios: boolean;
}

interface FiltersContextValue {
  filters: FiltersState;
  setFilters: (partial: Partial<FiltersState>) => void;
  setAtalho: (atalho: AtalhosPeriodo) => void;
  responsavelOptions: string[];
  optionsLoading: boolean;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

type FilterOptionRow = {
  responsavel: string | null;
  etapa_no_crm: string | null;
  data_criacao_card: string | null;
  data_agendamento: string | null;
};

function buildAllPeriodRange(dateValues: string[]) {
  const parsedDates = dateValues
    .map((value) => parseBRDate(value))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (parsedDates.length === 0) return null;

  return {
    start: startOfDay(parsedDates[0]),
    end: endOfDay(parsedDates[parsedDates.length - 1]),
  };
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [filters, setFiltersState] = useState<FiltersState>({
    dataInicio: startOfMonth(now),
    dataFim: endOfMonth(now),
    atalho: "este_mes",
    tipoData: "criacao",
    responsavel: "",
    somenteAnuncios: false,
  });

  const { data, isLoading: optionsLoading } = useQuery({
    queryKey: ["global-filter-options"],
    queryFn: async () => {
      const [
        consultas,
        broncoscopia,
        espirometria,
        procedimentos,
        contatoMaisAntigo,
        contatoMaisRecente,
      ] =
        await Promise.all([
          supabase
            .from("consultas")
            .select("responsavel, etapa_no_crm, data_criacao_card, data_agendamento"),
          supabase
            .from("broncoscopia")
            .select("responsavel, etapa_no_crm, data_criacao_card, data_agendamento"),
          supabase
            .from("espirometria")
            .select("responsavel, etapa_no_crm, data_criacao_card, data_agendamento"),
          supabase
            .from("procedimentos_cirurgicos")
            .select("responsavel, etapa_no_crm, data_criacao_card, data_agendamento"),
          supabase
            .from("contatos")
            .select("criado_em")
            .not("criado_em", "is", null)
            .order("criado_em", { ascending: true })
            .limit(1),
          supabase
            .from("contatos")
            .select("criado_em")
            .not("criado_em", "is", null)
            .order("criado_em", { ascending: false })
            .limit(1),
        ]);

      const error =
        consultas.error ??
        broncoscopia.error ??
        espirometria.error ??
        procedimentos.error ??
        contatoMaisAntigo.error ??
        contatoMaisRecente.error;

      if (error) throw error;

      return {
        filterRows: [
          ...((consultas.data ?? []) as FilterOptionRow[]),
          ...((broncoscopia.data ?? []) as FilterOptionRow[]),
          ...((espirometria.data ?? []) as FilterOptionRow[]),
          ...((procedimentos.data ?? []) as FilterOptionRow[]),
        ],
        contactDateValues: [
          contatoMaisAntigo.data?.[0]?.criado_em ?? null,
          contatoMaisRecente.data?.[0]?.criado_em ?? null,
        ].filter((value): value is string => Boolean(value)),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const filterRows = data?.filterRows ?? [];
  const contactDateValues = data?.contactDateValues ?? [];

  const allPeriodRange = useMemo(() => {
    const dateValues = [
      ...filterRows.flatMap((row) => [
        row.data_criacao_card ?? "",
        row.data_agendamento ?? "",
      ]),
      ...contactDateValues,
    ].filter(Boolean);

    return buildAllPeriodRange(dateValues);
  }, [contactDateValues, filterRows]);

  const filterRowsInRange = useMemo(
    () =>
      filterRows.filter((row) =>
        isInDateRange(
          getRowDateByMode(row, filters.tipoData),
          filters.dataInicio,
          filters.dataFim
        )
      ),
    [filterRows, filters.dataInicio, filters.dataFim, filters.tipoData]
  );

  const responsavelOptions = useMemo(() => {
    const options = getResponsavelOptions(filterRowsInRange);
    if (
      filters.responsavel &&
      filters.responsavel !== SEM_RESPONSAVEL_VALUE &&
      !options.includes(filters.responsavel)
    ) {
      return [filters.responsavel, ...options];
    }
    return options;
  }, [filterRowsInRange, filters.responsavel]);

  useEffect(() => {
    if (filters.atalho !== "todo_periodo" || !allPeriodRange) return;

    const currentStart = startOfDay(filters.dataInicio).getTime();
    const currentEnd = endOfDay(filters.dataFim).getTime();
    const targetStart = allPeriodRange.start.getTime();
    const targetEnd = allPeriodRange.end.getTime();

    if (currentStart === targetStart && currentEnd === targetEnd) return;

    setFiltersState((prev) => ({
      ...prev,
      dataInicio: allPeriodRange.start,
      dataFim: allPeriodRange.end,
    }));
  }, [allPeriodRange, filters.atalho, filters.dataFim, filters.dataInicio]);

  function setFilters(partial: Partial<FiltersState>) {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }

  function setAtalho(atalho: AtalhosPeriodo) {
    const today = new Date();
    let dataInicio = filters.dataInicio;
    let dataFim = filters.dataFim;

    switch (atalho) {
      case "hoje":
        dataInicio = startOfDay(today);
        dataFim = endOfDay(today);
        break;
      case "esta_semana":
        dataInicio = startOfWeek(today, { weekStartsOn: 1 });
        dataFim = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "semana_anterior": {
        const reference = subWeeks(today, 1);
        dataInicio = startOfWeek(reference, { weekStartsOn: 1 });
        dataFim = endOfWeek(reference, { weekStartsOn: 1 });
        break;
      }
      case "este_mes":
        dataInicio = startOfMonth(today);
        dataFim = endOfMonth(today);
        break;
      case "mes_anterior": {
        const reference = subMonths(today, 1);
        dataInicio = startOfMonth(reference);
        dataFim = endOfMonth(reference);
        break;
      }
      case "este_ano":
        dataInicio = startOfYear(today);
        dataFim = endOfYear(today);
        break;
      case "todo_periodo":
        if (!allPeriodRange) {
          setFiltersState((prev) => ({ ...prev, atalho }));
          return;
        }
        dataInicio = allPeriodRange.start;
        dataFim = allPeriodRange.end;
        break;
      case "customizado":
        setFiltersState((prev) => ({ ...prev, atalho }));
        return;
      default:
        return;
    }

    setFiltersState((prev) => ({ ...prev, atalho, dataInicio, dataFim }));
  }

  return (
    <FiltersContext.Provider
      value={{
        filters,
        setFilters,
        setAtalho,
        responsavelOptions,
        optionsLoading,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters deve ser usado dentro de FiltersProvider");
  }
  return ctx;
}
