import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtNum, fmtPct } from "@/lib/fmt";

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
}: CrossFunnelPanelProps) {
  const hasData = items.some((item) => item.value > 0);

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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[74px] animate-pulse rounded-[18px] bg-[#F0F3F6]"
            />
          ))}
        </div>
      ) : !hasData || baseValue === 0 ? (
        <div className="flex h-52 items-center justify-center text-center text-sm text-[#9BAAB8]">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="rounded-[18px] border border-[#E2E6EB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-3 shadow-[0_8px_24px_rgba(15,25,35,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-[13px] font-semibold text-[#0F1923]">
                      {item.name}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-[#9BAAB8]">
                    {fmtPct(item.share)} da base atual de consultas
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-mono text-xl font-bold leading-none tracking-[-0.05em]"
                    style={{ color: item.color }}
                  >
                    {fmtNum(item.value)}
                  </p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#9BAAB8]">
                    contatos
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EDF3]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, item.share * 100))}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
