import {
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  startOfWeek,
} from "date-fns";
import { getRowDateByMode, type DashboardDateMode } from "@/lib/dateMode";
import { parseBRDate, parseMonetary } from "@/lib/parse";

type RowWithDate = {
  data_criacao_card: string | null;
  data_agendamento?: string | null;
  valor_atribuido: string | null;
};

/**
 * Gera série temporal de faturamento agrupada por dia/semana/mês
 * conforme o tamanho do intervalo. Suporta datas em formato DD/MM/YYYY.
 */
export function buildEvolucao(
  rows: RowWithDate[],
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode = "criacao"
): { date: string; value: number }[] {
  const diff = differenceInDays(dataFim, dataInicio);

  if (diff <= 62) {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const d = parseBRDate(getRowDateByMode(r, tipoData));
      if (!d) return;
      const key = format(d, "yyyy-MM-dd");
      map[key] = (map[key] ?? 0) + parseMonetary(r.valor_atribuido);
    });
    return eachDayOfInterval({ start: dataInicio, end: dataFim }).map((d) => ({
      date: format(d, "dd/MM"),
      value: map[format(d, "yyyy-MM-dd")] ?? 0,
    }));
  }

  if (diff <= 180) {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const d = parseBRDate(getRowDateByMode(r, tipoData));
      if (!d) return;
      const key = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      map[key] = (map[key] ?? 0) + parseMonetary(r.valor_atribuido);
    });
    return eachWeekOfInterval(
      { start: dataInicio, end: dataFim },
      { weekStartsOn: 1 }
    ).map((w) => ({
      date: format(w, "dd/MM"),
      value: map[format(w, "yyyy-MM-dd")] ?? 0,
    }));
  }

  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const d = parseBRDate(getRowDateByMode(r, tipoData));
    if (!d) return;
    const key = format(d, "yyyy-MM");
    map[key] = (map[key] ?? 0) + parseMonetary(r.valor_atribuido);
  });
  return eachMonthOfInterval({ start: dataInicio, end: dataFim }).map((m) => ({
    date: format(m, "MM/yyyy"),
    value: map[format(m, "yyyy-MM")] ?? 0,
  }));
}

export function getEvolucaoBucketLabel(
  dateValue: string | null | undefined,
  dataInicio: Date,
  dataFim: Date
) {
  const date = parseBRDate(dateValue);
  if (!date) return null;

  const diff = differenceInDays(dataFim, dataInicio);

  if (diff <= 62) {
    return format(date, "dd/MM");
  }

  if (diff <= 180) {
    return format(startOfWeek(date, { weekStartsOn: 1 }), "dd/MM");
  }

  return format(date, "MM/yyyy");
}
