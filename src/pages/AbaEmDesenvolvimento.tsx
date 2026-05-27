import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  Hammer,
  LogOut,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { CardEditorSheet } from "@/components/operations/CardEditorSheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOperacaoCardsData } from "@/hooks/useOperacaoCardsData";
import { supabase } from "@/integrations/supabase/client";
import {
  FUNNEL_CARD_META,
  getCardTypeValue,
  type FunnelCardDraft,
  type FunnelCardKey,
  type UnifiedFunnelCard,
} from "@/lib/funnelCards";
import {
  getValorFaturavel,
  hasRecebimentoFinanceiro,
  isRetornoSemCobranca,
  RETORNO_SEM_COBRANCA,
  SEM_COBRANCA_STATUS,
} from "@/lib/billing";
import { fmtBRL, fmtNum } from "@/lib/fmt";
import { parseBRDate } from "@/lib/parse";
import { useRouteAccess } from "@/lib/routeAccess";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type AgendamentoShortcut =
  | "today"
  | "yesterday"
  | "current_week"
  | "previous_week"
  | "current_month"
  | "previous_month"
  | "custom";

const AGENDAMENTO_SHORTCUTS: {
  label: string;
  value: AgendamentoShortcut;
}[] = [
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "Semana atual", value: "current_week" },
  { label: "Semana anterior", value: "previous_week" },
  { label: "Mês atual", value: "current_month" },
  { label: "Mês anterior", value: "previous_month" },
  { label: "Personalizado", value: "custom" },
];

const ETAPAS_EXCLUIDAS_AGENDAMENTO = new Set([
  "captacao",
  "negociacao",
  "perdido",
]);

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeStage(value: string | null | undefined) {
  return normalizeSearch(value ?? "");
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDateLabel(value: string | null) {
  return value && value.trim().length > 0 ? value : "-";
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateInputValue(value: string) {
  if (!value) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(year, month - 1, day);
}

function formatDateInputLabel(value: string) {
  const parsed = parseDateInputValue(value);
  return parsed ? format(parsed, "dd/MM/yyyy") : "";
}

function getAgendamentoShortcutRange(shortcut: AgendamentoShortcut) {
  const today = new Date();

  switch (shortcut) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: yesterday };
    }
    case "current_week":
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      };
    case "previous_week": {
      const previousWeek = subWeeks(today, 1);
      return {
        from: startOfWeek(previousWeek, { weekStartsOn: 1 }),
        to: endOfWeek(previousWeek, { weekStartsOn: 1 }),
      };
    }
    case "current_month":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "previous_month": {
      const previousMonth = subMonths(today, 1);
      return {
        from: startOfMonth(previousMonth),
        to: endOfMonth(previousMonth),
      };
    }
    case "custom":
      return null;
    default:
      return null;
  }
}

function formatAgendamentoRangeLabel(from: string, to: string) {
  if (from && to) {
    return `${formatDateInputLabel(from)} - ${formatDateInputLabel(to)}`;
  }

  if (from) {
    return `A partir de ${formatDateInputLabel(from)}`;
  }

  if (to) {
    return `Até ${formatDateInputLabel(to)}`;
  }

  return "Selecionar período";
}

function isWithinDateRange(value: string | null, from: string, to: string) {
  const parsed = parseBRDate(value);
  if (!parsed) {
    return !from && !to;
  }

  const current = parsed.getTime();
  const start = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const end = to ? new Date(`${to}T23:59:59`).getTime() : null;

  if (start !== null && current < start) return false;
  if (end !== null && current > end) return false;
  return true;
}

async function saveCardDraft(draft: FunnelCardDraft) {
  const editablePayload = {
    data_pagamento: emptyToNull(draft.data_pagamento),
    valor_atribuido: emptyToNull(draft.valor_atribuido),
    descricao_card: emptyToNull(draft.descricao_card),
    forma_pagamento: emptyToNull(draft.forma_pagamento),
  };

  switch (draft.table) {
    case "consultas": {
      const { error } = await supabase
        .from("consultas")
        .update(editablePayload)
        .eq("id", draft.sourceId);

      if (error) throw error;
      return;
    }
    case "espirometria": {
      const { error } = await supabase
        .from("espirometria")
        .update(editablePayload)
        .eq("id", draft.sourceId);

      if (error) throw error;
      return;
    }
    case "broncoscopia": {
      const { error } = await supabase
        .from("broncoscopia")
        .update({
          ...editablePayload,
          custos_exame: emptyToNull(draft.custos_exame),
          comissoes: emptyToNull(draft.comissoes),
          impostos: emptyToNull(draft.impostos),
        })
        .eq("id", draft.sourceId);

      if (error) throw error;
      return;
    }
    case "procedimentos_cirurgicos": {
      const { error } = await supabase
        .from("procedimentos_cirurgicos")
        .update({
          ...editablePayload,
          custo_anestesia: emptyToNull(draft.custo_anestesia),
          custo_comissao: emptyToNull(draft.custo_comissao),
          custo_hospital: emptyToNull(draft.custo_hospital),
          custo_instrumentacao: emptyToNull(draft.custo_instrumentacao),
          impostos: emptyToNull(draft.impostos),
          medico_auxiliar: emptyToNull(draft.medico_auxiliar),
        })
        .eq("id", draft.sourceId);

      if (error) throw error;
      return;
    }
    default:
      throw new Error("Tabela de funil nao suportada.");
  }
}

export default function AbaEmDesenvolvimento() {
  const queryClient = useQueryClient();
  const { data: cards = [], isLoading, error } = useOperacaoCardsData();
  const { canEditOperations, userEmail } = useRouteAccess();
  const [selectedCard, setSelectedCard] = useState<UnifiedFunnelCard | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function openCard(card: UnifiedFunnelCard) {
    setSelectedCard(card);
    setIsSheetOpen(true);
  }

  function closeCardSheet() {
    setIsSheetOpen(false);
    setTimeout(() => setSelectedCard(null), 350);
  }
  const [funnelFilter, setFunnelFilter] = useState<FunnelCardKey | "all">(
    "all"
  );
  const [responsavelFilter, setResponsavelFilter] = useState("__all__");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [baseFilter, setBaseFilter] = useState<"scheduled" | "all">(
    "scheduled"
  );
  const [search, setSearch] = useState("");
  const [agendamentoFrom, setAgendamentoFrom] = useState("");
  const [agendamentoTo, setAgendamentoTo] = useState("");
  const [agendamentoShortcut, setAgendamentoShortcut] =
    useState<AgendamentoShortcut>("custom");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"nome" | "responsavel" | "agendamento" | "valor" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const deferredSearch = useDeferredValue(search);
  const roleLabel = canEditOperations ? "Editor" : "Somente visualização";
  const agendamentoDateRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateInputValue(agendamentoFrom);
    const to = parseDateInputValue(agendamentoTo);

    if (!from && !to) return undefined;

    return { from, to };
  }, [agendamentoFrom, agendamentoTo]);
  const agendamentoRangeLabel = useMemo(
    () => formatAgendamentoRangeLabel(agendamentoFrom, agendamentoTo),
    [agendamentoFrom, agendamentoTo]
  );

  const handleAgendamentoShortcutChange = (value: AgendamentoShortcut) => {
    setAgendamentoShortcut(value);

    const range = getAgendamentoShortcutRange(value);
    if (!range) return;

    setAgendamentoFrom(toDateInputValue(range.from));
    setAgendamentoTo(toDateInputValue(range.to));
  };

  const handleAgendamentoRangeSelect = (range: DateRange | undefined) => {
    setAgendamentoShortcut("custom");
    setAgendamentoFrom(range?.from ? toDateInputValue(range.from) : "");
    setAgendamentoTo(range?.to ? toDateInputValue(range.to) : "");
  };

  const funnelScopedCards = useMemo(
    () =>
      cards.filter((card) => {
        if (funnelFilter !== "all" && card.funnel !== funnelFilter) return false;
        return true;
      }),
    [cards, funnelFilter]
  );

  const responsavelOptions = useMemo(() => {
    return Array.from(
      new Set(
        funnelScopedCards
          .map((card) => (card.responsavel ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [funnelScopedCards]);

  const filteredCards = useMemo(() => {
    const normalizedSearch = normalizeSearch(deferredSearch);

    return funnelScopedCards.filter((card) => {
      if (responsavelFilter === "__none__" && (card.responsavel ?? "").trim() !== "") {
        return false;
      }

      if (
        responsavelFilter !== "__all__" &&
        responsavelFilter !== "__none__" &&
        (card.responsavel ?? "") !== responsavelFilter
      ) {
        return false;
      }

      if (
        baseFilter === "scheduled" &&
        ETAPAS_EXCLUIDAS_AGENDAMENTO.has(normalizeStage(card.etapa_no_crm))
      ) {
        return false;
      }

      const isSemCobranca = isRetornoSemCobranca(card.forma_pagamento);
      const hasPagamentoFinanceiro = hasRecebimentoFinanceiro(card);

      if (paymentFilter === "paid" && !hasPagamentoFinanceiro) {
        return false;
      }

      if (paymentFilter === "unpaid" && (hasPagamentoFinanceiro || isSemCobranca)) {
        return false;
      }

      if (!isWithinDateRange(card.data_agendamento, agendamentoFrom, agendamentoTo)) {
        return false;
      }

      if (!normalizedSearch) return true;

      return [
        card.nome_contato,
        card.contato_id,
        card.key,
        card.id_do_card,
        card.responsavel,
        card.etapa_no_crm,
        card.modalidade_pagamento,
        card.forma_pagamento,
        getCardTypeValue(card),
      ]
        .filter(Boolean)
        .some((candidate) =>
          normalizeSearch(String(candidate)).includes(normalizedSearch)
        );
    });
  }, [
    agendamentoFrom,
    agendamentoTo,
    baseFilter,
    deferredSearch,
    funnelScopedCards,
    paymentFilter,
    responsavelFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [
    funnelFilter,
    responsavelFilter,
    paymentFilter,
    baseFilter,
    deferredSearch,
    agendamentoFrom,
    agendamentoTo,
  ]);

  useEffect(() => {
    if (selectedCard && !cards.some((card) => card.id === selectedCard.id)) {
      setIsSheetOpen(false);
      setSelectedCard(null);
    }
  }, [cards, selectedCard]);

  function handleSortToggle(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedCards = useMemo(() => {
    if (!sortKey) return filteredCards;
    return [...filteredCards].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "nome") { va = a.nome_contato ?? ""; vb = b.nome_contato ?? ""; }
      else if (sortKey === "responsavel") { va = a.responsavel ?? ""; vb = b.responsavel ?? ""; }
      else if (sortKey === "agendamento") { va = a.data_agendamento ?? ""; vb = b.data_agendamento ?? ""; }
      else if (sortKey === "valor") { va = getValorFaturavel(a); vb = getValorFaturavel(b); }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string, "pt-BR") : (vb as string).localeCompare(va, "pt-BR");
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
  }, [filteredCards, sortKey, sortDir]);

  const paginatedCards = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return sortedCards.slice(from, from + PAGE_SIZE);
  }, [sortedCards, page]);

  const summaryByFunnel = useMemo(() => {
    return (Object.keys(FUNNEL_CARD_META) as FunnelCardKey[]).map((key) => ({
      key,
      meta: FUNNEL_CARD_META[key],
      count: filteredCards.filter((card) => card.funnel === key).length,
    }));
  }, [filteredCards]);

  const totalValue = useMemo(
    () =>
      filteredCards.reduce(
        (sum, card) => sum + getValorFaturavel(card),
        0
      ),
    [filteredCards]
  );

  const updateMutation = useMutation({
    mutationFn: saveCardDraft,
    onSuccess: async () => {
      toast.success("Card atualizado com sucesso.");
      setSelectedCard(null);
      await queryClient.invalidateQueries();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Não foi possível salvar o card.");
    },
  });

  const handleSignOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      toast.error(signOutError.message || "Não foi possível sair da conta.");
      return;
    }

    queryClient.clear();
  };

  const activeOpFilterCount = [
    funnelFilter !== "all",
    responsavelFilter !== "__all__",
    paymentFilter !== "all",
    baseFilter !== "scheduled",
    Boolean(search.trim()),
    agendamentoFrom !== "" || agendamentoTo !== "",
  ].filter(Boolean).length;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-clinic-blue" />
            <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
              Operacional
            </h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
            {canEditOperations
              ? "Operacional para localizar cards dos funis e editar apenas pagamento, valor, forma de pagamento e descrição."
              : "Operacional para localizar e visualizar cards dos funis em modo somente leitura."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8E6FF] bg-[#EEF4FF] px-3 py-1 text-[11px] font-medium text-clinic-blue">
            <ShieldCheck className="h-3.5 w-3.5" />
            {roleLabel}
          </span>
          {userEmail ? (
            <span className="rounded-full border border-[#E2E6EB] bg-white px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
              {userEmail}
            </span>
          ) : null}
          <span className="rounded-full border border-[#D8E6FF] bg-[#EEF4FF] px-3 py-1 text-[11px] font-medium text-clinic-blue">
            {fmtNum(filteredCards.length)} cards filtrados
          </span>
          <span className="rounded-full border border-[#E2E6EB] bg-white px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
            Valor total: <span className="text-[#0F1923]">{fmtBRL(totalValue)}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-[#D8E0E8]"
            onClick={() => void handleSignOut()}
          >
            <LogOut data-icon="inline-start" />
            Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {summaryByFunnel.map(({ key, meta, count }) => {
          const Icon = meta.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                setFunnelFilter((current) => (current === key ? "all" : key))
              }
              className={cn(
                "panel-shell flex items-center justify-between gap-3 p-4 text-left transition-all duration-150",
                funnelFilter === key && "ring-2 ring-inset ring-clinic-blue"
              )}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  {meta.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#0F1923]">
                  {fmtNum(count)}
                </p>
              </div>
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.soft}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel-shell p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[#7C8B99]" />
            <h2 className="text-[14px] font-semibold text-[#0F1923]">
              Filtros operacionais
            </h2>
            {activeOpFilterCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-[#D8E6FF] bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-semibold leading-none text-clinic-blue">
                {activeOpFilterCount}
              </span>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {[
                {
                  label: "Não pagos do mês",
                  apply: () => {
                    setPaymentFilter("unpaid");
                    handleAgendamentoShortcutChange("current_month");
                    setFunnelFilter("all");
                    setResponsavelFilter("__all__");
                    setBaseFilter("scheduled");
                    setSearch("");
                  },
                  isActive:
                    paymentFilter === "unpaid" &&
                    agendamentoShortcut === "current_month",
                },
                {
                  label: "Sem responsável",
                  apply: () => {
                    setResponsavelFilter("__none__");
                    setPaymentFilter("all");
                    setFunnelFilter("all");
                    setBaseFilter("all");
                    setSearch("");
                    setAgendamentoFrom("");
                    setAgendamentoTo("");
                    setAgendamentoShortcut("custom");
                  },
                  isActive: responsavelFilter === "__none__",
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={preset.apply}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                    preset.isActive
                      ? "border-clinic-blue bg-[#EEF4FF] text-clinic-blue"
                      : "border-[#D8E0E8] bg-white text-[#5C6B7A] hover:border-clinic-blue hover:text-clinic-blue"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-end gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(150px,0.8fr))_auto]">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Busca
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BAAB8]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Contato, ID, card, responsável ou modalidade"
                  className="h-11 rounded-xl border-[#D8E0E8] bg-white pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Funil
              </span>
              <Select
                value={funnelFilter}
                onValueChange={(value) =>
                  setFunnelFilter(value as FunnelCardKey | "all")
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8]">
                  <SelectValue placeholder="Funil" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="all">Todos os funis</SelectItem>
                  {(Object.keys(FUNNEL_CARD_META) as FunnelCardKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {FUNNEL_CARD_META[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Base
              </span>
              <Select
                value={baseFilter}
                onValueChange={(value) =>
                  setBaseFilter(value as "scheduled" | "all")
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8]">
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="scheduled">Base agendada</SelectItem>
                  <SelectItem value="all">Todos os cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Responsável
              </span>
              <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="__all__">Todos responsáveis</SelectItem>
                  {responsavelOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Pagamento
              </span>
              <Select
                value={paymentFilter}
                onValueChange={(value) =>
                  setPaymentFilter(value as "all" | "paid" | "unpaid")
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="all">Todos pagamentos</SelectItem>
                  <SelectItem value="paid">Com pagamento</SelectItem>
                  <SelectItem value="unpaid">Sem pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-[#D8E0E8] px-5"
              onClick={() => {
                setFunnelFilter("all");
                setResponsavelFilter("__all__");
                setPaymentFilter("all");
                setBaseFilter("scheduled");
                setSearch("");
                setAgendamentoFrom("");
                setAgendamentoTo("");
                setAgendamentoShortcut("custom");
              }}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="rounded-2xl border border-[#E6ECF2] bg-[#FAFBFC] p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                  Data do agendamento
                </p>
                <p className="mt-1 text-[12px] text-[#5C6B7A]">
                  Filtra cards cuja data de agendamento esteja entre a data
                  inicial e a data final informadas. Com a base agendada ativa,
                  Captação, Negociação e Perdido ficam fora da lista.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[180px_minmax(260px,1fr)] xl:w-[520px]">
                <Select
                  value={agendamentoShortcut}
                  onValueChange={(value) =>
                    handleAgendamentoShortcutChange(
                      value as AgendamentoShortcut
                    )
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8] bg-white">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {AGENDAMENTO_SHORTCUTS.map((shortcut) => (
                      <SelectItem key={shortcut.value} value={shortcut.value}>
                        {shortcut.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 justify-start rounded-xl border-[#D8E0E8] bg-white px-3 text-left font-normal text-[#0F1923]"
                    >
                      <CalendarDays data-icon="inline-start" />
                      <span className="truncate">{agendamentoRangeLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={agendamentoDateRange}
                      onSelect={handleAgendamentoRangeSelect}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-shell overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E6EB] px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F1923]">
              Lista unificada de cards
            </h2>
            <p className="mt-1 text-[13px] text-[#5C6B7A]">
              {canEditOperations
                ? "Busque um card específico, visualize os dados consolidados ou edite os campos financeiros permitidos."
                : "Busque um card específico e visualize os dados consolidados em modo somente leitura."}
            </p>
          </div>
        </div>

        {error ? (
          <div className="px-5 py-10 text-sm text-[#B42318]">
            Não foi possível carregar os cards: {error.message}
          </div>
        ) : isLoading ? (
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton h-12" />
            ))}
          </div>
        ) : paginatedCards.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-base font-medium text-[#0F1923]">
              Nenhum card encontrado.
            </p>
            <p className="mt-2 text-sm text-[#5C6B7A]">
              Ajuste os filtros ou limpe a busca para ampliar o resultado.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FAFBFC] hover:bg-[#FAFBFC]">
                  <TableHead className="px-3 text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Funil
                  </TableHead>
                  {/* Sortable: Contato */}
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    <button type="button" onClick={() => handleSortToggle("nome")} className="inline-flex items-center gap-1 hover:text-slate-700">
                      Contato
                      {sortKey === "nome" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  {/* Sortable: Responsável */}
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    <button type="button" onClick={() => handleSortToggle("responsavel")} className="inline-flex items-center gap-1 hover:text-slate-700">
                      Responsável
                      {sortKey === "responsavel" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Modalidade
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Forma Pgto
                  </TableHead>
                  {/* Sortable: Agendamento */}
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    <button type="button" onClick={() => handleSortToggle("agendamento")} className="inline-flex items-center gap-1 hover:text-slate-700">
                      Agendamento
                      {sortKey === "agendamento" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  {/* Sortable: Valor */}
                  <TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    <button type="button" onClick={() => handleSortToggle("valor")} className="inline-flex items-center gap-1 hover:text-slate-700">
                      Valor
                      {sortKey === "valor" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Pagamento
                  </TableHead>
                  <TableHead className="pr-5 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCards.map((card) => {
                  const meta = FUNNEL_CARD_META[card.funnel];
                  const typeValue = getCardTypeValue(card);
                  const parsedValue = getValorFaturavel(card);
                  const isSemCobranca = isRetornoSemCobranca(card.forma_pagamento);
                  const hasPagamentoFinanceiro = hasRecebimentoFinanceiro(card);

                  return (
                    <TableRow
                      key={card.id}
                      className="border-[#EEF2F6] cursor-pointer transition-colors hover:bg-[#F7F9FC]"
                      onClick={() => openCard(card)}
                    >
                      <TableCell className="px-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.soft}`}
                        >
                          {meta.shortLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#0F1923]">
                            {card.nome_contato || "Sem nome"}
                          </p>
                          <p className="mt-1 text-[12px] text-[#7C8B99]">
                            {card.contato_id || card.id_do_card || card.key}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#40505F]">
                        {card.responsavel || "-"}
                      </TableCell>
                      <TableCell className="text-[#40505F]">
                        {typeValue || "-"}
                      </TableCell>
                      <TableCell className="text-[#40505F]">
                        {card.modalidade_pagamento || "-"}
                      </TableCell>
                      <TableCell className="text-[#40505F]">
                        {card.forma_pagamento || "-"}
                      </TableCell>
                      <TableCell className="text-[#40505F]">
                        <div>
                          <p>{formatDateLabel(card.data_agendamento)}</p>
                          <p className="mt-1 text-[12px] text-[#7C8B99]">
                            {card.horario_agendamento || "Sem horario"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-[#0F1923]">
                        {parsedValue > 0 ? fmtBRL(parsedValue) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              isSemCobranca
                                ? "bg-[#EEF4FF] text-clinic-blue"
                                : hasPagamentoFinanceiro
                                ? "bg-[#ECFDF3] text-[#047857]"
                                : "bg-[#FFF4E8] text-[#B45309]"
                            }`}
                          >
                            {isSemCobranca
                              ? SEM_COBRANCA_STATUS
                              : hasPagamentoFinanceiro
                                ? "Pago"
                                : "Pendente"}
                          </span>
                          <span className="text-[12px] text-[#7C8B99]">
                            {isSemCobranca
                              ? RETORNO_SEM_COBRANCA
                              : card.data_pagamento || "Sem data"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 text-center">
                        <ChevronRight className="mx-auto h-4 w-4 text-[#C4CDD6]" aria-hidden="true" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-[#E2E6EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-[#5C6B7A]">
                Pagina {fmtNum(page)} de {fmtNum(totalPages)} -{" "}
                {fmtNum(filteredCards.length)} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-[#D8E0E8]"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-[#D8E0E8]"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <CardEditorSheet
        card={selectedCard}
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) closeCardSheet();
        }}
        onSave={async (draft) => {
          if (!canEditOperations) {
            toast.error("Seu usuario nao tem permissao para editar cards.");
            return;
          }

          await updateMutation.mutateAsync(draft);
        }}
        isSaving={updateMutation.isPending}
        canEdit={canEditOperations}
      />
    </div>
  );
}
