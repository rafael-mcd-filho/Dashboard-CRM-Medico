import { Info } from "lucide-react";
import { ComparisonBadge } from "@/components/dashboard/ComparisonBadge";
import { cn } from "@/lib/utils";
import type { MetricComparison } from "@/lib/comparison";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const valueColorMap = {
  default: "text-slate-900",
  success: "text-clinic-green",
  danger:  "text-clinic-red",
  warning: "text-clinic-amber",
  teal:    "text-clinic-teal",
  purple:  "text-clinic-purple",
  blue:    "text-clinic-blue",
} as const;

interface KpiCardProps {
  label: string;
  value: string | number;
  tooltip: string;
  isLoading?: boolean;
  sub?: string;
  valueColor?: keyof typeof valueColorMap;
  size?: "default" | "lg";
  comparison?: MetricComparison;
  inverseSentiment?: boolean;
}

export function KpiCard({
  label,
  value,
  tooltip,
  isLoading,
  sub,
  valueColor = "default",
  size = "default",
  comparison,
  inverseSentiment,
}: KpiCardProps) {
  return (
    <div className="panel-shell panel-shell-hover flex min-w-0 flex-col gap-2 p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="section-label min-w-0 flex-1 leading-tight [overflow-wrap:anywhere]">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Mais informações sobre ${label}`}
              className="mt-0.5 shrink-0 text-slate-300 transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-offset-1 rounded"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading ? (
        <div className="skeleton h-8 w-24" />
      ) : (
        <span
          className={cn(
            "block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere]",
            size === "lg" ? "kpi-value-lg" : "kpi-value",
            valueColorMap[valueColor]
          )}
        >
          {value}
        </span>
      )}

      {!isLoading && comparison ? (
        <ComparisonBadge comparison={comparison} inverseSentiment={inverseSentiment} />
      ) : null}

      {sub && !isLoading && (
        <span className="text-xs text-slate-400">{sub}</span>
      )}
    </div>
  );
}
