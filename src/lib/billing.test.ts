import { describe, expect, it } from "vitest";
import {
  getValorFaturavel,
  hasRecebimentoFinanceiro,
  isRetornoSemCobranca,
  RETORNO_SEM_COBRANCA,
} from "@/lib/billing";

describe("billing helpers", () => {
  it("identifica retorno sem cobrança ignorando caixa e acento", () => {
    expect(isRetornoSemCobranca(RETORNO_SEM_COBRANCA)).toBe(true);
    expect(isRetornoSemCobranca("retorno sem cobranca")).toBe(true);
    expect(isRetornoSemCobranca("PIX")).toBe(false);
  });

  it("zera valor faturável e recebimento de retorno sem cobrança", () => {
    const row = {
      forma_pagamento: RETORNO_SEM_COBRANCA,
      valor_atribuido: "R$ 1.500,00",
      data_pagamento: "25/05/2026",
    };

    expect(getValorFaturavel(row)).toBe(0);
    expect(hasRecebimentoFinanceiro(row)).toBe(false);
  });

  it("mantém valor e recebimento para cobranças normais", () => {
    const row = {
      forma_pagamento: "PIX",
      valor_atribuido: "R$ 1.500,00",
      data_pagamento: "25/05/2026",
    };

    expect(getValorFaturavel(row)).toBe(1500);
    expect(hasRecebimentoFinanceiro(row)).toBe(true);
  });
});
