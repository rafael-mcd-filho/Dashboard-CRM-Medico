import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseBRDate } from "@/lib/parse";

export const AGENDA_FUNNEL_META = {
  consultas: {
    key: "consultas",
    label: "Consultas",
    serviceLabel: "Consulta médica",
    shortLabel: "Consulta",
    color: "#8B5E34",
    surface: "#FFF7ED",
    border: "#E7C9AF",
    text: "#6F461E",
    soft: "bg-[#FFF7ED] text-[#6F461E] border-[#E7C9AF]",
    durationMinutes: 30,
  },
  espirometria: {
    key: "espirometria",
    label: "Espirometria",
    serviceLabel: "Exame de espirometria",
    shortLabel: "Espiro",
    color: "#16A34A",
    surface: "#EDFFF3",
    border: "#BDEFCB",
    text: "#0C6E28",
    soft: "bg-[#EDFFF3] text-[#0C6E28] border-[#BDEFCB]",
    durationMinutes: 15,
  },
  broncoscopia: {
    key: "broncoscopia",
    label: "Broncoscopia",
    serviceLabel: "Broncoscopia",
    shortLabel: "Bronco",
    color: "#1D4ED8",
    surface: "#EEF4FF",
    border: "#BCD2FF",
    text: "#153E9B",
    soft: "bg-[#EEF4FF] text-[#153E9B] border-[#BCD2FF]",
    durationMinutes: 30,
  },
  cirurgia: {
    key: "cirurgia",
    label: "Cirurgia",
    serviceLabel: "Cirurgia de hiperidrose",
    shortLabel: "Hiperidrose",
    color: "#A3B32F",
    surface: "#FAFDEB",
    border: "#DCE88C",
    text: "#58630D",
    soft: "bg-[#FAFDEB] text-[#58630D] border-[#DCE88C]",
    durationMinutes: 90,
  },
} as const;

export const AGENDA_FUNNEL_ORDER = [
  "consultas",
  "espirometria",
  "broncoscopia",
  "cirurgia",
] as const;

export const AGENDA_TURN_META = {
  manha: {
    label: "Manhã",
    range: "06:00-11:59",
  },
  tarde: {
    label: "Tarde",
    range: "12:00-17:59",
  },
  noite: {
    label: "Noite",
    range: "18:00-23:59",
  },
  sem_horario: {
    label: "Sem horário",
    range: "",
  },
} as const;

export type AgendaFunnelKey = keyof typeof AGENDA_FUNNEL_META;
export type AgendaView = "day" | "week" | "month";
export type AgendaTurnKey = keyof typeof AGENDA_TURN_META;

export type AgendaEvent = {
  id: string;
  funnel: AgendaFunnelKey;
  patientName: string;
  dateLabel: string;
  dateValue: Date;
  timeLabel: string | null;
  timeMinutes: number | null;
  durationMinutes: number;
  turn: AgendaTurnKey;
  responsible: string;
  stage: string;
  modality: string;
  paymentForm: string;
  isRetorno: boolean;
  serviceLabel: string;
  typeLabel: string | null;
  amount: number;
  origin: string;
  isAds: boolean;
  contactId: string | null;
  conversationLink: string | null;
  cardId: string | null;
  crmKey: string | null;
  cardDescription: string | null;
};

export type AgendaRange = {
  start: Date;
  end: Date;
};

const EXCLUDED_STAGES = new Set(["captacao", "negociacao", "perdido"]);

export function normalizeAgendaStage(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isAgendaStageVisible(value: string | null | undefined) {
  const normalized = normalizeAgendaStage(value);
  return normalized.length > 0 && !EXCLUDED_STAGES.has(normalized);
}

export function getAgendaDisplayLabel(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : "Não definido";
}

export function normalizeAgendaTime(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  const match = raw.match(/(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const hours = match[1].padStart(2, "0");
  const minutes = match[2].padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getAgendaMinutes(value: string | null | undefined) {
  const normalized = normalizeAgendaTime(value);
  if (!normalized) return null;

  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatAgendaMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatAgendaDuration(minutes: number) {
  return `${minutes} min`;
}

export function getAgendaEventEndMinutes(
  event: Pick<AgendaEvent, "timeMinutes" | "durationMinutes">
) {
  return event.timeMinutes === null ? null : event.timeMinutes + event.durationMinutes;
}

export function getAgendaEventTimeRange(
  event: Pick<AgendaEvent, "timeLabel" | "timeMinutes" | "durationMinutes">
) {
  if (event.timeMinutes === null) return null;

  const start = event.timeLabel ?? formatAgendaMinutes(event.timeMinutes);
  const end = formatAgendaMinutes(event.timeMinutes + event.durationMinutes);
  return `${start}-${end}`;
}

export function getAgendaTurn(value: string | null | undefined): AgendaTurnKey {
  const minutes = getAgendaMinutes(value);

  if (minutes === null) return "sem_horario";
  if (minutes < 12 * 60) return "manha";
  if (minutes < 18 * 60) return "tarde";
  return "noite";
}

export function parseAgendaDate(value: string | null | undefined) {
  return parseBRDate(value);
}

export function sortAgendaEvents(a: AgendaEvent, b: AgendaEvent) {
  const dateDiff = a.dateValue.getTime() - b.dateValue.getTime();
  if (dateDiff !== 0) return dateDiff;

  if (a.timeMinutes === null && b.timeMinutes !== null) return 1;
  if (a.timeMinutes !== null && b.timeMinutes === null) return -1;
  if (a.timeMinutes !== null && b.timeMinutes !== null) {
    const timeDiff = a.timeMinutes - b.timeMinutes;
    if (timeDiff !== 0) return timeDiff;
  }

  const durationDiff = b.durationMinutes - a.durationMinutes;
  if (durationDiff !== 0) return durationDiff;

  return a.patientName.localeCompare(b.patientName);
}

export function getAgendaRange(anchorDate: Date, view: AgendaView): AgendaRange {
  const normalized = startOfDay(anchorDate);

  if (view === "day") {
    return { start: normalized, end: normalized };
  }

  if (view === "week") {
    return {
      start: startOfWeek(normalized, { weekStartsOn: 1 }),
      end: endOfWeek(normalized, { weekStartsOn: 1 }),
    };
  }

  return {
    start: startOfMonth(normalized),
    end: endOfMonth(normalized),
  };
}

export function shiftAgendaAnchorDate(
  anchorDate: Date,
  view: AgendaView,
  direction: 1 | -1,
) {
  if (view === "day") return addDays(anchorDate, direction);
  if (view === "week") return addWeeks(anchorDate, direction);
  return addMonths(anchorDate, direction);
}

export function getAgendaRangeLabel(anchorDate: Date, view: AgendaView) {
  const { start, end } = getAgendaRange(anchorDate, view);

  if (view === "day") {
    return format(start, "EEEE, dd 'de' MMMM", { locale: ptBR });
  }

  if (view === "week") {
    if (isSameMonth(start, end)) {
      return `${format(start, "dd", { locale: ptBR })}–${format(end, "dd 'de' MMMM", {
        locale: ptBR,
      })}`;
    }

    return `${format(start, "dd 'de' MMM", { locale: ptBR })}–${format(end, "dd 'de' MMM", {
      locale: ptBR,
    })}`;
  }

  return format(start, "MMMM 'de' yyyy", { locale: ptBR });
}

export function getWeekDays(anchorDate: Date) {
  const { start, end } = getAgendaRange(anchorDate, "week");
  return eachDayOfInterval({ start, end });
}

export function getMonthGridDays(anchorDate: Date) {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}
