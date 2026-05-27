import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { ComparisonBadge } from "@/components/dashboard/ComparisonBadge";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MetricComparison } from "@/lib/comparison";

type PanelTitleProps = {
  title: string;
  tooltip?: string;
  comparison?: MetricComparison;
  extra?: ReactNode;
};

export function PanelTitle({
  title,
  tooltip,
  comparison,
  extra,
}: PanelTitleProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      {tooltip ? (
        <UiTooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Mais informações sobre ${title}`}
              className="shrink-0 text-slate-300 transition-colors hover:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue rounded"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
            {tooltip}
          </TooltipContent>
        </UiTooltip>
      ) : null}
      {comparison ? <ComparisonBadge comparison={comparison} compact /> : null}
      {extra}
    </div>
  );
}
