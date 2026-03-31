import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtPct } from "@/lib/fmt";

type FinancialBridgePanelProps = {
  title: string;
  tooltip: string;
  comparison?: MetricComparison;
  isLoading?: boolean;
  bruto: string;
  custos: string;
  liquido: string;
  margemRatio: number;
};

function FinancialMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "text-clinic-amber"
      : tone === "success"
        ? "text-clinic-green"
        : "text-[#0F1923]";

  return (
    <div className="rounded-[18px] border border-[#E2E6EB] bg-white p-3 shadow-[0_8px_24px_rgba(15,25,35,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
        {label}
      </p>
      <div className={`mt-2.5 font-mono text-[1.65rem] font-bold leading-none tracking-[-0.05em] ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function FinancialSeparator({ symbol }: { symbol: string }) {
  return (
    <div className="hidden items-center justify-center xl:flex">
      <span className="rounded-full border border-[#E2E6EB] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#9BAAB8]">
        {symbol}
      </span>
    </div>
  );
}

export function FinancialBridgePanel({
  title,
  tooltip,
  comparison,
  isLoading,
  bruto,
  custos,
  liquido,
  margemRatio,
}: FinancialBridgePanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle
        title={title}
        tooltip={tooltip}
        comparison={comparison}
      />

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-[18px] bg-[#F0F3F6]"
              />
            ))}
          </div>
          <div className="h-20 animate-pulse rounded-[18px] bg-[#F0F3F6]" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center">
            <FinancialMetric label="Faturamento bruto" value={bruto} />
            <FinancialSeparator symbol="-" />
            <FinancialMetric label="Custos diretos" value={custos} tone="warning" />
            <FinancialSeparator symbol="=" />
            <FinancialMetric label="Valor líquido" value={liquido} tone="success" />
          </div>

          <div className="rounded-[20px] border border-[#D7EBDD] bg-[linear-gradient(135deg,#FFFFFF_0%,#F2FBF6_100%)] p-4 shadow-[0_10px_28px_rgba(15,25,35,0.05)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BAAB8]">
                  Margem sobre o bruto
                </p>
                <div className="mt-2.5 font-mono text-[2rem] font-bold leading-none tracking-[-0.07em] text-clinic-green">
                  {fmtPct(margemRatio)}
                </div>
              </div>

              <p className="max-w-[38ch] text-[13px] leading-5 text-[#5C6B7A]">
                Mostra quanto do faturamento bruto permanece como resultado líquido
                depois dos custos lançados no período.
              </p>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#DCEEE3]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, margemRatio * 100))}%`,
                  backgroundColor: "#0E9F6E",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
