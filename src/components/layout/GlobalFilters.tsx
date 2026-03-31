import { format } from "date-fns";
import { CalendarIcon, Megaphone } from "lucide-react";
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

const atalhos: { label: string; value: AtalhosPeriodo }[] = [
  { label: "Hoje", value: "hoje" },
  { label: "Esta semana", value: "esta_semana" },
  { label: "Semana anterior", value: "semana_anterior" },
  { label: "Este mês", value: "este_mes" },
  { label: "Mês anterior", value: "mes_anterior" },
  { label: "Este ano", value: "este_ano" },
  { label: "Todo período", value: "todo_periodo" },
  { label: "Personalizado", value: "customizado" },
];

const modosData: { label: string; value: DashboardDateMode }[] = [
  { label: "Data de Criação do Card", value: "criacao" },
  { label: "Data de Agendamento", value: "agendamento" },
];

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
          className="flex h-7 items-center gap-1 rounded-md border border-border bg-white px-2 text-[11px] text-[#5C6B7A] hover:bg-[#F7F9FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
        >
          <CalendarIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
          {format(value, "dd/MM/yyyy")}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onSelect} />
      </PopoverContent>
    </Popover>
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

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1.5 border-b border-border bg-white/90 px-4 py-1.5 backdrop-blur-md shadow-[0_1px_0_rgba(15,25,35,0.04),0_2px_8px_rgba(15,25,35,0.04)]">
      <Select
        value={filters.atalho}
        onValueChange={(value) => setAtalho(value as AtalhosPeriodo)}
      >
        <SelectTrigger className="h-7 w-[172px] text-[11px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {atalhos.map((atalho) => (
            <SelectItem key={atalho.value} value={atalho.value}>
              {atalho.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.tipoData}
        onValueChange={(value) =>
          setFilters({ tipoData: value as DashboardDateMode })
        }
      >
        <SelectTrigger className="h-7 w-[212px] text-[11px]">
          <SelectValue placeholder="Visão por" />
        </SelectTrigger>
        <SelectContent>
          {modosData.map((modo) => (
            <SelectItem key={modo.value} value={modo.value}>
              {modo.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-[#FAFBFC] px-1 py-0.5">
        <DateButton
          label="Data inicial"
          value={filters.dataInicio}
          onSelect={(date) =>
            date && setFilters({ dataInicio: date, atalho: "customizado" })
          }
        />
        <span className="px-1 text-[11px] text-[#9BAAB8]" aria-hidden="true">até</span>
        <DateButton
          label="Data final"
          value={filters.dataFim}
          onSelect={(date) =>
            date && setFilters({ dataFim: date, atalho: "customizado" })
          }
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-white px-2 text-[11px] text-[#5C6B7A] hover:bg-[#F7F9FB]">
          <Checkbox
            checked={filters.somenteAnuncios}
            onCheckedChange={(checked) =>
              setFilters({ somenteAnuncios: checked === true })
            }
          />
          <span>Somente anúncios</span>
        </label>

        <Select
          value={filters.responsavel || "__all__"}
          onValueChange={(value) =>
            setFilters({ responsavel: value === "__all__" ? "" : value })
          }
        >
          <SelectTrigger className="h-7 w-[176px] text-[11px]" disabled={optionsLoading}>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos responsáveis</SelectItem>
            <SelectItem value={SEM_RESPONSAVEL_VALUE}>Cards sem responsável</SelectItem>
            {responsavelOptions.map((responsavel) => (
              <SelectItem key={responsavel} value={responsavel}>
                {responsavel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.somenteAnuncios && (
        <div className="flex items-center gap-1.5 rounded-full border border-[#FCD34D] bg-[#FFF7E6] px-2.5 py-1 text-[11px] font-medium text-[#B45309]">
          <Megaphone className="h-3 w-3" aria-hidden="true" />
          <span>Modo anúncio ativo: os dados refletem apenas contatos de anúncio.</span>
        </div>
      )}

      {filters.tipoData === "agendamento" && (
        <div className="flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-medium text-clinic-blue">
          <CalendarIcon className="h-3 w-3" aria-hidden="true" />
          <span>
            Visão por {getDateModeLabel(filters.tipoData)} ativa nos funis. A aba Contatos segue pela Data de Criação do Contato.
          </span>
        </div>
      )}
    </div>
  );
}
