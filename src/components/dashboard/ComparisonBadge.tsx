import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/fmt";
import type { MetricComparison } from "@/lib/comparison";

type ComparisonBadgeProps = {
  comparison?: MetricComparison;
  className?: string;
  compact?: boolean;
};

function getComparisonLabel(comparison: MetricComparison) {
  if (comparison.direction === "flat") {
    return "Sem variacao vs periodo anterior";
  }

  if (comparison.deltaPct === null) {
    return comparison.direction === "up"
      ? "Acima do periodo anterior"
      : "Abaixo do periodo anterior";
  }

  const prefix = comparison.deltaPct > 0 ? "+" : "";
  return `${prefix}${fmtPct(comparison.deltaPct)} vs periodo anterior`;
}

export function ComparisonBadge({
  comparison,
  className,
  compact = false,
}: ComparisonBadgeProps) {
  if (!comparison) {
    return null;
  }

  const styles =
    comparison.direction === "up"
      ? {
          container: "bg-[#EEF4FF] text-clinic-blue",
          icon: TrendingUp,
        }
      : comparison.direction === "down"
        ? {
            container: "bg-[#FFF4E8] text-clinic-amber",
            icon: TrendingDown,
          }
        : {
            container: "bg-[#F3F5F7] text-[#7C8B99]",
            icon: Minus,
          };

  const Icon = styles.icon;

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none",
        styles.container,
        compact && "px-1.5 py-0.5 text-[10px]",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
      <span>{getComparisonLabel(comparison)}</span>
    </span>
  );
}
