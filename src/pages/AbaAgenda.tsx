import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Megaphone,
  Search,
  UserRound,
} from "lucide-react";
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgendaData } from "@/hooks/useAgendaData";
import {
  AGENDA_FUNNEL_META,
  AGENDA_FUNNEL_ORDER,
  AGENDA_TURN_META,
  getAgendaRange,
  getAgendaRangeLabel,
  getMonthGridDays,
  getWeekDays,
  shiftAgendaAnchorDate,
  type AgendaEvent,
  type AgendaFunnelKey,
  type AgendaTurnKey,
  type AgendaView,
} from "@/lib/agenda";
import { fmtBRL, fmtNum } from "@/lib/fmt";
import { cn } from "@/lib/utils";

const FUNNEL_FILTERS = [
  { key: "all", label: "Tudo" },
  ...AGENDA_FUNNEL_ORDER.map((key) => ({
    key,
    label: AGENDA_FUNNEL_META[key].label,
  })),
] as const;

const VIEW_LABELS: Record<AgendaView, string> = {
  day: "Diária",
  week: "Semanal",
  month: "Mensal",
};

const TURN_FILTERS = [
  { key: "all", label: "Todos os turnos" },
  { key: "manha", label: AGENDA_TURN_META.manha.label },
  { key: "tarde", label: AGENDA_TURN_META.tarde.label },
  { key: "noite", label: AGENDA_TURN_META.noite.label },
  { key: "sem_horario", label: AGENDA_TURN_META.sem_horario.label },
] as const;

function normalizeAgendaSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function AgendaDatePicker({
  value,
  onSelect,
}: {
  value: Date;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-xl border-[#E2E6EB] px-3 text-[11px] text-[#5C6B7A]"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {format(value, "dd/MM/yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  );
}

function AgendaEventCard({
  event,
  compact = false,
  onOpen,
}: {
  event: AgendaEvent;
  compact?: boolean;
  onOpen: (event: AgendaEvent) => void;
}) {
  const funnelMeta = AGENDA_FUNNEL_META[event.funnel];
  const isMissingTime = !event.timeLabel;

  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={cn(
        "group relative w-full overflow-hidden rounded-[18px] border border-[#E2E6EB] bg-white text-left shadow-[0_8px_24px_rgba(15,25,35,0.04)] transition-[transform,box-shadow,border-color,background-color] duration-150 hover:-translate-y-px hover:shadow-card-hover",
        isMissingTime && "border-[#F6C27B] bg-[#FFF9F1]",
        compact ? "p-2.5" : "p-3"
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: funnelMeta.color }}
      />

      <div className={cn("pl-2", compact && "pl-1.5")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
                isMissingTime
                  ? "bg-[#FFF1DA] text-[#B45309]"
                  : "bg-[#F3F5F7] text-[#5C6B7A]"
              )}
            >
              {event.timeLabel ?? "Sem horário"}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                funnelMeta.soft
              )}
            >
              {compact ? funnelMeta.shortLabel : funnelMeta.label}
            </span>
          </div>

          {event.isAds ? (
            <Megaphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clinic-amber" />
          ) : null}
        </div>

        <p className={cn("mt-2 font-semibold text-[#0F1923]", compact ? "text-[13px]" : "text-sm")}>
          {event.patientName}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7C8B99]">
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3 w-3" />
            {event.responsible}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {event.turn === "sem_horario"
              ? "Sem horário"
              : AGENDA_TURN_META[event.turn].label}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {event.amount > 0 ? (
            <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-semibold text-clinic-blue">
              {fmtBRL(event.amount)}
            </span>
          ) : null}
          <span className="rounded-full bg-[#F7F9FB] px-2 py-0.5 text-[10px] font-medium text-[#5C6B7A]">
            {event.stage}
          </span>
          {event.typeLabel ? (
            <span className="rounded-full bg-[#F7F9FB] px-2 py-0.5 text-[10px] font-medium text-[#5C6B7A]">
              {event.typeLabel}
            </span>
          ) : null}
          {isMissingTime ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F6C27B] bg-[#FFF1DA] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
              <AlertTriangle className="h-3 w-3" />
              Ajustar horário
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function TurnSection({
  title,
  subtitle,
  events,
  onOpen,
  highlight = false,
}: {
  title: string;
  subtitle: string;
  events: AgendaEvent[];
  onOpen: (event: AgendaEvent) => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel-shell p-4",
        highlight && "border-[#F6C27B] bg-[linear-gradient(180deg,#FFFDF8_0%,#FFFFFF_100%)]"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[#0F1923]">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-[#9BAAB8]">{subtitle}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            highlight
              ? "bg-[#FFF1DA] text-[#B45309]"
              : "bg-[#EEF3FF] text-clinic-blue"
          )}
        >
          {fmtNum(events.length)}
        </span>
      </div>

      {events.length === 0 ? (
        <div
          className={cn(
            "flex min-h-28 items-center justify-center rounded-[18px] border border-dashed text-[12px]",
            highlight
              ? "border-[#F6C27B] bg-[#FFF9F1] text-[#B45309]"
              : "border-[#DDE3EA] bg-[#FAFBFC] text-[#9BAAB8]"
          )}
        >
          Sem agendamentos neste bloco
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => (
            <AgendaEventCard key={event.id} event={event} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaDetailSheet({
  event,
  open,
  onOpenChange,
}: {
  event: AgendaEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event) return null;

  const funnelMeta = AGENDA_FUNNEL_META[event.funnel];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-[#E2E6EB] bg-white p-0 sm:max-w-[440px]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-[#E2E6EB] px-6 py-5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                  funnelMeta.soft
                )}
              >
                {funnelMeta.label}
              </span>
              {event.isAds ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#FCD34D] bg-[#FFF7E6] px-2.5 py-1 text-[11px] font-medium text-[#B45309]">
                  <Megaphone className="h-3 w-3" />
                  Anúncio
                </span>
              ) : null}
            </div>
            <SheetTitle className="mt-3 text-xl text-[#0F1923]">
              {event.patientName}
            </SheetTitle>
            <SheetDescription className="text-sm text-[#5C6B7A]">
              {format(event.dateValue, "EEEE, dd 'de' MMMM", { locale: ptBR })}{" "}
              {event.timeLabel ? `às ${event.timeLabel}` : "sem horário definido"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Responsável", event.responsible],
                ["Etapa", event.stage],
                ["Modalidade", event.modality],
                ["Origem", event.origin],
                ["Tipo", event.typeLabel ?? "Não definido"],
                ["Valor", event.amount > 0 ? fmtBRL(event.amount) : "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-[#E2E6EB] bg-[#FAFBFC] p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#0F1923]">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[18px] border border-[#E2E6EB] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
                Descrição do card
              </p>
              <div className="mt-3 rounded-[16px] border border-[#E2E6EB] bg-[#FAFBFC] p-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#40505F]">
                  {event.cardDescription ?? "Sem descrição cadastrada."}
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-[#E2E6EB] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
                Identificação do card
              </p>
              <div className="mt-3 space-y-2 text-sm text-[#5C6B7A]">
                <p>
                  <span className="font-medium text-[#0F1923]">CRM Key:</span>{" "}
                  <span className="font-mono">{event.crmKey ?? "—"}</span>
                </p>
                <p>
                  <span className="font-medium text-[#0F1923]">ID do card:</span>{" "}
                  <span className="font-mono">{event.cardId ?? "—"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E2E6EB] px-6 py-4">
            {event.conversationLink ? (
              <Button asChild className="h-10 w-full rounded-xl">
                <a href={event.conversationLink} target="_blank" rel="noreferrer">
                  Abrir conversa
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl border-[#E2E6EB] text-[#5C6B7A]"
                disabled
              >
                Sem link da conversa
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function groupByTurn(events: AgendaEvent[]) {
  return {
    manha: events.filter((event) => event.turn === "manha"),
    tarde: events.filter((event) => event.turn === "tarde"),
    noite: events.filter((event) => event.turn === "noite"),
    sem_horario: events.filter((event) => event.turn === "sem_horario"),
  } satisfies Record<AgendaTurnKey, AgendaEvent[]>;
}

function DayAgendaView({
  events,
  anchorDate,
  onOpen,
}: {
  events: AgendaEvent[];
  anchorDate: Date;
  onOpen: (event: AgendaEvent) => void;
}) {
  const dayEvents = events.filter((event) => isSameDay(event.dateValue, anchorDate));
  const grouped = groupByTurn(dayEvents);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {(["manha", "tarde", "noite"] as const).map((turn) => (
          <TurnSection
            key={turn}
            title={AGENDA_TURN_META[turn].label}
            subtitle={AGENDA_TURN_META[turn].range}
            events={grouped[turn]}
            onOpen={onOpen}
          />
        ))}
      </div>

      <TurnSection
        title={AGENDA_TURN_META.sem_horario.label}
        subtitle="Agendamentos sem horário definido"
        events={grouped.sem_horario}
        onOpen={onOpen}
        highlight
      />
    </div>
  );
}

function WeekAgendaView({
  events,
  anchorDate,
  onOpen,
  onOpenDay,
}: {
  events: AgendaEvent[];
  anchorDate: Date;
  onOpen: (event: AgendaEvent) => void;
  onOpenDay: (date: Date) => void;
}) {
  const weekDays = getWeekDays(anchorDate);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1120px] grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayEvents = events.filter((event) => isSameDay(event.dateValue, day));
          const grouped = groupByTurn(dayEvents);

          return (
            <div key={day.toISOString()} className="panel-shell p-3">
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className="mb-3 w-full rounded-[16px] border border-[#E2E6EB] bg-[#FAFBFC] px-3 py-2 text-left transition-colors hover:bg-[#F3F6FB]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#0F1923]">
                    {format(day, "dd 'de' MMM", { locale: ptBR })}
                  </p>
                  <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-[10px] font-medium text-clinic-blue">
                    {fmtNum(dayEvents.length)}
                  </span>
                </div>
              </button>

              {dayEvents.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center rounded-[18px] border border-dashed border-[#DDE3EA] bg-[#FAFBFC] px-4 text-center text-[12px] text-[#9BAAB8]">
                  Sem agendamentos neste dia
                </div>
              ) : (
                <div className="space-y-3">
                  {(["manha", "tarde", "noite", "sem_horario"] as const).map((turn) => {
                    const turnEvents = grouped[turn];
                    if (turnEvents.length === 0) return null;

                    return (
                      <div key={turn}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-[0.12em]",
                              turn === "sem_horario" ? "text-[#B45309]" : "text-[#9BAAB8]"
                            )}
                          >
                            {AGENDA_TURN_META[turn].label}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              turn === "sem_horario" ? "text-[#B45309]" : "text-[#9BAAB8]"
                            )}
                          >
                            {fmtNum(turnEvents.length)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {turnEvents.map((event) => (
                            <AgendaEventCard
                              key={event.id}
                              event={event}
                              compact
                              onOpen={onOpen}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthAgendaView({
  events,
  anchorDate,
  onOpen,
  onOpenDay,
}: {
  events: AgendaEvent[];
  anchorDate: Date;
  onOpen: (event: AgendaEvent) => void;
  onOpenDay: (date: Date) => void;
}) {
  const gridDays = getMonthGridDays(anchorDate);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1120px]">
        <div className="grid grid-cols-7 gap-2 px-1 pb-2">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
            <div
              key={label}
              className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {gridDays.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(event.dateValue, day));
            const visibleEvents = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - visibleEvents.length;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[168px] rounded-[20px] border border-[#E2E6EB] bg-white p-2.5 shadow-[0_8px_24px_rgba(15,25,35,0.04)]",
                  !isSameMonth(day, anchorDate) && "bg-[#FAFBFC] opacity-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  className="flex w-full items-center justify-between gap-2 rounded-[14px] px-1 py-0.5 text-left transition-colors hover:bg-[#F7F9FB]"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                      isToday(day)
                        ? "bg-[#EEF3FF] text-clinic-blue"
                        : "text-[#0F1923]"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 ? (
                    <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-[10px] font-medium text-clinic-blue">
                      {fmtNum(dayEvents.length)}
                    </span>
                  ) : null}
                </button>

                <div className="mt-2 space-y-1.5">
                  {visibleEvents.length === 0 ? (
                    <div className="flex min-h-[104px] items-center justify-center rounded-[16px] border border-dashed border-[#E2E6EB] bg-[#FAFBFC] px-2 text-center text-[11px] text-[#9BAAB8]">
                      Sem agendamentos
                    </div>
                  ) : (
                    <>
                      {visibleEvents.map((event) => {
                        const funnelMeta = AGENDA_FUNNEL_META[event.funnel];

                        return (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => onOpen(event)}
                            className="flex w-full items-start gap-2 rounded-[14px] border border-[#E2E6EB] bg-[#FAFBFC] px-2.5 py-2 text-left transition-colors hover:bg-[#F3F6FB]"
                          >
                            <span
                              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: funnelMeta.color }}
                            />
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] font-medium text-[#7C8B99]">
                                {event.timeLabel ?? "Sem horário"}
                              </p>
                              <p className="truncate text-[12px] font-medium text-[#0F1923]">
                                {event.patientName}
                              </p>
                              {event.amount > 0 ? (
                                <p className="mt-0.5 text-[10px] font-semibold text-clinic-blue">
                                  {fmtBRL(event.amount)}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}

                      {overflowCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => onOpenDay(day)}
                          className="w-full rounded-[12px] px-2 py-1 text-left text-[11px] font-medium text-clinic-blue transition-colors hover:bg-[#F7F9FB]"
                        >
                          +{fmtNum(overflowCount)} mais
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AbaAgenda() {
  const { events, isLoading } = useAgendaData();
  const [view, setView] = useState<AgendaView>("week");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [funnelFilter, setFunnelFilter] = useState<AgendaFunnelKey | "all">("all");
  const [turnFilter, setTurnFilter] = useState<AgendaTurnKey | "all">("all");
  const [responsavelFilter, setResponsavelFilter] = useState("__all__");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [onlyAds, setOnlyAds] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const range = useMemo(() => getAgendaRange(anchorDate, view), [anchorDate, view]);

  const rangeEvents = useMemo(
    () =>
      events.filter((event) =>
        isWithinInterval(event.dateValue, {
          start: range.start,
          end: range.end,
        })
      ),
    [events, range.end, range.start]
  );

  const funnelScopedEvents = useMemo(
    () =>
      rangeEvents.filter((event) => {
        if (onlyAds && !event.isAds) return false;
        if (funnelFilter !== "all" && event.funnel !== funnelFilter) return false;
        return true;
      }),
    [funnelFilter, onlyAds, rangeEvents]
  );

  const availableResponsavelOptions = useMemo(() => {
    const options = Array.from(
      new Set(funnelScopedEvents.map((event) => event.responsible))
    );
    return options.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [funnelScopedEvents]);

  const typeBaseEvents = useMemo(
    () =>
      funnelScopedEvents.filter((event) => {
        if (responsavelFilter === "__all__") return true;
        return event.responsible === responsavelFilter;
      }),
    [funnelScopedEvents, responsavelFilter]
  );

  const availableTypeOptions = useMemo(() => {
    if (funnelFilter === "all") return [];

    const options = Array.from(
      new Set(
        typeBaseEvents
          .map((event) => event.typeLabel)
          .filter((value): value is string => Boolean(value))
      )
    );

    return options.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [funnelFilter, typeBaseEvents]);

  const filteredEvents = useMemo(
    () =>
      typeBaseEvents.filter((event) => {
        if (typeFilter !== "__all__" && event.typeLabel !== typeFilter) return false;
        if (turnFilter !== "all" && event.turn !== turnFilter) return false;

        const normalizedSearch = normalizeAgendaSearch(deferredSearchTerm);
        if (!normalizedSearch) return true;

        return normalizeAgendaSearch(event.patientName).includes(normalizedSearch);
      }),
    [deferredSearchTerm, turnFilter, typeBaseEvents, typeFilter]
  );

  useEffect(() => {
    if (
      responsavelFilter !== "__all__" &&
      !availableResponsavelOptions.includes(responsavelFilter)
    ) {
      setResponsavelFilter("__all__");
    }
  }, [availableResponsavelOptions, responsavelFilter]);

  useEffect(() => {
    if (availableTypeOptions.length === 0 && typeFilter !== "__all__") {
      setTypeFilter("__all__");
      return;
    }

    if (
      typeFilter !== "__all__" &&
      availableTypeOptions.length > 0 &&
      !availableTypeOptions.includes(typeFilter)
    ) {
      setTypeFilter("__all__");
    }
  }, [availableTypeOptions, typeFilter]);

  useEffect(() => {
    if (selectedEvent && !filteredEvents.some((event) => event.id === selectedEvent.id)) {
      setSelectedEvent(null);
    }
  }, [filteredEvents, selectedEvent]);

  const summaryLabel = view === "day" ? "Resumo do dia" : "Resumo do período";
  const totalComHorario = filteredEvents.filter((event) => event.timeLabel).length;
  const totalSemHorario = filteredEvents.length - totalComHorario;
  const totalAnuncios = filteredEvents.filter((event) => event.isAds).length;
  const summaryByFunnel = AGENDA_FUNNEL_ORDER.map((funnel) => {
    const count = filteredEvents.filter((event) => event.funnel === funnel).length;
    return {
      funnel,
      count,
      meta: AGENDA_FUNNEL_META[funnel],
    };
  }).filter((item) => item.count > 0);

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-clinic-blue" />
            <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
              Agenda
            </h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
            Visão operacional dos agendamentos por Data de Agendamento, com filtros
            próprios e independentes do restante do dashboard.
          </p>
        </div>
      </div>

      <div className="panel-shell p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={view} onValueChange={(value) => setView(value as AgendaView)}>
              <TabsList className="h-9 rounded-xl bg-[#F3F5F7] p-1">
                {(["day", "week", "month"] as AgendaView[]).map((value) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-medium data-[state=active]:bg-white"
                  >
                    {VIEW_LABELS[value]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1 rounded-xl border border-[#E2E6EB] bg-[#FAFBFC] p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-[#5C6B7A]"
                onClick={() =>
                  setAnchorDate((current) =>
                    shiftAgendaAnchorDate(current, view, -1)
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-lg border-[#E2E6EB] px-3 text-[11px] text-[#5C6B7A]"
                onClick={() => setAnchorDate(startOfDay(new Date()))}
              >
                Hoje
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-[#5C6B7A]"
                onClick={() =>
                  setAnchorDate((current) =>
                    shiftAgendaAnchorDate(current, view, 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="inline-flex h-8 items-center rounded-xl border border-[#E2E6EB] bg-white px-3 text-[12px] font-medium text-[#0F1923]">
              {getAgendaRangeLabel(anchorDate, view)}
            </div>

            <AgendaDatePicker value={anchorDate} onSelect={(date) => date && setAnchorDate(startOfDay(date))} />
          </div>

          <div className="relative w-full xl:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BAAB8]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar paciente"
              className="h-9 rounded-xl border-[#E2E6EB] bg-white pl-9 text-[12px] text-[#0F1923] placeholder:text-[#9BAAB8]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-8 items-center gap-2 rounded-xl border border-[#E2E6EB] bg-white px-3 text-[11px] font-medium text-[#5C6B7A]">
              <Checkbox
                checked={onlyAds}
                onCheckedChange={(checked) => setOnlyAds(checked === true)}
              />
              Somente anúncios
            </label>

            <Select
              value={responsavelFilter}
              onValueChange={setResponsavelFilter}
            >
              <SelectTrigger className="h-8 w-[190px] rounded-xl text-[11px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos responsáveis</SelectItem>
                {availableResponsavelOptions.map((responsavel) => (
                  <SelectItem key={responsavel} value={responsavel}>
                    {responsavel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {funnelFilter !== "all" && availableTypeOptions.length > 0 ? (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-[178px] rounded-xl text-[11px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos tipos</SelectItem>
                  {availableTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {FUNNEL_FILTERS.map((item) => {
            const isActive = funnelFilter === item.key;
            const funnelMeta =
              item.key === "all" ? null : AGENDA_FUNNEL_META[item.key];

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFunnelFilter(item.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? funnelMeta
                      ? funnelMeta.soft
                      : "border-[#D7E6FF] bg-[#EEF4FF] text-clinic-blue"
                    : "border-[#E2E6EB] bg-white text-[#5C6B7A] hover:bg-[#F7F9FB]"
                )}
              >
                {item.label}
              </button>
            );
          })}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#E2E6EB] bg-white px-2.5 py-1 text-[10px] font-medium text-[#0F1923]">
              {summaryLabel}
            </span>
            <span className="rounded-full bg-[#F3F5F7] px-2.5 py-1 text-[10px] font-medium text-[#5C6B7A]">
              {fmtNum(filteredEvents.length)} agendamentos
            </span>
            <span className="rounded-full bg-[#F3F5F7] px-2.5 py-1 text-[10px] font-medium text-[#5C6B7A]">
              {fmtNum(totalComHorario)} com horário
            </span>
            {totalSemHorario > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E8] px-2.5 py-1 text-[10px] font-medium text-clinic-amber">
                <AlertTriangle className="h-3 w-3" />
                {fmtNum(totalSemHorario)} sem horário
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-medium text-clinic-blue">
              <Megaphone className="h-3 w-3" />
              {fmtNum(totalAnuncios)} anúncios
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TURN_FILTERS.map((item) => {
            const isActive = turnFilter === item.key;
            const isMissing = item.key === "sem_horario";

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTurnFilter(item.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  isActive
                    ? isMissing
                      ? "border-[#F6C27B] bg-[#FFF1DA] text-[#B45309]"
                      : "border-[#D7E6FF] bg-[#EEF4FF] text-clinic-blue"
                    : isMissing
                      ? "border-[#F6D7A7] bg-[#FFF9F1] text-[#B45309] hover:bg-[#FFF3E1]"
                      : "border-[#E2E6EB] bg-white text-[#5C6B7A] hover:bg-[#F7F9FB]"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {summaryByFunnel.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[18px] border border-[#E2E6EB] bg-[#FAFBFC] px-3 py-2">
            <p className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
              Distribuição por funil
            </p>
            {summaryByFunnel.map((item) => (
              <span
                key={item.funnel}
                className="inline-flex items-center gap-2 rounded-full border border-[#E2E6EB] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5C6B7A]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.meta.color }}
                />
                {item.meta.label}
                <span className="text-[#0F1923]">{fmtNum(item.count)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[22px] bg-[#F0F3F6]"
            />
          ))}
        </div>
      ) : view === "day" ? (
        <DayAgendaView
          events={filteredEvents}
          anchorDate={anchorDate}
          onOpen={setSelectedEvent}
        />
      ) : view === "week" ? (
        <WeekAgendaView
          events={filteredEvents}
          anchorDate={anchorDate}
          onOpen={setSelectedEvent}
          onOpenDay={(date) => {
            setAnchorDate(startOfDay(date));
            setView("day");
          }}
        />
      ) : (
        <MonthAgendaView
          events={filteredEvents}
          anchorDate={anchorDate}
          onOpen={setSelectedEvent}
          onOpenDay={(date) => {
            setAnchorDate(startOfDay(date));
            setView("day");
          }}
        />
      )}

      <AgendaDetailSheet
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
    </div>
  );
}


