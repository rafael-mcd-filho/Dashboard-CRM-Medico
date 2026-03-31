import { differenceInDays } from "date-fns";

/**
 * Converte string monetária para número.
 * Suporta "1500", "1500.50", "1.500,50", "R$ 1.500,50"
 */
export function parseMonetary(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  const str = String(value).trim();
  const stripped = str.replace(/R\$\s*/g, "").replace(/\s/g, "");

  if (stripped.includes(",")) {
    const cleaned = stripped.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(stripped);
  return isNaN(num) ? 0 : num;
}

/**
 * Converte string de data para objeto Date.
 * Suporta DD/MM/YYYY (formato do banco) e YYYY-MM-DD (ISO, fallback).
 */
export function parseBRDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const str = s.trim();
  const br = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) return new Date(+br[3], +br[2] - 1, +br[1]);
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}

/**
 * Verifica se uma string de data (DD/MM/YYYY ou ISO) está dentro do intervalo [start, end].
 */
export function isInDateRange(
  dateStr: string | null | undefined,
  start: Date,
  end: Date
): boolean {
  const d = parseBRDate(dateStr);
  if (!d) return false;
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return t >= s && t <= e;
}

/**
 * Diferença em dias entre data_pagamento e data_agendamento.
 * Aceita formato DD/MM/YYYY e ISO. Retorna null se inválido.
 */
export function calcDiffDias(
  data_pagamento: string | null | undefined,
  data_agendamento: string | null | undefined
): number | null {
  if (!data_pagamento || !data_agendamento) return null;
  const pgto = parseBRDate(data_pagamento);
  const agend = parseBRDate(data_agendamento);
  if (!pgto || !agend) return null;
  return differenceInDays(pgto, agend);
}
