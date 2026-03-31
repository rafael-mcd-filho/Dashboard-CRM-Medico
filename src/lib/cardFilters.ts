export const SEM_RESPONSAVEL_VALUE = "__sem_responsavel__";

type GlobalCardFilters = {
  responsavel: string;
};

type FilterableCardRow = {
  responsavel: string | null;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function isSemResponsavel(value: string | null | undefined) {
  return normalizeText(value).length === 0;
}

export function matchesGlobalCardFilters<T extends FilterableCardRow>(
  row: T,
  filters: GlobalCardFilters
) {
  const responsavel = normalizeText(row.responsavel);

  if (filters.responsavel === SEM_RESPONSAVEL_VALUE) {
    if (responsavel) return false;
  } else if (filters.responsavel && responsavel !== filters.responsavel) {
    return false;
  }

  return true;
}

export function getResponsavelOptions<T extends { responsavel: string | null }>(
  rows: T[]
) {
  return [...new Set(rows.map((row) => normalizeText(row.responsavel)).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

