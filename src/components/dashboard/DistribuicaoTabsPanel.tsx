import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyChart } from "@/components/dashboard/EmptyChart";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { fmtBRL, fmtNum } from "@/lib/fmt";
import { cn } from "@/lib/utils";

export type DistTabConfig = {
  key: string;
  label: string;
  /** Normalized data — each entry must have `name` and `value`. */
  data: { name: string; value: number }[];
  tooltipType?: "count" | "brl";
  /** Unit shown in count tooltip (default "registros"). */
  unit?: string;
  color?: string;
  /** Y-axis label column width in px (default 120). */
  yAxisWidth?: number;
  onBarClick?: (name: string) => void;
};

type DistribuicaoTabsPanelProps = {
  tabs: DistTabConfig[];
  title?: string;
  tooltip?: string;
  isLoading?: boolean;
};

function TooltipBRL({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-medium text-[#0F1923]">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="text-[#5C6B7A]">
          {item.name}: {fmtBRL(item.value)}
        </p>
      ))}
    </div>
  );
}

function TooltipCount({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="font-medium text-[#0F1923]">{label}</p>
      <p className="text-[#5C6B7A]">
        {fmtNum(payload[0].value)} {unit ?? "registros"}
      </p>
    </div>
  );
}


export function DistribuicaoTabsPanel({
  tabs,
  title = "Distribuição",
  tooltip,
  isLoading = false,
}: DistribuicaoTabsPanelProps) {
  const visibleTabs = tabs.filter((t) => isLoading || t.data.length > 0);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const resolvedKey =
    activeKey && visibleTabs.some((t) => t.key === activeKey)
      ? activeKey
      : (visibleTabs[0]?.key ?? null);

  const active = visibleTabs.find((t) => t.key === resolvedKey);

  const color = active?.color ?? "#1A56DB";
  const isBRL = active?.tooltipType === "brl";
  const yWidth = active?.yAxisWidth ?? 120;

  return (
    <div className="panel-shell p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelTitle title={title} tooltip={tooltip} />
        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const isEmpty = !isLoading && tab.data.length === 0;
              const isActive = tab.key === resolvedKey;
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={isEmpty}
                  onClick={() => setActiveKey(tab.key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    isEmpty
                      ? "cursor-not-allowed border border-[#E2E6EB] text-[#B0BCCA] opacity-50"
                      : isActive
                        ? "border border-[#D8E6FF] bg-[#EEF4FF] text-clinic-blue"
                        : "border border-[#D8E0E8] bg-white text-[#5C6B7A] hover:border-clinic-blue hover:text-clinic-blue"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="skeleton h-44" />
        ) : !active || active.data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, active.data.length * 44)}
          >
            <BarChart
              data={active.data}
              layout="vertical"
              margin={{
                left: 8,
                right: isBRL ? 16 : 48,
                top: 4,
                bottom: 0,
              }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tickFormatter={isBRL ? (v) => fmtBRL(v) : undefined}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5C6B7A" }}
                axisLine={false}
                tickLine={false}
                width={yWidth}
              />
              <Tooltip
                content={
                  isBRL ? (
                    <TooltipBRL />
                  ) : (
                    <TooltipCount unit={active.unit} />
                  )
                }
                cursor={{ fill: "#F0F3F6" }}
              />
              <Bar
                dataKey="value"
                name={title}
                fill={color}
                radius={[0, 4, 4, 0]}
                label={
                  isBRL
                    ? undefined
                    : { position: "right", fontSize: 11, fill: "#9BAAB8" }
                }
              >
                {active.data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={color}
                    cursor={active.onBarClick ? "pointer" : "default"}
                    onClick={() => active.onBarClick?.(entry.name)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
