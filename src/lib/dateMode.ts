import { isInDateRange } from "@/lib/parse";

export type DashboardDateMode = "criacao" | "agendamento";

type DateModeRow = {
  data_criacao_card?: string | null;
  data_agendamento?: string | null;
};

export function getRowDateByMode(
  row: DateModeRow,
  tipoData: DashboardDateMode
) {
  return tipoData === "agendamento"
    ? row.data_agendamento ?? null
    : row.data_criacao_card ?? null;
}

export function isRowInDateModeRange(
  row: DateModeRow,
  dataInicio: Date,
  dataFim: Date,
  tipoData: DashboardDateMode
) {
  return isInDateRange(getRowDateByMode(row, tipoData), dataInicio, dataFim);
}

export function getDateModeLabel(tipoData: DashboardDateMode) {
  return tipoData === "agendamento"
    ? "Data de Agendamento"
    : "Data de Criação do Card";
}
