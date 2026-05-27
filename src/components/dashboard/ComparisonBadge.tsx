import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/lib/fmt";
import type { MetricComparison } from "@/lib/comparison";

type ComparisonBadgeProps = {
  comparison?: MetricComparison;
  className?: string;
  compact?: boolean;
  /**
   * inverseSentiment: true para métricas onde "menos é melhor"
   * (ex.: prazo médio, no-show, custo).
   * Quando true: down = verde (bom), up = vermelho (ruim).
   */
  inverseSentiment?: boolean;
};

function getComparisonLabel(comparison: MetricComparison) {
  if (comparison.direction === "flat") {
    return "Sem variação vs período anterior";
  }

  if (comparison.deltaPct === null) {
    return comparison.direction === "up"
      ? "Acima do período anterior"
      : "Abaixo do período anterior";
  }

  const prefix = comparison.deltaPct > 0 ? "+" : "";
  return `${prefix}${fmtPct(comparison.deltaPct)} vs período anterior`;
}

export function ComparisonBadge({
  comparison,
  className,
  compact = false,
  inverseSentiment = false,
}: ComparisonBadgeProps) {
  if (!comparison) {
    return null;
  }

  const isUp   = comparison.direction === "up";
  const isDown = comparison.direction === "down";
  const isFlat = comparison.direction === "flat";

  // Sentimento positivo: up=azul/verde, down=âmbar/vermelho
  // Sentimento inverso:  up=vermelho,   down=verde
  const goodUp   = !inverseSentiment;
  const goodDown = inverseSentiment;

  const styles = isFlat
    ? { container: "bg-slate-100 text-slate-500", icon: Minus }
    : isUp
      ? goodUp
        ? { container: "bg-[#ECFDF5] text-emerald-600",  icon: TrendingUp   }
        : { container: "bg-[#FEF2F2] text-red-500",       icon: TrendingUp   }
      : goodDown
        ? { container: "bg-[#ECFDF5] text-emerald-600",  icon: TrendingDown }
        : { container: "bg-[#FFF7ED] text-amber-600",     icon: TrendingDown };

  const Icon = styles.icon;

  return (
    <span
      aria-label={getComparisonLabel(comparison)}
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium leading-none",
        compact ? "text-[10px]" : "text-[11px]",
        styles.container,
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")}
      />
      <span>{getComparisonLabel(comparison)}</span>
    </span>
  );
}
