import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtBRL, fmtPct } from "@/lib/fmt";

type FinancialBridgePanelProps = {
  title: string;
  tooltip: string;
  comparison?: MetricComparison;
  isLoading?: boolean;
  bruto: string;
  custos: string;
  liquido: string;
  brutoRaw: number;
  custosRaw: number;
  liquidoRaw: number;
  margemRatio: number;
};

/* ── Tooltip customizado para o waterfall ── */
function WaterfallTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { label: string; displayValue: number; type: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const colorMap: Record<string, string> = {
    positive: "#059669",
    negative: "#D97706",
    result: "#1A56DB",
  };

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-[#0F1923]">{row.label}</p>
      <p style={{ color: colorMap[row.type] ?? "#5C6B7A" }}>
        {row.type === "negative" ? "− " : ""}
        {fmtBRL(row.displayValue)}
      </p>
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
  brutoRaw,
  custosRaw,
  liquidoRaw,
  margemRatio,
}: FinancialBridgePanelProps) {
  /* Dados do waterfall:
   * - "base" é a barra invisível que empurra a barra visível para cima
   * - "bar" é a barra visível
   * Bruto:  base=0, bar=bruto (começa do zero, cresce até bruto)
   * Custos: base=liquido, bar=custos (a fatia subtraída, começa de liquido até bruto)
   * Líquido:base=0, bar=liquido (resultado, começa do zero)
   */
  const waterfallData = [
    {
      label: "Faturamento Bruto",
      base: 0,
      bar: brutoRaw,
      displayValue: brutoRaw,
      type: "positive",
    },
    {
      label: "Custos Diretos",
      base: liquidoRaw,
      bar: custosRaw,
      displayValue: custosRaw,
      type: "negative",
    },
    {
      label: "Valor Líquido",
      base: 0,
      bar: liquidoRaw,
      displayValue: liquidoRaw,
      type: "result",
    },
  ];

  const BAR_COLORS: Record<string, string> = {
    positive: "#059669",
    negative: "#D97706",
    result: "#1A56DB",
  };

  return (
    <div className="panel-shell p-4">
      <PanelTitle title={title} tooltip={tooltip} comparison={comparison} />

      {isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-44 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Waterfall chart ── */}
          <ResponsiveContainer width="100%" height={180} aria-label="Gráfico waterfall de resultado financeiro">
            <BarChart
              data={waterfallData}
              margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
              barCategoryGap="35%"
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#5C6B7A" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtBRL(v)}
                width={72}
              />
              <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "#F0F3F6" }} />

              {/* Barra invisível — base flutuante */}
              <Bar dataKey="base" stackId="bridge" fill="transparent" isAnimationActive={false} />

              {/* Barra visível — valor real */}
              <Bar dataKey="bar" stackId="bridge" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={BAR_COLORS[entry.type] ?? "#1A56DB"}
                    opacity={0.9}
                  />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="top"
                  formatter={(v: number) => fmtBRL(v)}
                  style={{ fontSize: 10, fill: "#5C6B7A", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* ── Linha de resumo: 3 valores + margem ── */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-[var(--radius-md)] border border-slate-100 bg-white">
            <div className="px-4 py-3">
              <p className="section-label text-clinic-green">Bruto</p>
              <p className="mt-1.5 font-mono text-[0.95rem] font-bold text-slate-900 tabular-nums">
                {bruto}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="section-label text-clinic-amber">Custos</p>
              <p className="mt-1.5 font-mono text-[0.95rem] font-bold text-clinic-amber tabular-nums">
                − {custos}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="section-label text-clinic-blue">Líquido</p>
              <p className="mt-1.5 font-mono text-[0.95rem] font-bold text-clinic-blue tabular-nums">
                {liquido}
              </p>
            </div>
          </div>

          {/* ── Margem ── */}
          <div className="rounded-[var(--radius-md)] border border-[#BBF7D0] bg-gradient-to-br from-white to-[#F0FDF4] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label text-clinic-green">Margem sobre o bruto</p>
                <div className="mt-1.5 font-mono text-[1.5rem] font-bold leading-none tracking-[-0.03em] text-clinic-green tabular-nums">
                  {fmtPct(margemRatio)}
                </div>
              </div>
              <div className="flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-[#DCFCE7]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    role="progressbar"
                    aria-valuenow={Math.round(margemRatio * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{
                      width: `${Math.max(0, Math.min(100, margemRatio * 100))}%`,
                      backgroundColor: "#059669",
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Resultado líquido após os custos do período
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
