import { format } from "date-fns";
import { CalendarIcon, Megaphone, RotateCcw } from "lucide-react";
import { useFilters, type AtalhosPeriodo } from "@/contexts/FiltersContext";
import { SEM_RESPONSAVEL_VALUE } from "@/lib/cardFilters";
import { getDateModeLabel, type DashboardDateMode } from "@/lib/dateMode";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LiveDataBadge } from "@/components/layout/LiveDataBadge";

const atalhos: { label: string; value: AtalhosPeriodo }[] = [
  { label: "Hoje",             value: "hoje"            },
  { label: "Esta semana",      value: "esta_semana"     },
  { label: "Semana anterior",  value: "semana_anterior" },
  { label: "Este mês",         value: "este_mes"        },
  { label: "Mês anterior",     value: "mes_anterior"    },
  { label: "Este ano",         value: "este_ano"        },
  { label: "Todo período",     value: "todo_periodo"    },
  { label: "Personalizado",    value: "customizado"     },
];

const modosData: { label: string; value: DashboardDateMode }[] = [
  { label: "Criação do Card",   value: "criacao"     },
  { label: "Data Agendamento",  value: "agendamento" },
];

/* Conta filtros não-default para exibir badge */
function useActiveFilterCount() {
  const { filters } = useFilters();
  let count = 0;
  if (filters.atalho !== "este_mes" && filters.atalho !== "todo_periodo") count++;
  if (filters.tipoData !== "criacao") count++;
  if (filters.responsavel) count++;
  if (filters.somenteAnuncios) count++;
  return count;
}

/* Utilitário para formatar rótulo do período anterior no tooltip */
function usePreviousPeriodLabel() {
  const { filters } = useFilters();
  const { atalho } = filters;
  const map: Record<string, string> = {
    hoje: "ontem",
    esta_semana: "semana anterior",
    semana_anterior: "semana retrasada",
    este_mes: "mês anterior",
    mes_anterior: "mês retrasado",
    este_ano: "ano anterior",
  };
  return map[atalho] ?? "período anterior";
}

function DateButton({
  value,
  onSelect,
  label,
}: {
  value: Date;
  onSelect: (date: Date | undefined) => void;
  label: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex h-7 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {format(value, "dd/MM/yyyy")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
  );
}

/* Separador vertical entre grupos */
function GroupDivider() {
  return (
    <div aria-hidden="true" className="h-5 w-px self-center bg-slate-200" />
  );
}

export function GlobalFilters() {
  const {
    filters,
    setFilters,
    setAtalho,
    responsavelOptions,
    optionsLoading,
  } = useFilters();

  const activeCount = useActiveFilterCount();

  const handleClear = () => {
    setAtalho("este_mes");
    setFilters({
      tipoData:         "criacao",
      responsavel:      "",
      somenteAnuncios:  false,
    });
  };

  return (
    <div className="shrink-0 border-b border-border bg-background">
      {/* Linha principal de filtros */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 py-1.5">

        {/* ── Grupo PERÍODO ── */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.atalho}
            onValueChange={(v) => setAtalho(v as AtalhosPeriodo)}
          >
            <SelectTrigger className="h-7 w-[160px] rounded-[var(--radius-md)] border-slate-200 text-[12px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {atalhos.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-[12px]">
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-1.5 py-1">
            <DateButton
              label="Data inicial"
              value={filters.dataInicio}
              onSelect={(d) =>
                d && setFilters({ dataInicio: d, atalho: "customizado" })
              }
            />
            <span aria-hidden="true" className="px-1 text-[11px] text-slate-400">–</span>
            <DateButton
              label="Data final"
              value={filters.dataFim}
              onSelect={(d) =>
                d && setFilters({ dataFim: d, atalho: "customizado" })
              }
            />
          </div>
        </div>

        <GroupDivider />

        {/* ── Grupo VISÃO ── */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.tipoData}
            onValueChange={(v) => setFilters({ tipoData: v as DashboardDateMode })}
          >
            <SelectTrigger className="h-7 w-[196px] rounded-[var(--radius-md)] border-slate-200 text-[12px]">
              <SelectValue placeholder="Visão por" />
            </SelectTrigger>
            <SelectContent>
              {modosData.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-[12px]">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex h-7 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-[12px] text-slate-600 transition-colors hover:bg-slate-50">
            <Checkbox
              checked={filters.somenteAnuncios}
              onCheckedChange={(v) => setFilters({ somenteAnuncios: v === true })}
              aria-label="Somente anúncios"
            />
            <span>Anúncios</span>
            {filters.somenteAnuncios && (
              <span
                aria-hidden="true"
                className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
              />
            )}
          </label>
        </div>

        <GroupDivider />

        {/* ── Grupo EQUIPE ── */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.responsavel || "__all__"}
            onValueChange={(v) =>
              setFilters({ responsavel: v === "__all__" ? "" : v })
            }
          >
            <SelectTrigger
              className="h-7 w-[176px] rounded-[var(--radius-md)] border-slate-200 text-[12px]"
              disabled={optionsLoading}
            >
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__" className="text-[12px]">
                Todos responsáveis
              </SelectItem>
              <SelectItem value={SEM_RESPONSAVEL_VALUE} className="text-[12px]">
                Sem responsável
              </SelectItem>
              {responsavelOptions.map((r) => (
                <SelectItem key={r} value={r} className="text-[12px]">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Botão Limpar (quando há filtros ativos) ── */}
        {activeCount > 0 && (
          <>
            <GroupDivider />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={`Limpar ${activeCount} filtro${activeCount > 1 ? "s" : ""} ativo${activeCount > 1 ? "s" : ""}`}
                  className="flex h-7 items-center gap-1.5 rounded-[var(--radius-md)] border border-slate-200 bg-white px-2.5 text-[12px] text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Limpar
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-semibold text-slate-600">
                    {activeCount}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Restaurar filtros padrão
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* ── Live data indicator ── */}
        <LiveDataBadge />
      </div>

      {/* ── Avisos contextuais (linha fina abaixo) ── */}
      {(filters.somenteAnuncios || filters.tipoData === "agendamento") && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-t px-5 py-1.5",
            filters.somenteAnuncios
              ? "border-amber-100 bg-amber-50"
              : "border-blue-100 bg-blue-50"
          )}
        >
          {filters.somenteAnuncios && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
              <Megaphone className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>Modo anúncio: dados refletem apenas contatos de anúncio.</span>
            </div>
          )}
          {filters.tipoData === "agendamento" && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700">
              <CalendarIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>
                Visão por {getDateModeLabel(filters.tipoData)} ativa nos funis. Aba Contatos
                usa Data de Criação.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
