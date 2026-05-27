import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtNum, fmtPct } from "@/lib/fmt";
import { cn } from "@/lib/utils";

export type CrossFunnelItem = {
  name: string;
  value: number;
  share: number;
  color: string;
};

type CrossFunnelPanelProps = {
  title: string;
  tooltip: string;
  items: CrossFunnelItem[];
  baseValue: number;
  baseLabel: string;
  comparison?: MetricComparison;
  isLoading?: boolean;
  emptyLabel?: string;
  /** Chamado quando o usuário clica em um item para ver o drill-down */
  onItemClick?: (name: string) => void;
};

export function CrossFunnelPanel({
  title,
  tooltip,
  items,
  baseValue,
  baseLabel,
  comparison,
  isLoading,
  emptyLabel = "Sem contatos em consultas no período",
  onItemClick,
}: CrossFunnelPanelProps) {
  const hasData = items.some((item) => item.value > 0);
  const isInteractive = Boolean(onItemClick);

  return (
    <div className="panel-shell p-4">
      <PanelTitle
        title={title}
        tooltip={tooltip}
        comparison={comparison}
        extra={
          <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-medium text-clinic-blue">
            {baseLabel}: {fmtNum(baseValue)}
          </span>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-[70px] w-full" />
          ))}
        </div>
      ) : !hasData || baseValue === 0 ? (
        <div className="flex h-48 items-center justify-center text-center text-[13px] text-slate-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Wrapper = isInteractive ? "button" : "div";
            return (
            <Wrapper
              key={item.name}
              {...(isInteractive
                ? {
                    type: "button" as const,
                    onClick: () => onItemClick?.(item.name),
                    "aria-label": `Ver detalhes de ${item.name}`,
                  }
                : {})}
              className={cn(
                "w-full rounded-[var(--radius-md)] border border-slate-100 bg-white p-3 text-left transition-colors",
                isInteractive
                  ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
                  : "hover:border-slate-200 hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-[13px] font-semibold text-slate-800">
                      {item.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {fmtPct(item.share)} da base de consultas
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-mono text-[1.125rem] font-bold leading-none tracking-[-0.02em] font-variant-numeric tabular-nums"
                    style={{ color: item.color }}
                  >
                    {fmtNum(item.value)}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    contatos
                  </p>
                </div>
              </div>

              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={Math.round(item.share * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.name}: ${fmtPct(item.share)}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width:           `${Math.max(0, Math.min(100, item.share * 100))}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
