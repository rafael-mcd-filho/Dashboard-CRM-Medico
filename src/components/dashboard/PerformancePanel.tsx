import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { cn } from "@/lib/utils";
import type { MetricComparison } from "@/lib/comparison";

const toneMap = {
  default: {
    value: "text-slate-900",
    chip:  "bg-slate-100 text-slate-500",
  },
  success: {
    value: "text-clinic-green",
    chip:  "bg-[#ECFDF5] text-clinic-green",
  },
  danger: {
    value: "text-clinic-red",
    chip:  "bg-[#FEF2F2] text-clinic-red",
  },
  warning: {
    value: "text-clinic-amber",
    chip:  "bg-[#FFF7ED] text-clinic-amber",
  },
  teal: {
    value: "text-clinic-teal",
    chip:  "bg-[#EAF8FC] text-clinic-teal",
  },
  purple: {
    value: "text-clinic-purple",
    chip:  "bg-[#F3EDFF] text-clinic-purple",
  },
  blue: {
    value: "text-clinic-blue",
    chip:  "bg-[#EEF4FF] text-clinic-blue",
  },
} as const;

export type PerformancePanelStat = {
  label: string;
  value: string;
  sub?: string;
  tone?: keyof typeof toneMap;
};

type PerformancePanelProps = {
  title: string;
  tooltip: string;
  comparison?: MetricComparison;
  isLoading?: boolean;
  headlineLabel: string;
  headlineValue: string;
  headlineDescription: string;
  progressValue: number;
  progressColor?: string;
  stats: PerformancePanelStat[];
};

export function PerformancePanel({
  title,
  tooltip,
  comparison,
  isLoading,
  headlineLabel,
  headlineValue,
  headlineDescription,
  progressValue,
  progressColor = "#2563EB",
  stats,
}: PerformancePanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle title={title} tooltip={tooltip} comparison={comparison} />

      {isLoading ? (
        <div className="space-y-3">
          {/* Skeleton headline */}
          <div className="skeleton h-24 w-full" />
          {/* Skeleton stat-cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: Math.max(stats.length, 4) }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Headline card */}
          <div className="rounded-[var(--radius-md)] border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="section-label">{headlineLabel}</p>
                {/* kpi-md: 22px mono — nível headline do painel */}
                <div
                  className="mt-2.5 font-mono text-[1.875rem] font-bold leading-none tracking-[-0.04em] font-variant-numeric tabular-nums"
                  style={{ color: progressColor }}
                >
                  {headlineValue}
                </div>
              </div>
              <p className="max-w-[38ch] text-[13px] leading-5 text-slate-500">
                {headlineDescription}
              </p>
            </div>

            {/* Progress bar — h-2 mais fino, premium */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                role="progressbar"
                aria-valuenow={Math.round(progressValue * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  width: `${Math.max(0, Math.min(100, progressValue * 100))}%`,
                  backgroundColor: progressColor,
                }}
              />
            </div>
          </div>

          {/* Stat-cards */}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const tone = toneMap[stat.tone ?? "default"];

              return (
                <div
                  key={stat.label}
                  className="rounded-[var(--radius-md)] border border-slate-100 bg-white p-3"
                >
                  <span className="section-label">{stat.label}</span>
                  {/* kpi-sm: 18px mono — nível stat-card */}
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
