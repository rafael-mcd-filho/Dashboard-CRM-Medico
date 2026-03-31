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
      <h3 className="text-[13px] font-semibold text-[#0F1923]">{title}</h3>
      {tooltip ? (
        <UiTooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 shrink-0 cursor-help text-[#C8D2DC] hover:text-[#9BAAB8]" />
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
