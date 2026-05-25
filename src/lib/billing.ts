import { parseMonetary } from "@/lib/parse";

export const RETORNO_SEM_COBRANCA = "Retorno sem cobrança";
export const RETORNO_AGENDA_TAG = "Retorno";
export const SEM_COBRANCA_STATUS = "Sem cobrança";

type BillingRow = {
  forma_pagamento?: string | null;
  valor_atribuido?: string | number | null;
};

type PaymentRow = BillingRow & {
  data_pagamento?: string | null;
};

function normalizePaymentForm(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isRetornoSemCobranca(
  formaPagamento: string | null | undefined
) {
  return normalizePaymentForm(formaPagamento) === "retorno sem cobranca";
}

export function getValorFaturavel(row: BillingRow) {
  return isRetornoSemCobranca(row.forma_pagamento)
    ? 0
    : parseMonetary(row.valor_atribuido);
}

export function hasRecebimentoFinanceiro(row: PaymentRow) {
  return (
    Boolean(row.data_pagamento?.trim()) &&
    !isRetornoSemCobranca(row.forma_pagamento)
  );
}
