import { useEffect, useReducer, useRef, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * LiveDataBadge — mostra o status de sincronização das queries React Query.
 *
 * • Ponto verde pulsando enquanto qualquer query está buscando dados.
 * • "Atualizado há X min" quando ociosa, com botão de re-fetch.
 * • Contador refresca a cada 30 s automaticamente.
 */
export function LiveDataBadge() {
  const queryClient   = useQueryClient();
  const fetchingCount = useIsFetching();
  const isFetching    = fetchingCount > 0;

  /* Rastreia quando o último fetch completou */
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const wasFetchingRef = useRef(false);

  useEffect(() => {
    if (wasFetchingRef.current && !isFetching) {
      setLastUpdated(new Date());
    }
    wasFetchingRef.current = isFetching;
  }, [isFetching]);

  /* Força re-render a cada 30s para manter o label "X min atrás" atualizado */
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    void queryClient.invalidateQueries();
  };

  const ageLabel = formatDistanceToNow(lastUpdated, {
    locale:    ptBR,
    addSuffix: false,
  });

  return (
    <div
      className="ml-auto flex items-center gap-2"
      aria-live="polite"
      aria-label={isFetching ? "Atualizando dados" : `Dados atualizados há ${ageLabel}`}
    >
      {/* Indicador pulsante */}
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 shrink-0 rounded-full transition-colors duration-300",
          isFetching
            ? "animate-[pulseScale_1.2s_ease-in-out_infinite] bg-clinic-green"
            : "bg-slate-300",
        )}
      />

      {/* Label */}
      <span className="select-none text-[11px] text-slate-400">
        {isFetching ? "Atualizando…" : `Atualizado há ${ageLabel}`}
      </span>

      {/* Botão re-fetch (apenas quando ocioso) */}
      {!isFetching && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Recarregar dados"
              className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] text-slate-400 transition-colors hover:bg-slate-100 hover:text-clinic-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Recarregar dados
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
