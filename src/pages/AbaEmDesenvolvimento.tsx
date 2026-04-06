import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Filter,
  Hammer,
  Search,
  SquarePen,
} from "lucide-react";
import { CardEditorSheet } from "@/components/operations/CardEditorSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { fmtBRL, fmtNum } from "@/lib/fmt";
import { parseBRDate, parseMonetary } from "@/lib/parse";

const PAGE_SIZE = 25;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDateLabel(value: string | null) {
  return value && value.trim().length > 0 ? value : "-";
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
        .update(editablePayload)
        .eq("id", draft.sourceId);

      if (error) throw error;
      return;
    }
    case "procedimentos_cirurgicos": {
      const { error } = await supabase
        .from("procedimentos_cirurgicos")
        .update(editablePayload)
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
  const [selectedCard, setSelectedCard] = useState<UnifiedFunnelCard | null>(
    null
  );
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [funnelFilter, setFunnelFilter] = useState<FunnelCardKey | "all">(
    "all"
  );
  const [responsavelFilter, setResponsavelFilter] = useState("__all__");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "paid" | "unpaid"
  >("all");
  const [search, setSearch] = useState("");
  const [agendamentoFrom, setAgendamentoFrom] = useState("");
  const [agendamentoTo, setAgendamentoTo] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

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
      if (
        responsavelFilter !== "__all__" &&
        (card.responsavel ?? "") !== responsavelFilter
      ) {
        return false;
      }

      if (paymentFilter === "paid" && !card.data_pagamento) {
        return false;
      }

      if (paymentFilter === "unpaid" && card.data_pagamento) {
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
    deferredSearch,
    agendamentoFrom,
    agendamentoTo,
  ]);

  useEffect(() => {
    if (selectedCard && !cards.some((card) => card.id === selectedCard.id)) {
      setSelectedCard(null);
      setSheetMode("view");
    }
  }, [cards, selectedCard]);

  const paginatedCards = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filteredCards.slice(from, from + PAGE_SIZE);
  }, [filteredCards, page]);

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
        (sum, card) => sum + parseMonetary(card.valor_atribuido),
        0
      ),
    [filteredCards]
  );

  const updateMutation = useMutation({
    mutationFn: saveCardDraft,
    onSuccess: async () => {
      toast.success("Card atualizado com sucesso.");
      setSelectedCard(null);
      setSheetMode("view");
      await queryClient.invalidateQueries();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Nao foi possivel salvar o card.");
    },
  });

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-clinic-blue" />
            <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
              Em desenvolvimento
            </h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
            Central operacional para localizar cards dos funis e editar apenas
            pagamento, valor e descricao.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#D8E6FF] bg-[#EEF4FF] px-3 py-1 text-[11px] font-medium text-clinic-blue">
            {fmtNum(filteredCards.length)} cards filtrados
          </span>
          <span className="rounded-full border border-[#E2E6EB] bg-white px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
            Valor total: <span className="text-[#0F1923]">{fmtBRL(totalValue)}</span>
          </span>
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
              className="panel-shell flex items-center justify-between gap-3 p-4 text-left transition-colors"
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
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#7C8B99]" />
            <h2 className="text-[14px] font-semibold text-[#0F1923]">
              Filtros operacionais
            </h2>
          </div>

          <div className="grid items-end gap-3 xl:grid-cols-[minmax(280px,1.6fr)_repeat(3,minmax(180px,1fr))_auto]">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A97A6]">
                Busca
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BAAB8]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Contato, ID, card, responsavel ou modalidade"
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
                Responsavel
              </span>
              <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                <SelectTrigger className="h-11 rounded-xl border-[#D8E0E8]">
                  <SelectValue placeholder="Responsavel" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="__all__">Todos responsaveis</SelectItem>
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
                setSearch("");
                setAgendamentoFrom("");
                setAgendamentoTo("");
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
                  inicial e a data final informadas.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:w-[420px]">
                <Input
                  type="date"
                  value={agendamentoFrom}
                  onChange={(event) => setAgendamentoFrom(event.target.value)}
                  aria-label="Data inicial do agendamento"
                  className="h-11 rounded-xl border-[#D8E0E8] bg-white"
                />
                <Input
                  type="date"
                  value={agendamentoTo}
                  onChange={(event) => setAgendamentoTo(event.target.value)}
                  aria-label="Data final do agendamento"
                  className="h-11 rounded-xl border-[#D8E0E8] bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-shell overflow-hidden p-0">
        <div className="border-b border-[#E2E6EB] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#0F1923]">
            Lista unificada de cards
          </h2>
          <p className="mt-1 text-[13px] text-[#5C6B7A]">
            Busque um card especifico, visualize os dados consolidados ou edite
            os campos financeiros permitidos.
          </p>
        </div>

        {error ? (
          <div className="px-5 py-10 text-sm text-[#B42318]">
            Nao foi possivel carregar os cards: {error.message}
          </div>
        ) : isLoading ? (
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl bg-[#F1F4F7]"
              />
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
                  <TableHead className="px-5 text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Funil
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Contato
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Responsavel
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Tipo de paciente
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Modalidade de pagamento
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Agendamento
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Valor
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Pagamento
                  </TableHead>
                  <TableHead className="pr-5 text-right text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
                    Acao
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCards.map((card) => {
                  const meta = FUNNEL_CARD_META[card.funnel];
                  const typeValue = getCardTypeValue(card);
                  const parsedValue = parseMonetary(card.valor_atribuido);

                  return (
                    <TableRow key={card.id} className="border-[#EEF2F6]">
                      <TableCell className="px-5">
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
                        <div>
                          <p>{formatDateLabel(card.data_agendamento)}</p>
                          <p className="mt-1 text-[12px] text-[#7C8B99]">
                            {card.horario_agendamento || "Sem horario"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-[#0F1923]">
                        {parsedValue > 0 ? fmtBRL(parsedValue) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              card.data_pagamento
                                ? "bg-[#ECFDF3] text-[#047857]"
                                : "bg-[#FFF4E8] text-[#B45309]"
                            }`}
                          >
                            {card.data_pagamento ? "Pago" : "Pendente"}
                          </span>
                          <span className="text-[12px] text-[#7C8B99]">
                            {card.data_pagamento || "Sem data"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl border-[#D8E0E8]"
                            onClick={() => {
                              setSelectedCard(card);
                              setSheetMode("view");
                            }}
                          >
                            <Eye data-icon="inline-start" />
                            Visualizar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl border-[#D8E0E8]"
                            onClick={() => {
                              setSelectedCard(card);
                              setSheetMode("edit");
                            }}
                          >
                            <SquarePen data-icon="inline-start" />
                            Editar
                          </Button>
                        </div>
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
        mode={sheetMode}
        open={Boolean(selectedCard)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCard(null);
            setSheetMode("view");
          }
        }}
        onSave={async (draft) => {
          await updateMutation.mutateAsync(draft);
        }}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
