import { addDays, differenceInCalendarDays } from "date-fns";

export type MetricComparison = {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
  direction: "up" | "down" | "flat";
};

export function getPreviousPeriodRange(dataInicio: Date, dataFim: Date) {
  const totalDays = differenceInCalendarDays(dataFim, dataInicio) + 1;
  const previousEnd = addDays(dataInicio, -1);
  const previousStart = addDays(previousEnd, -(totalDays - 1));

  return {
    dataInicio: previousStart,
    dataFim: previousEnd,
  };
}

export function buildMetricComparison(
  current: number,
  previous: number
): MetricComparison {
  const delta = current - previous;

  if (delta === 0) {
    return {
      current,
      previous,
      delta,
      deltaPct: previous === 0 ? 0 : 0,
      direction: "flat",
    };
  }

  return {
    current,
    previous,
    delta,
    deltaPct: previous === 0 ? null : delta / previous,
    direction: delta > 0 ? "up" : "down",
  };
}

export function buildMetricComparisons<T extends Record<string, number>>(
  current: T,
  previous: T
): { [K in keyof T]: MetricComparison } {
  const entries = Object.keys(current).map((key) => [
    key,
    buildMetricComparison(current[key], previous[key] ?? 0),
  ]);

  return Object.fromEntries(entries) as { [K in keyof T]: MetricComparison };
}

export function sumByNumberKey<T>(
  rows: T[],
  key: keyof T,
  predicate?: (row: T) => boolean
) {
  return rows.reduce((sum, row) => {
    if (predicate && !predicate(row)) {
      return sum;
    }

    const value = row[key];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}
