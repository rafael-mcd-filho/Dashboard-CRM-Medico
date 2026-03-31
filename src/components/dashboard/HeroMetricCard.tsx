import { Info, type LucideIcon } from "lucide-react";
import { ComparisonBadge } from "@/components/dashboard/ComparisonBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MetricComparison } from "@/lib/comparison";

const toneMap = {
  blue: {
    rail: "bg-[#1A56DB]",
    chip: "bg-[#EEF4FF]",
    icon: "text-clinic-blue",
    value: "text-clinic-blue",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(26,86,219,0.12),transparent_55%)]",
  },
  teal: {
    rail: "bg-[#0891B2]",
    chip: "bg-[#EAF8FC]",
    icon: "text-clinic-teal",
    value: "text-clinic-teal",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(8,145,178,0.12),transparent_55%)]",
  },
  purple: {
    rail: "bg-[#7C3AED]",
    chip: "bg-[#F3EDFF]",
    icon: "text-clinic-purple",
    value: "text-clinic-purple",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.12),transparent_55%)]",
  },
  amber: {
    rail: "bg-[#B45309]",
    chip: "bg-[#FFF4E8]",
    icon: "text-clinic-amber",
    value: "text-clinic-amber",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.12),transparent_55%)]",
  },
} as const;

type HeroMetricCardProps = {
  label: string;
  value: string;
  description: string;
  tooltip: string;
  icon: LucideIcon;
  tone?: keyof typeof toneMap;
  isLoading?: boolean;
  comparison?: MetricComparison;
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
}: HeroMetricCardProps) {
  const styles = toneMap[tone];

  return (
    <div className="panel-shell relative overflow-visible p-5 transition-[box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-card-hover">
      <div className={`pointer-events-none absolute inset-0 rounded-[24px] ${styles.glow}`} />
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-[24px] ${styles.rail}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.chip}`}>
              <Icon className={`h-4 w-4 ${styles.icon}`} />
            </div>
            <span className="section-label">{label}</span>
          </div>

          {isLoading ? (
            <div className="mt-4 h-9 w-24 animate-pulse rounded-md bg-[#F0F3F6]" />
          ) : (
            <div className="mt-4 space-y-1.5">
              <div className={`kpi-value-lg ${styles.value}`}>{value}</div>
              {comparison ? <ComparisonBadge comparison={comparison} compact /> : null}
            </div>
          )}

          <p className="mt-1.5 max-w-[31ch] text-[13px] leading-5 text-[#5C6B7A]">
            {description}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-help text-[#C8D2DC] hover:text-[#9BAAB8]" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
