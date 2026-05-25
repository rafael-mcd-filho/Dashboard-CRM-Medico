import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ComparisonBadge } from "@/components/dashboard/ComparisonBadge";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtNum, fmtPct } from "@/lib/fmt";
import type { LossDiagnostics, LossReasonDatum } from "@/lib/lossReasons";

type LossDiagnosticsPanelProps = {
  title?: string;
  tooltip?: string;
  diagnostics: LossDiagnostics;
  originItems: LossReasonDatum[];
  isLoading?: boolean;
  unmappedComparison?: MetricComparison;
  semRetornoComparison?: MetricComparison;
  originsComparison?: MetricComparison;
  emptyLabel?: string;
};

function LossOriginTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value ?? 0);

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-[#0F1923]">{label}</p>
      <p className="text-[#5C6B7A]">
        {fmtNum(value)} {value === 1 ? "perda" : "perdas"}
      </p>
    </div>
  );
}

function LossDiagnosticStat({
  label,
  value,
  count,
  total,
  tone,
  comparison,
}: {
  label: string;
  value: number;
  count: number;
  total: number;
  tone: "amber" | "slate";
  comparison?: MetricComparison;
}) {
  const colorClass = tone === "amber" ? "text-clinic-amber" : "text-[#334155]";

  return (
    <div className="rounded-[18px] border border-[#E2E6EB] bg-white p-3 shadow-[0_8px_24px_rgba(15,25,35,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BAAB8]">
          {label}
        </p>
        <ComparisonBadge comparison={comparison} compact />
      </div>
      <div className={`mt-2 font-mono text-[1.65rem] font-bold leading-none tracking-[-0.05em] ${colorClass}`}>
        {fmtPct(value)}
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[#5C6B7A]">
        {fmtNum(count)} de {fmtNum(total)} perdas
      </p>
    </div>
  );
}

export function LossDiagnosticsPanel({
  title = "Diagnóstico de perdas",
  tooltip = "Analisa apenas cards na etapa Perdido: qualidade do mapeamento, peso de Sem Retorno e distribuição por origem.",
  diagnostics,
  originItems,
  isLoading,
  unmappedComparison,
  semRetornoComparison,
  originsComparison,
  emptyLabel = "Sem perdas no período",
}: LossDiagnosticsPanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle title={title} tooltip={tooltip} />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-[18px] bg-[#F0F3F6]" />
            <div className="h-28 animate-pulse rounded-[18px] bg-[#F0F3F6]" />
          </div>
          <div className="h-52 animate-pulse rounded-lg bg-[#F0F3F6]" />
        </div>
      ) : diagnostics.total === 0 ? (
        <div className="flex h-52 items-center justify-center text-center text-sm text-[#9BAAB8]">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <LossDiagnosticStat
              label="Sem motivo mapeado"
              value={diagnostics.unmappedPct}
              count={diagnostics.unmapped}
              total={diagnostics.total}
              tone="amber"
              comparison={unmappedComparison}
            />
            <LossDiagnosticStat
              label="Sem Retorno"
              value={diagnostics.semRetornoPct}
              count={diagnostics.semRetorno}
              total={diagnostics.total}
              tone="slate"
              comparison={semRetornoComparison}
            />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <h4 className="text-[12px] font-semibold text-[#0F1923]">
                Perdas por origem
              </h4>
              <ComparisonBadge comparison={originsComparison} compact />
            </div>

            {originItems.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-center text-sm text-[#9BAAB8]">
                Sem origem nas perdas do período
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(180, originItems.length * 38)}
                aria-label="Gráfico de perdas por origem"
              >
                <BarChart
                  data={originItems}
                  layout="vertical"
                  margin={{ left: 8, right: 48, top: 4, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9BAAB8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#5C6B7A" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    content={<LossOriginTooltip />}
                    cursor={{ fill: "#F0F3F6" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Perdas"
                    radius={[0, 4, 4, 0]}
                    label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
                  >
                    {originItems.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
