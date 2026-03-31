import { PanelTitle } from "@/components/dashboard/PanelTitle";
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
    value: "text-[#0F1923]",
    chip: "bg-[#F3F5F7] text-[#5C6B7A]",
  },
  teal: {
    value: "text-clinic-teal",
    chip: "bg-[#EAF8FC] text-clinic-teal",
  },
  amber: {
    value: "text-clinic-amber",
    chip: "bg-[#FFF4E8] text-clinic-amber",
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
      <PanelTitle
        title={title}
        tooltip={tooltip}
        comparison={comparison}
      />

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-[20px] bg-[#F0F3F6]" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-[18px] bg-[#F0F3F6]"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-[20px] border border-[#D8EEF5] bg-[linear-gradient(135deg,#FFFFFF_0%,#F2FBFF_100%)] p-4 shadow-[0_10px_28px_rgba(15,25,35,0.05)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BAAB8]">
                  {destaqueLabel}
                </p>
                <div className="mt-2.5 font-mono text-[2.15rem] font-bold leading-none tracking-[-0.07em] text-clinic-teal">
                  {destaqueValue}
                </div>
              </div>

              <p className="max-w-[38ch] text-[13px] leading-5 text-[#5C6B7A]">
                {destaqueDescription}
              </p>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#DDEFF5]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, destaqueRatio * 100))}%`,
                  backgroundColor: "#0891B2",
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => {
              const tone = toneMap[stat.tone ?? "default"];

              return (
                <div
                  key={stat.label}
                  className="rounded-[18px] border border-[#E2E6EB] bg-white p-3 shadow-[0_8px_24px_rgba(15,25,35,0.04)]"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
                    {stat.label}
                  </span>
                  <div className={`mt-2.5 font-mono text-[1.65rem] font-bold leading-none tracking-[-0.05em] ${tone.value}`}>
                    {stat.value}
                  </div>
                  {stat.sub ? (
                    <span className={`mt-2.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tone.chip}`}>
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
