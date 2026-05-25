import { describe, expect, it } from "vitest";
import {
  buildCombinedLossReasons,
  buildLossDiagnostics,
  buildLossOrigins,
  buildLossReasons,
  extractTagIds,
  getLossReasonName,
  UNMAPPED_LOSS_REASON,
} from "./lossReasons";

describe("lossReasons", () => {
  it("extracts tag ids in the order they appear", () => {
    expect(
      extractTagIds(
        '["d0c67883-8b9c-4b91-8f51-8067f7ab9cdb","1a4c462b-8da8-4913-816d-51959df31de6"]'
      )
    ).toEqual([
      "d0c67883-8b9c-4b91-8f51-8067f7ab9cdb",
      "1a4c462b-8da8-4913-816d-51959df31de6",
    ]);
  });

  it("uses the first mapped reason from the card tag order", () => {
    expect(
      getLossReasonName(
        {
          etapa_no_crm: "Perdido",
          tag_id_card:
            "d0c67883-8b9c-4b91-8f51-8067f7ab9cdb, 1a4c462b-8da8-4913-816d-51959df31de6",
        },
        "consultas"
      )
    ).toBe("Cancelamento");
  });

  it("does not mix tag ids between funnels", () => {
    expect(
      buildLossReasons(
        [
          {
            etapa_no_crm: "Perdido",
            tag_id_card: "1a4c462b-8da8-4913-816d-51959df31de6",
          },
        ],
        "broncoscopia"
      )
    ).toEqual([
      {
        name: UNMAPPED_LOSS_REASON,
        value: 1,
        color: "#94A3B8",
      },
    ]);
  });

  it("uses the corrected espirometria Optou Prefeitura tag id", () => {
    expect(
      getLossReasonName(
        {
          etapa_no_crm: "Perdido",
          tag_id_card: "7e07c5df-6bc1-4b77-908e-37a9e016e22c",
        },
        "espirometria"
      )
    ).toBe("Optou Prefeitura");
  });

  it("counts only lost cards and falls back when no mapped id exists", () => {
    expect(
      buildLossReasons(
        [
          {
            etapa_no_crm: "Perdido",
            tag_id_card: "1a4c462b-8da8-4913-816d-51959df31de6",
          },
          {
            etapa_no_crm: "Realizado",
            tag_id_card: "d0c67883-8b9c-4b91-8f51-8067f7ab9cdb",
          },
          {
            etapa_no_crm: "Perdido",
            tag_id_card: null,
          },
        ],
        "consultas"
      )
    ).toEqual([
      {
        name: "Achou Caro",
        value: 1,
        color: "#B91C1C",
      },
      {
        name: UNMAPPED_LOSS_REASON,
        value: 1,
        color: "#94A3B8",
      },
    ]);
  });

  it("combines mapped reasons across funnels by reason name", () => {
    expect(
      buildCombinedLossReasons([
        {
          funnel: "consultas",
          rows: [
            {
              etapa_no_crm: "Perdido",
              tag_id_card: "1a4c462b-8da8-4913-816d-51959df31de6",
            },
          ],
        },
        {
          funnel: "espirometria",
          rows: [
            {
              etapa_no_crm: "Perdido",
              tag_id_card: "624d4122-0588-45d1-ac6f-75310c17474b",
            },
          ],
        },
      ])
    ).toEqual([
      {
        name: "Achou Caro",
        value: 2,
        color: "#B91C1C",
      },
    ]);
  });

  it("builds loss diagnostics from reason totals", () => {
    expect(
      buildLossDiagnostics([
        { name: "Sem Retorno", value: 2, color: "#64748B" },
        { name: UNMAPPED_LOSS_REASON, value: 1, color: "#94A3B8" },
        { name: "Achou Caro", value: 1, color: "#B91C1C" },
      ])
    ).toEqual({
      total: 4,
      unmapped: 1,
      unmappedPct: 0.25,
      semRetorno: 2,
      semRetornoPct: 0.5,
    });
  });

  it("counts lost cards by origin only", () => {
    expect(
      buildLossOrigins(
        [
          { etapa_no_crm: "Perdido", tag_id_card: null, origem: "Anuncios" },
          { etapa_no_crm: "Perdido", tag_id_card: null, origem: "Indicação" },
          { etapa_no_crm: "Perdido", tag_id_card: null, origem: "Anuncios" },
          { etapa_no_crm: "Realizado", tag_id_card: null, origem: "Anuncios" },
        ],
        (row) => row.origem
      ).map(({ name, value }) => ({ name, value }))
    ).toEqual([
      { name: "Anuncios", value: 2 },
      { name: "Indicação", value: 1 },
    ]);
  });
});
