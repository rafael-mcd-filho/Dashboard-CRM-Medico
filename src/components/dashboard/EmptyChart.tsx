import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyChartProps {
  label?: string;
  height?: string; // Tailwind height class, e.g. "h-44"
  className?: string;
}

export function EmptyChart({
  label = "Sem dados no período",
  height = "h-44",
  className,
}: EmptyChartProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        height,
        className,
      )}
    >
      <BarChart2
        className="h-8 w-8 text-slate-200"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="text-sm text-[#9BAAB8]">{label}</p>
    </div>
  );
}
