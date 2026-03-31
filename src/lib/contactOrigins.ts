export type ContatoOrigemSource = {
  tags: string | null | undefined;
  origem_contato: string | null | undefined;
};

const TAG_ORIGIN_RULES = [
  { label: "Anúncio", patterns: ["anuncio"] },
  { label: "Doctoralia", patterns: ["doctoralia"] },
  { label: "Indicação", patterns: ["indicacao", "parente paciente"] },
] as const;

const RAW_ORIGENS_ANUNCIO = new Set([
  "facebook",
  "instagram",
  "google",
  "site",
  "meta ads",
  "google ads",
]);

const RAW_ORIGENS_DIRETA = new Set([
  "",
  "created from hub",
  "created by user",
  "created_from_hub",
  "created_by_user",
  "imported",
  "nao definido",
  "não definido",
]);

function normalizeRawValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizeSearchText(value: string | null | undefined) {
  return normalizeRawValue(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTags(value: string | null | undefined) {
  const raw = (value ?? "").trim();

  if (!raw || raw === "[]") {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item).trim())
        .filter(Boolean);
    }
  } catch {
    // Fallback para linhas antigas ou mal formatadas.
  }

  return raw
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => item.replace(/^"+|"+$/g, "").trim())
    .filter(Boolean);
}

export function humanizeOrigemContato(value: string | null | undefined) {
  const normalized = normalizeSearchText(value);

  if (RAW_ORIGENS_ANUNCIO.has(normalized)) {
    return "Anúncio";
  }

  if (RAW_ORIGENS_DIRETA.has(normalized)) {
    return "Direta";
  }

  if (normalized === "doctoralia") {
    return "Doctoralia";
  }

  return (value ?? "Direta")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getContatoOrigemAgrupada(row: ContatoOrigemSource) {
  const tags = parseTags(row.tags);

  for (const rule of TAG_ORIGIN_RULES) {
    const hasMatchingTag = tags.some((tag) => {
      const normalizedTag = normalizeSearchText(tag);
      return rule.patterns.some((pattern) => normalizedTag.includes(pattern));
    });

    if (hasMatchingTag) {
      return rule.label;
    }
  }

  return humanizeOrigemContato(row.origem_contato);
}

export function isContatoOrigemAnuncio(row: ContatoOrigemSource) {
  return getContatoOrigemAgrupada(row) === "Anúncio";
}

export function matchesSomenteAnunciosFilter(
  contatoId: string | null | undefined,
  contatoMap: Map<string, ContatoOrigemSource>,
  somenteAnuncios: boolean
) {
  if (!somenteAnuncios) {
    return true;
  }

  if (!contatoId) {
    return false;
  }

  const contato = contatoMap.get(contatoId);
  return Boolean(contato && isContatoOrigemAnuncio(contato));
}
