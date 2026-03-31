function normalizeIntlSpacing(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, " ");
}

export function fmtNum(value: number): string {
  return normalizeIntlSpacing(new Intl.NumberFormat("pt-BR").format(value));
}

export function fmtBRL(value: number): string {
  return normalizeIntlSpacing(
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  );
}

export function fmtPct(value: number): string {
  return normalizeIntlSpacing(
    new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value)
  );
}

export function fmtDecimal(value: number, decimals = 1): string {
  return normalizeIntlSpacing(
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  );
}
