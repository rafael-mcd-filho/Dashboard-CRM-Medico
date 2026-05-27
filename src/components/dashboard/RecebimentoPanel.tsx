import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { cn } from "@/lib/utils";
import type { MetricComparison } from "@/lib/comparison";

type RecebimentoPanelProps = {
  title: string;
  tooltip: string;
  comparison?: MetricComparison;
  isLoading?: boolean;
  destaqueLabel: string;
  destaqueValue: string;
  destaqueDescription: string;
  destaqueRatio: number;
  stats: Array<{
    label: string;
    value: string;
    sub?: string;
    tone?: "default" | "teal" | "amber";
  }>;
};

const toneMap = {
  default: {
    value: "text-slate-900",
    chip:  "bg-slate-100 text-slate-500",
  },
  teal: {
    value: "text-clinic-teal",
    chip:  "bg-[#EAF8FC] text-clinic-teal",
  },
  amber: {
    value: "text-clinic-amber",
    chip:  "bg-[#FFF7ED] text-clinic-amber",
  },
} as const;

export function RecebimentoPanel({
  title,
  tooltip,
  comparison,
  isLoading,
  destaqueLabel,
  destaqueValue,
  destaqueDescription,
  destaqueRatio,
  stats,
}: RecebimentoPanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle title={title} tooltip={tooltip} comparison={comparison} />

      {isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-24 w-full" />
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Destaque headline — teal accent */}
          <div className="rounded-[var(--radius-md)] border border-[#CCEEF7] bg-gradient-to-br from-white to-[#F0FBFF] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="section-label text-clinic-teal">{destaqueLabel}</p>
                <div className="mt-2.5 font-mono text-[1.875rem] font-bold leading-none tracking-[-0.04em] text-clinic-teal font-variant-numeric tabular-nums">
                  {destaqueValue}
                </div>
              </div>
              <p className="max-w-[38ch] text-[13px] leading-5 text-slate-500">
                {destaqueDescription}
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#CCE8F4]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                role="progressbar"
                aria-valuenow={Math.round(destaqueRatio * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  width: `${Math.max(0, Math.min(100, destaqueRatio * 100))}%`,
                  backgroundColor: "#0891B2",
                }}
              />
            </div>
          </div>

          {/* Stat-cards */}
          <div className="grid gap-2 sm:grid-cols-3">
            {stats.map((stat) => {
              const tone = toneMap[stat.tone ?? "default"];

              return (
                <div
                  key={stat.label}
                  className="rounded-[var(--radius-md)] border border-slate-100 bg-white p-3"
                >
                  <span className="section-label">{stat.label}</span>
                  <div
                    className={cn(
                      "mt-2 font-mono text-[1.125rem] font-bold leading-none tracking-[-0.02em] font-variant-numeric tabular-nums",
                      tone.value
                    )}
                  >
                    {stat.value}
                  </div>
                  {stat.sub ? (
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        tone.chip
                      )}
                    >
                      {stat.sub}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
