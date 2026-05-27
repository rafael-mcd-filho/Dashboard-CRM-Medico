import { Info, type LucideIcon } from "lucide-react";
import { ComparisonBadge } from "@/components/dashboard/ComparisonBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MetricComparison } from "@/lib/comparison";

/**
 * toneMap — border-l colorida + cor do valor
 * Design: borda esquerda 2px sutil em vez de rail-top + glow radial
 */
const toneMap = {
  blue: {
    border:  "border-l-[3px] border-l-clinic-blue",
    label:   "text-clinic-blue",
    value:   "text-slate-900",
    iconBg:  "bg-[#EEF4FF] text-clinic-blue",
  },
  teal: {
    border:  "border-l-[3px] border-l-clinic-teal",
    label:   "text-clinic-teal",
    value:   "text-slate-900",
    iconBg:  "bg-[#EAF8FC] text-clinic-teal",
  },
  purple: {
    border:  "border-l-[3px] border-l-clinic-purple",
    label:   "text-clinic-purple",
    value:   "text-slate-900",
    iconBg:  "bg-[#F3EDFF] text-clinic-purple",
  },
  amber: {
    border:  "border-l-[3px] border-l-clinic-amber",
    label:   "text-clinic-amber",
    value:   "text-slate-900",
    iconBg:  "bg-[#FFF7ED] text-clinic-amber",
  },
} as const;

/** Converte array de valores em pontos SVG para sparkline */
function buildSparklinePoints(trend: number[], width = 120, height = 28): string {
  if (trend.length < 2) return "";
  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min;
  const pad = 4;
  return trend
    .map((v, i) => {
      const x = ((i / (trend.length - 1)) * width).toFixed(1);
      const y = range > 0
        ? (height - pad - ((v - min) / range) * (height - pad * 2)).toFixed(1)
        : (height / 2).toFixed(1);
      return `${x},${y}`;
    })
    .join(" ");
}

type HeroMetricCardProps = {
  label: string;
  value: string;
  description: string;
  tooltip: string;
  icon: LucideIcon;
  tone?: keyof typeof toneMap;
  isLoading?: boolean;
  comparison?: MetricComparison;
  inverseSentiment?: boolean;
  /** Série de valores para o sparkline (usa dados reais quando fornecido) */
  trend?: number[];
  /** onClick: abre drill-down ao clicar */
  onClick?: () => void;
};

export function HeroMetricCard({
  label,
  value,
  description,
  tooltip,
  icon: Icon,
  tone = "blue",
  isLoading,
  comparison,
  inverseSentiment,
  trend,
  onClick,
}: HeroMetricCardProps) {
  const styles = toneMap[tone];
  const isInteractive = Boolean(onClick);

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
      className={cn(
        "panel-shell relative overflow-hidden p-5",
        styles.border,
        "transition-[box-shadow,transform] duration-200",
        isInteractive
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-offset-2"
          : "hover:-translate-y-0.5 hover:shadow-pop"
      )}
    >
      {/* Cabeçalho: label + ícone + tooltip */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              styles.iconBg
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className={cn("section-label", styles.label)}>{label}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Mais informações sobre ${label}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0 text-slate-300 transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue rounded"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Valor + delta */}
      <div className="mt-4">
        {isLoading ? (
          <div className="skeleton h-9 w-28" />
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={cn("kpi-value-lg", styles.value)}>{value}</span>
            {comparison ? (
              <ComparisonBadge
                comparison={comparison}
                compact
                inverseSentiment={inverseSentiment}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Descrição — máx 1 linha */}
      {!isLoading && (
        <p className="mt-2 truncate text-[12px] leading-5 text-slate-500">
          {description}
        </p>
      )}

      {/* Sparkline — dados reais quando fornecidos, fallback para linha estática */}
      {!isLoading && (
        <div
          aria-hidden="true"
          className="mt-3 h-[28px] overflow-hidden opacity-30"
          title="Tendência do período"
        >
          <svg
            viewBox="0 0 120 28"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <polyline
              points={
                trend && trend.length >= 2
                  ? buildSparklinePoints(trend)
                  : "0,22 15,18 30,20 45,14 60,16 75,10 90,12 105,6 120,8"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                tone === "blue"   && "text-clinic-blue",
                tone === "teal"   && "text-clinic-teal",
                tone === "purple" && "text-clinic-purple",
                tone === "amber"  && "text-clinic-amber"
              )}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
