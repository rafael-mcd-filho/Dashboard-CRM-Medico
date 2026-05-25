import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import type { LossReasonDatum } from "@/lib/lossReasons";
import { fmtNum } from "@/lib/fmt";

type LossReasonsPanelProps = {
  title?: string;
  tooltip?: string;
  items: LossReasonDatum[];
  comparison?: MetricComparison;
  isLoading?: boolean;
  emptyLabel?: string;
};

function LossReasonTooltip({
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

export function LossReasonsPanel({
  title = "Motivos de perda",
  tooltip = "Conta apenas cards que estão na etapa Perdido. Quando o card não tem nenhum ID mapeado para o funil, entra como Sem motivo mapeado.",
  items,
  comparison,
  isLoading,
  emptyLabel = "Sem perdas no período",
}: LossReasonsPanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle title={title} tooltip={tooltip} comparison={comparison} />

      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-[#F0F3F6]" />
      ) : items.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-center text-sm text-[#9BAAB8]">
          {emptyLabel}
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(220, items.length * 38)}
          aria-label={`Gráfico de ${title.toLowerCase()}`}
        >
          <BarChart
            data={items}
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
              width={170}
            />
            <Tooltip content={<LossReasonTooltip />} cursor={{ fill: "#F0F3F6" }} />
            <Bar
              dataKey="value"
              name="Perdas"
              radius={[0, 4, 4, 0]}
              label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
            >
              {items.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
