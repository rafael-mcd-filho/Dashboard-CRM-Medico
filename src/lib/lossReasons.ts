export const UNMAPPED_LOSS_REASON = "Sem motivo mapeado";
export const SEM_RETORNO_LOSS_REASON = "Sem Retorno";

export type LossReasonFunnel =
  | "consultas"
  | "espirometria"
  | "broncoscopia"
  | "cirurgia";

export type LossReasonRow = {
  etapa_no_crm: string | null;
  tag_id_card: string | null;
};

export type LossReasonDatum = {
  name: string;
  value: number;
  color: string;
};

export type LossDiagnostics = {
  total: number;
  unmapped: number;
  unmappedPct: number;
  semRetorno: number;
  semRetornoPct: number;
};

const LOSS_REASON_ORDER = [
  "Achou Caro",
  "Cancelamento",
  "Convênio não aceito",
  "Desistiu",
  "Distancia Inviabilizou",
  "Optou Convênio",
  "Optou Prefeitura",
  "Optou SUS",
  SEM_RETORNO_LOSS_REASON,
  "Somente pesquisa",
  UNMAPPED_LOSS_REASON,
];

const LOSS_REASON_COLORS: Record<string, string> = {
  "Achou Caro": "#B91C1C",
  Cancelamento: "#D97706",
  "Convênio não aceito": "#2563EB",
  Desistiu: "#7C3AED",
  "Distancia Inviabilizou": "#0F766E",
  "Optou Convênio": "#0891B2",
  "Optou Prefeitura": "#4D7C0F",
  "Optou SUS": "#9333EA",
  [SEM_RETORNO_LOSS_REASON]: "#64748B",
  "Somente pesquisa": "#A16207",
  [UNMAPPED_LOSS_REASON]: "#94A3B8",
};

const LOSS_ORIGIN_COLORS = [
  "#1A56DB",
  "#0891B2",
  "#059669",
  "#7C3AED",
  "#D97706",
  "#B91C1C",
  "#4D7C0F",
  "#64748B",
  "#A16207",
  "#9333EA",
];

const LOSS_REASON_TAGS: Record<LossReasonFunnel, Record<string, string>> = {
  broncoscopia: {
    "05901f21-62fb-4666-bf74-8840e2a4f66c": "Achou Caro",
    "9c110823-c442-4992-96b5-2a80cb793902": "Cancelamento",
    "cc5ba51c-83e3-42b9-871b-523d11138be7": "Convênio não aceito",
    "c5a3b372-5afd-4c46-8d32-5f30b24a4c76": "Desistiu",
    "e35c223b-3b39-45db-89c9-8f6269f8f833": "Distancia Inviabilizou",
    "64a5b733-8325-4ddc-b7c8-33ffc9ff1ae6": "Optou Convênio",
    "06647b4c-25ee-4d7a-a7e8-46b6b3047006": "Optou Prefeitura",
    "81b10c60-66a2-4be7-8013-b34a4f06586b": "Optou SUS",
    "fc5b3a62-acb4-44a4-8f7c-682a17881f7b": SEM_RETORNO_LOSS_REASON,
    "644e6729-1c73-4b65-b290-91025e881470": "Somente pesquisa",
  },
  cirurgia: {
    "655e3cd8-1678-4c5c-84d7-8dc432eae647": "Achou Caro",
    "5fa91604-43b4-4f1b-952f-2b30abb4deb0": "Cancelamento",
    "02585b41-d283-4be5-b143-95803d6a7f97": "Convênio não aceito",
    "36ba7747-bc77-4b65-88f1-520df115cddb": "Desistiu",
    "b42aa1cc-5623-4653-95c6-741a334076e7": "Distancia Inviabilizou",
    "ff0c25d8-dbb2-4a7f-bc41-e87b90824d14": "Optou Convênio",
    "ded6954d-450c-442b-b065-7c3f31771ef5": "Optou Prefeitura",
    "fdb10884-3017-47e0-88b6-56c47eda056d": "Optou SUS",
    "19654d1f-0b8d-48c8-94b7-5e53448108ab": SEM_RETORNO_LOSS_REASON,
    "3d155e98-1c81-40a5-91d3-a4d496c89b47": "Somente pesquisa",
  },
  consultas: {
    "1a4c462b-8da8-4913-816d-51959df31de6": "Achou Caro",
    "d0c67883-8b9c-4b91-8f51-8067f7ab9cdb": "Cancelamento",
    "ece92085-5f57-4d72-9d78-5eb542751ee8": "Convênio não aceito",
    "71d571a8-9f11-4b1b-a23e-619111421ab1": "Desistiu",
    "08c73a0c-2822-43d4-bef4-0798d3aeb124": "Distancia Inviabilizou",
    "999aae15-3327-4ae8-baf9-2c3ab88b66c5": "Optou Convênio",
    "1ad1995a-40c1-44c6-b4b9-e4a25cc48379": "Optou Prefeitura",
    "27a221e1-6111-4102-8367-205086407b98": "Optou SUS",
    "4ceb85f4-dc17-4079-808d-4e107ef2899e": SEM_RETORNO_LOSS_REASON,
    "8d6daf6a-74bc-4f48-b52a-52d30962ec04": "Somente pesquisa",
  },
  espirometria: {
    "624d4122-0588-45d1-ac6f-75310c17474b": "Achou Caro",
    "ea3d56b9-b4bb-42b0-a626-61c8b725fcce": "Cancelamento",
    "503a26f4-5683-4884-9669-8bff69bd64e6": "Convênio não aceito",
    "ae2d7903-5584-4d5f-9499-2e9249fbc334": "Desistiu",
    "84987b98-7290-4cd2-8b4e-a8da69989ae4": "Distancia Inviabilizou",
    "b1f2e06a-0548-4f41-a5da-06bdd1951dc6": "Optou Convênio",
    "7e07c5df-6bc1-4b77-908e-37a9e016e22c": "Optou Prefeitura",
    "e7c4c09d-f848-4015-983b-b76045ec19f7": "Optou SUS",
    "d6317e91-e6ec-4ace-b955-e01e48a5da0c": SEM_RETORNO_LOSS_REASON,
    "73971da4-8bf6-4b45-9f16-2a98c3d85343": "Somente pesquisa",
  },
};

function normalizeStage(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isLostStage(value: string | null | undefined) {
  return normalizeStage(value) === "perdido";
}

export function extractTagIds(value: string | null | undefined) {
  const tagText = (value ?? "").toLowerCase();
  return Array.from(
    tagText.matchAll(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
    ),
    (match) => match[0]
  );
}

export function getLossReasonName(row: LossReasonRow, funnel: LossReasonFunnel) {
  const tags = LOSS_REASON_TAGS[funnel];
  const firstMappedTag = extractTagIds(row.tag_id_card).find((tagId) => tags[tagId]);

  return firstMappedTag ? tags[firstMappedTag] : UNMAPPED_LOSS_REASON;
}

function sortLossReasons(a: LossReasonDatum, b: LossReasonDatum) {
  if (b.value !== a.value) return b.value - a.value;

  const aIndex = LOSS_REASON_ORDER.indexOf(a.name);
  const bIndex = LOSS_REASON_ORDER.indexOf(b.name);
  return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
    (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
}

function toLossReasonData(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .map(([name, value]) => ({
      name,
      value,
      color: LOSS_REASON_COLORS[name] ?? "#64748B",
    }))
    .sort(sortLossReasons);
}

function toLossOriginData(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value !== a.value ? b.value - a.value : a.name.localeCompare(b.name)))
    .map((item, index) => ({
      ...item,
      color: LOSS_ORIGIN_COLORS[index % LOSS_ORIGIN_COLORS.length],
    }));
}

export function getLossReasonValue(items: LossReasonDatum[], reasonName: string) {
  return items.find((item) => item.name === reasonName)?.value ?? 0;
}

export function buildLossDiagnostics(items: LossReasonDatum[]): LossDiagnostics {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const unmapped = getLossReasonValue(items, UNMAPPED_LOSS_REASON);
  const semRetorno = getLossReasonValue(items, SEM_RETORNO_LOSS_REASON);

  return {
    total,
    unmapped,
    unmappedPct: total > 0 ? unmapped / total : 0,
    semRetorno,
    semRetornoPct: total > 0 ? semRetorno / total : 0,
  };
}

export function buildLossOrigins<T extends LossReasonRow>(
  rows: T[],
  getOrigin: (row: T) => string
): LossReasonDatum[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    if (!isLostStage(row.etapa_no_crm)) return;

    const origin = getOrigin(row);
    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  });

  return toLossOriginData(counts);
}

export function buildLossReasons(
  rows: LossReasonRow[],
  funnel: LossReasonFunnel
): LossReasonDatum[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    if (!isLostStage(row.etapa_no_crm)) return;

    const reason = getLossReasonName(row, funnel);
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  });

  return toLossReasonData(counts);
}

export function buildCombinedLossReasons(
  sources: Array<{ funnel: LossReasonFunnel; rows: LossReasonRow[] }>
): LossReasonDatum[] {
  const counts = new Map<string, number>();

  sources.forEach(({ funnel, rows }) => {
    buildLossReasons(rows, funnel).forEach((item) => {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.value);
    });
  });

  return toLossReasonData(counts);
}

export function buildCombinedLossOrigins<T extends LossReasonRow>(
  sources: Array<{ rows: T[]; getOrigin: (row: T) => string }>
): LossReasonDatum[] {
  const counts = new Map<string, number>();

  sources.forEach(({ rows, getOrigin }) => {
    buildLossOrigins(rows, getOrigin).forEach((item) => {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.value);
    });
  });

  return toLossOriginData(counts);
}
