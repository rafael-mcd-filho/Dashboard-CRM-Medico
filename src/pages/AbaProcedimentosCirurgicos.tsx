import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Info,
  Stethoscope,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DistribuicaoTabsPanel } from "@/components/dashboard/DistribuicaoTabsPanel";
import { EmptyChart } from "@/components/dashboard/EmptyChart";
import { FinancialBridgePanel } from "@/components/dashboard/FinancialBridgePanel";
import { FunnelStageSheet } from "@/components/dashboard/FunnelStageSheet";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { LossDiagnosticsPanel } from "@/components/dashboard/LossDiagnosticsPanel";
import { LossReasonsPanel } from "@/components/dashboard/LossReasonsPanel";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { RecebimentoPanel } from "@/components/dashboard/RecebimentoPanel";
import { useFilters } from "@/contexts/FiltersContext";
import { useProcedimentosData } from "@/hooks/useProcedimentosData";
import { SEM_COBRANCA_STATUS } from "@/lib/billing";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";
import { cn } from "@/lib/utils";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FUNIL_COLORS: Record<string, string> = {
  "Captação": "#9BAAB8",
  "Negociação": "#60A5FA",
  Agendado: "#1A56DB",
  Realizado: "#0E9F6E",
  "Retorno Agendado": "#0891B2",
  "Compareceu Retorno": "#0E9F6E",
  "Finalizado/Concluído": "#065F46",
  "Não compareceu": "#DC2626",
  "Não Compareceu Retorno": "#EF4444",
  Perdido: "#6B7280",
};

const ETAPA_BADGE: Record<string, { bg: string; text: string }> = {
  "Finalizado/Concluído": { bg: "#D1FAE5", text: "#065F46" },
  Realizado: { bg: "#DBEAFE", text: "#1E40AF" },
  "Retorno Agendado": { bg: "#DBEAFE", text: "#1E40AF" },
  "Compareceu Retorno": { bg: "#D1FAE5", text: "#065F46" },
  Agendado: { bg: "#EFF6FF", text: "#1D4ED8" },
  "Não compareceu": { bg: "#FEE2E2", text: "#991B1B" },
  "Não Compareceu Retorno": { bg: "#FEE2E2", text: "#991B1B" },
  Perdido: { bg: "#F3F4F6", text: "#374151" },
};

function ChartTooltipBRL({
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
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-[#0F1923]">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-[#5C6B7A]">
          {item.name}: {fmtBRL(item.value)}
        </p>
      ))}
    </div>
  );
}

function ChartTooltipNum({
  active,
  payload,
  label,
  unit = "procedimentos",
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-[#0F1923]">{label}</p>
      <p className="text-[#5C6B7A]">
        {fmtNum(payload[0].value)} {unit}
      </p>
    </div>
  );
}


function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="section-label shrink-0 before:hidden">{title}</p>
      <div className="flex-1 border-t border-slate-200" aria-hidden="true" />
    </div>
  );
}

export default function AbaProcedimentosCirurgicos() {
  const d = useProcedimentosData();
  const {
    filters: { tipoData, dataInicio, dataFim },
  } = useFilters();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<{
    title: string;
    description: string;
    contextLabel?: string;
    badgeLabel?: string;
    accentColor: string;
    records: FunnelStageDrilldownRecord[];
  } | null>(null);

  const margemRatio =
    d.faturamento > 0 ? d.valor_liquido_total / d.faturamento : 0;

  const selectedStageRecords = useMemo(
    () =>
      selectedStage
        ? (d.funil_registros ?? []).filter((row) => row.etapa === selectedStage)
        : [],
    [d.funil_registros, selectedStage]
  );
  const currentRecords = d.funil_registros ?? [];

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-clinic-blue" />
          <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
            Procedimentos Cirúrgicos
          </h1>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
          Fechamento, realização, resultado financeiro e recebimento dos
          procedimentos cirúrgicos com a mesma lógica operacional da aba.
        </p>
      </div>

      <SectionHeader title="Visão" />

      <div className="animate-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Fechados"
          value={fmtNum(d.fechados_qtd)}
          description="Base comercial que já saiu de Captação, Negociação e Perdido."
          tooltip="Conta os procedimentos que já saíram de Captação, Negociação e Perdido. Nesta aba, essa é a base operacional principal."
          icon={Stethoscope}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.fechados_qtd}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Realizados"
          value={fmtNum(d.realizados)}
          description="Procedimentos que já chegaram às etapas consideradas realizadas."
          tooltip="Conta os procedimentos em Realizado, Retorno Agendado, Compareceu Retorno, Não Compareceu Retorno ou Finalizado/Concluído."
          icon={CheckCircle2}
          tone="teal"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.realizados}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Faturamento bruto"
          value={fmtBRL(d.faturamento)}
          description="Valor bruto gerado apenas pela base de procedimentos realizados."
          tooltip="Soma o valor bruto apenas dos procedimentos considerados realizados no período."
          icon={Wallet}
          tone="purple"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.faturamento}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Valor líquido"
          value={fmtBRL(d.valor_liquido_total)}
          description="Resultado que sobra depois dos custos lançados na base realizada."
          tooltip="Como a base atual não traz uma coluna líquida pronta, este valor é calculado subtraindo os custos lançados do valor bruto dos procedimentos realizados."
          icon={TrendingUp}
          tone="amber"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.valor_liquido_total}
        />
      </div>

      <SectionHeader title="Financeiro" />

      <FinancialBridgePanel
        title="Resultado financeiro"
        tooltip="Consolida o bruto, os custos diretos e o valor líquido dos procedimentos realizados. A margem mostra quanto do bruto permaneceu como resultado."
        comparison={d.comparisons?.charts.resultado_financeiro}
        isLoading={d.isLoading}
        bruto={fmtBRL(d.faturamento)}
        custos={fmtBRL(d.custo_total)}
        liquido={fmtBRL(d.valor_liquido_total)}
        brutoRaw={d.faturamento}
        custosRaw={d.custo_total}
        liquidoRaw={d.valor_liquido_total}
        margemRatio={margemRatio}
      />

      <SectionHeader title="Performance" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.95fr)]">
        <PerformancePanel
          title="Performance operacional"
          tooltip="Resume a base fechada, o volume realizado e os dois tipos de no-show. A taxa mostra quanto da base fechada avançou para realizado."
          comparison={d.comparisons?.charts.performance}
          isLoading={d.isLoading}
          headlineLabel="Taxa de realização"
          headlineValue={fmtPct(d.taxa_conversao)}
          headlineDescription="Quanto da base fechada já avançou para as etapas consideradas realizadas neste período."
          progressValue={d.taxa_conversao}
          progressColor="#7C3AED"
          stats={[
            {
              label: "Fechados",
              value: fmtNum(d.fechados_qtd),
              tone: "default",
            },
            {
              label: "Realizados",
              value: fmtNum(d.realizados),
              tone: "success",
            },
            {
              label: "No-show cirurgia",
              value: fmtNum(d.no_show_consulta),
              sub: `${fmtPct(d.no_show_consulta_pct)} dos fechados`,
              tone: "danger",
            },
            {
              label: "No-show retorno",
              value: fmtNum(d.no_show_retorno),
              sub: `${fmtPct(d.no_show_retorno_pct)} dos realizados`,
              tone: "warning",
            },
          ]}
        />

        <RecebimentoPanel
          title="Recebimento"
          tooltip="Mostra o volume pago, quanto foi recebido no mesmo dia do procedimento e o prazo médio de recebimento."
          comparison={d.comparisons?.charts.recebimento}
          isLoading={d.isLoading}
          destaqueLabel="Pagos no dia"
          destaqueValue={fmtPct(d.pago_no_dia_pct)}
          destaqueDescription="Mostra qual parte dos procedimentos pagos foi recebida no mesmo dia do agendamento."
          destaqueRatio={d.pago_no_dia_pct}
          stats={[
            {
              label: "Pagos",
              value: fmtNum(d.pago_qtd),
              tone: "default",
            },
            {
              label: "Pagos no dia",
              value: fmtNum(d.pago_no_dia),
              tone: "teal",
            },
            {
              label: "Prazo médio",
              value: d.prazo_medio > 0 ? `${fmtDecimal(d.prazo_medio, 0)} dias` : "—",
              tone: "amber",
            },
          ]}
        />
      </div>

      <SectionHeader title="Funil por Etapa" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Funil por etapa"
            tooltip="Mostra quantos cards de procedimentos estão em cada etapa do funil dentro do filtro atual. A ordem segue o CRM para facilitar a leitura operacional."
            comparison={d.comparisons?.charts.funil}
          />
          {(() => {
            const funnelItems = d.funil.filter((e) => e.value > 0);
            return d.isLoading ? (
              <div className="skeleton h-52" />
            ) : funnelItems.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(220, funnelItems.length * 38)}
              >
                <BarChart
                  data={funnelItems}
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
                    width={160}
                  />
                  <Tooltip content={<ChartTooltipNum />} cursor={{ fill: "#F0F3F6" }} />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
                  >
                    {funnelItems.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={FUNIL_COLORS[entry.name] ?? "#1A56DB"}
                        cursor="pointer"
                        onClick={() => setSelectedStage(entry.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* §8.3 — Composição do custo: donut + list */}
        <div className="panel-shell p-4">
          <PanelTitle
            title="Composição do custo"
            tooltip="Mostra como cada categoria de custo (Hospital, Anestesia, Comissão, Impostos, Instrumentação) contribui para o custo total dos procedimentos realizados."
            comparison={d.comparisons?.charts.custos_por_categoria}
          />
          {d.isLoading ? (
            <div className="skeleton h-44" />
          ) : d.custos_por_categoria.length === 0 ? (
            <EmptyChart />
          ) : (() => {
            const COST_COLORS = ["#B45309", "#D97706", "#F59E0B", "#92400E", "#78350F"];
            const total = d.custos_por_categoria.reduce((s, e) => s + e.value, 0);
            return (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={d.custos_por_categoria}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={46}
                        stroke="none"
                      >
                        {d.custos_por_categoria.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={COST_COLORS[idx % COST_COLORS.length]}
                            cursor="pointer"
                            onClick={() => {
                              const records = currentRecords.filter((record) => {
                                if (!record.meta?.realizada) return false;
                                if (entry.name === "Hospital") return Number(record.meta?.custoHospital ?? 0) > 0;
                                if (entry.name === "Anestesia") return Number(record.meta?.custoAnestesia ?? 0) > 0;
                                if (entry.name === "Comissão") return Number(record.meta?.custoComissao ?? 0) > 0;
                                if (entry.name === "Impostos") return Number(record.meta?.custoImpostos ?? 0) > 0;
                                if (entry.name === "Instrumentação") return Number(record.meta?.custoInstrumentacao ?? 0) > 0;
                                return false;
                              });
                              if (!records.length) return;
                              setSheetState({
                                title: "Procedimentos com custo na categoria selecionada",
                                description: "Cards realizados que compõem a fatia escolhida na composição de custos.",
                                contextLabel: `Categoria: ${entry.name}`,
                                badgeLabel: "Composição do custo",
                                accentColor: COST_COLORS[idx % COST_COLORS.length],
                                records,
                              });
                            }}
                          />
                        ))}
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const item = payload[0].payload as { name: string; value: number };
                            const pct = total > 0 ? item.value / total : 0;
                            return (
                              <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
                                <p className="font-medium text-[#0F1923]">{item.name}</p>
                                <p className="text-[#5C6B7A]">{fmtBRL(item.value)} · {fmtPct(pct)}</p>
                              </div>
                            );
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {/* header */}
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <span className="min-w-[90px] text-[10px] font-medium uppercase tracking-wide text-[#9BAAB8]">Categoria</span>
                    <div className="flex-1" />
                    <span className="w-9 text-right text-[10px] font-medium uppercase tracking-wide text-[#9BAAB8]">%</span>
                    <span className="min-w-[72px] text-right text-[10px] font-medium uppercase tracking-wide text-[#9BAAB8]">Total</span>
                    <span className="min-w-[72px] text-right text-[10px] font-medium uppercase tracking-wide text-[#9BAAB8]">Média/proc.</span>
                  </div>
                  {d.custos_por_categoria.map((entry, idx) => {
                    const pct = total > 0 ? entry.value / total : 0;
                    const color = COST_COLORS[idx % COST_COLORS.length];
                    const media = d.realizados > 0 ? entry.value / d.realizados : 0;
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="min-w-[90px] text-xs text-[#5C6B7A]">{entry.name}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
                          <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{ width: `${pct * 100}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="w-9 text-right font-mono text-[11px] text-[#5C6B7A]">{fmtPct(pct)}</span>
                        <span className="min-w-[72px] text-right text-[11px] text-[#0F1923]">{fmtBRL(entry.value)}</span>
                        <span className="min-w-[72px] text-right font-mono text-[11px] text-[#5C6B7A]">{fmtBRL(media)}</span>
                      </div>
                    );
                  })}
                  <div className="mt-2 border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#9BAAB8]">
                      {d.realizados} proc. realizados
                    </span>
                    <span className="text-xs font-semibold text-[#0F1923]">Total: {fmtBRL(total)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <SectionHeader title="Análise de Perda" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <LossReasonsPanel
          items={d.motivos_perda}
          comparison={d.comparisons?.charts.motivos_perda}
          isLoading={d.isLoading}
          onBarClick={() => {
            const records = currentRecords.filter((r) =>
              r.etapa.toLowerCase().includes("perdido")
            );
            if (!records.length) return;
            setSheetState({
              title: "Procedimentos perdidos",
              description: "Cards na etapa Perdido do funil de procedimentos cirúrgicos no período.",
              contextLabel: "Etapa: Perdido",
              badgeLabel: "Motivos de perda",
              accentColor: "#6B7280",
              records,
            });
          }}
        />
        <LossDiagnosticsPanel
          diagnostics={d.perdas_diagnostico}
          originItems={d.perdas_por_origem}
          isLoading={d.isLoading}
          unmappedComparison={d.comparisons?.kpis.perdas_sem_motivo_pct}
          semRetornoComparison={d.comparisons?.kpis.perdas_sem_retorno_pct}
          originsComparison={d.comparisons?.charts.perdas_por_origem}
        />
      </div>

      {/* ── Procedimentos com Prejuízo ── */}
      {!d.isLoading && (() => {
        const comPrejuizo = d.tabela.filter((row) => row.valor_liq < 0);
        if (comPrejuizo.length === 0) return null;

        return (
          <>
            <SectionHeader title="Alerta Financeiro" />
            <div className="panel-shell overflow-hidden">
              <div className="border-b border-border bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-red-700">
                    Procedimentos com resultado negativo
                    <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      {fmtNum(comPrejuizo.length)}
                    </span>
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-red-500">
                  Custos superaram o faturamento bruto — valor líquido negativo.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Procedimentos com resultado negativo</caption>
                  <thead>
                    <tr className="border-b border-border bg-[#F7F9FB]">
                      {[
                        ["Paciente", "text-left px-5"],
                        ["Agendamento", "text-left px-4"],
                        ["Tipo", "text-left px-4"],
                        ["Etapa", "text-left px-4"],
                        ["Bruto", "text-right px-4"],
                        ["Custo", "text-right px-4"],
                        ["Líquido", "text-right px-4"],
                      ].map(([label, cls]) => (
                        <th
                          key={label}
                          className={`py-2.5 text-xs font-medium uppercase tracking-wide text-[#9BAAB8] ${cls}`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comPrejuizo.map((row, index) => {
                      const badge = ETAPA_BADGE[row.etapa] ?? { bg: "#F3F4F6", text: "#374151" };
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]",
                            "cursor-pointer hover:bg-red-50/60"
                          )}
                          onClick={() => {
                            const record = currentRecords.find((r) => r.id === row.id);
                            if (!record) return;
                            setSheetState({
                              title: "Procedimento com resultado negativo",
                              description: "Detalhes do procedimento cujo custo superou o faturamento bruto.",
                              contextLabel: `Paciente: ${row.nome}`,
                              badgeLabel: "Prejuízo",
                              accentColor: "#DC2626",
                              records: [record],
                            });
                          }}
                        >
                          <td className="px-5 py-2.5 font-medium text-[#0F1923]">{row.nome}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-[#5C6B7A]">{row.data_agendamento}</td>
                          <td className="px-4 py-2.5 text-[#5C6B7A]">{row.tipo}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ background: badge.bg, color: badge.text }}
                            >
                              {row.etapa}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-[#0F1923]">
                            {fmtBRL(row.valor_bruto)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-clinic-amber">
                            {fmtBRL(row.custo)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-red-600">
                            {fmtBRL(row.valor_liq)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      <SectionHeader title="Distribuição" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="panel-shell p-4">
        <PanelTitle
          title="Faturamento e valor líquido por tipo"
          tooltip="Compara o valor bruto e o valor líquido dos procedimentos realizados em cada tipo. O valor líquido é calculado descontando os custos lançados do valor bruto."
          comparison={d.comparisons?.charts.por_tipo}
        />
        {d.isLoading ? (
          <div className="skeleton h-44" />
        ) : d.por_tipo.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, d.por_tipo.length * 52)}
          >
            <BarChart
              data={d.por_tipo}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => fmtBRL(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5C6B7A" }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip content={<ChartTooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
              <Bar dataKey="fat" name="Faturamento bruto" fill="#1A56DB" radius={[0, 2, 2, 0]}>
                {d.por_tipo.map((entry) => (
                  <Cell
                    key={`fat-${entry.name}`}
                    fill="#1A56DB"
                    cursor="pointer"
                    onClick={() => {
                      const records = currentRecords.filter(
                        (record) =>
                          record.meta?.tipo === entry.name && record.meta?.realizada
                      );
                      if (!records.length) return;
                      setSheetState({
                        title: "Procedimentos do tipo selecionado",
                        description:
                          "Cards realizados que compõem a barra escolhida na série Faturamento bruto.",
                        contextLabel: `Tipo: ${entry.name}`,
                        badgeLabel: "Faturamento por tipo",
                        accentColor: "#1A56DB",
                        records,
                      });
                    }}
                  />
                ))}
              </Bar>
              <Bar dataKey="liq" name="Valor líquido" fill="#0E9F6E" radius={[0, 2, 2, 0]}>
                {d.por_tipo.map((entry) => (
                  <Cell
                    key={`liq-${entry.name}`}
                    fill="#0E9F6E"
                    cursor="pointer"
                    onClick={() => {
                      const records = currentRecords.filter(
                        (record) =>
                          record.meta?.tipo === entry.name && record.meta?.realizada
                      );
                      if (!records.length) return;
                      setSheetState({
                        title: "Resultado líquido do tipo selecionado",
                        description:
                          "Cards realizados que compõem a barra escolhida na série Valor líquido.",
                        contextLabel: `Tipo: ${entry.name}`,
                        badgeLabel: "Valor líquido por tipo",
                        accentColor: "#0E9F6E",
                        records,
                      });
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <DistribuicaoTabsPanel
        isLoading={d.isLoading}
        title="Faturamento por modalidade"
        tooltip="Faturamento bruto dos procedimentos realizados agrupado por modalidade."
        tabs={[
          {
            key: "modalidade",
            label: "Modalidade",
            data: d.por_modalidade.map((e) => ({ name: e.name, value: e.fat })),
            tooltipType: "brl",
            color: "#1A56DB",
            yAxisWidth: 110,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.modalidade === name && record.meta?.realizada
              );
              if (!records.length) return;
              setSheetState({
                title: "Faturamento da modalidade selecionada",
                description:
                  "Procedimentos realizados que compõem a barra escolhida em Faturamento por modalidade.",
                contextLabel: `Modalidade: ${name}`,
                badgeLabel: "Faturamento por modalidade",
                accentColor: "#1A56DB",
                records,
              });
            },
          },
        ]}
      />

      <DistribuicaoTabsPanel
        isLoading={d.isLoading}
        title="Procedimentos por origem"
        tooltip="Quantidade de procedimentos agendados agrupados por origem de captação do paciente."
        tabs={[
          {
            key: "origem",
            label: "Origem",
            data: d.por_origem,
            tooltipType: "count",
            unit: "procedimentos",
            color: "#7C3AED",
            yAxisWidth: 120,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.meta?.origem === name && record.meta?.agendadaBase
              );
              if (!records.length) return;
              setSheetState({
                title: "Procedimentos da origem selecionada",
                description:
                  "Cards que compõem a barra escolhida em Procedimentos por origem.",
                contextLabel: `Origem: ${name}`,
                badgeLabel: "Procedimentos por origem",
                accentColor: "#7C3AED",
                records,
              });
            },
          },
        ]}
      />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Ticket médio por responsável"
          tooltip="Faturamento médio por paciente para cada responsável, considerando apenas procedimentos realizados."
          comparison={d.comparisons?.charts.ticket_por_responsavel}
        />
        {d.isLoading ? (
          <div className="skeleton h-44" />
        ) : d.ticket_por_responsavel.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, d.ticket_por_responsavel.length * 44)}
          >
            <BarChart
              data={d.ticket_por_responsavel}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => fmtBRL(value)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#5C6B7A" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip content={<ChartTooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
              <Bar dataKey="ticket" name="Ticket médio" fill="#1A56DB" radius={[0, 4, 4, 0]}>
                {d.ticket_por_responsavel.map((entry) => (
                  <Cell
                    key={`ticket-${entry.name}`}
                    fill="#1A56DB"
                    cursor="pointer"
                    onClick={() => {
                      const records = currentRecords.filter(
                        (record) =>
                          record.responsavel === entry.name &&
                          record.meta?.realizada
                      );
                      if (!records.length) return;
                      setSheetState({
                        title: "Procedimentos do responsável selecionado",
                        description:
                          "Cards realizados que compõem a barra escolhida na série Ticket médio por responsável.",
                        contextLabel: `Responsável: ${entry.name}`,
                        badgeLabel: "Ticket médio por responsável",
                        accentColor: "#1A56DB",
                        records,
                      });
                    }}
                  />
                ))}
              </Bar>
              <Bar dataKey="fat" name="Faturamento" fill="#0E9F6E" radius={[0, 4, 4, 0]}>
                {d.ticket_por_responsavel.map((entry) => (
                  <Cell
                    key={`fat-${entry.name}`}
                    fill="#0E9F6E"
                    cursor="pointer"
                    onClick={() => {
                      const records = currentRecords.filter(
                        (record) =>
                          record.responsavel === entry.name &&
                          record.meta?.realizada
                      );
                      if (!records.length) return;
                      setSheetState({
                        title: "Faturamento do responsável selecionado",
                        description:
                          "Cards realizados que compõem a barra escolhida na série Faturamento por responsável.",
                        contextLabel: `Responsável: ${entry.name}`,
                        badgeLabel: "Faturamento por responsável",
                        accentColor: "#0E9F6E",
                        records,
                      });
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      </div>{/* /grid distribuição */}

            <SectionHeader title="Evolução" />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento"
          tooltip={`Mostra como o valor bruto dos procedimentos realizados evolui ao longo do tempo. O agrupamento acompanha a ${getDateModeLabel(tipoData)} selecionada no filtro global e organiza os pontos por dia, semana ou mês conforme o período.`}
          comparison={d.comparisons?.charts.evolucao}
        />
        {d.isLoading ? (
          <div className="skeleton h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={d.evolucao_acumulada}
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
              onClick={(state) => {
                const label = state?.activeLabel;
                const dataKey = state?.activePayload?.[0]?.dataKey;
                if (!label || dataKey !== "value") return;

                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.realizada &&
                    getEvolucaoBucketLabel(record.dataReferencia, dataInicio, dataFim) ===
                      label
                );

                if (!records.length) return;

                setSheetState({
                  title: "Procedimentos realizados no período selecionado",
                  description:
                    "Cards que compõem o ponto escolhido na linha de faturamento da evolução.",
                  contextLabel: `Período: ${label}`,
                  badgeLabel: "Evolução do faturamento",
                  accentColor: "#1A56DB",
                  records,
                });
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EB" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => fmtBRL(value)}
                width={72}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#9BAAB8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => fmtBRL(value)}
                width={72}
              />
              <Tooltip
                content={<ChartTooltipBRL />}
                cursor={{
                  stroke: "#1A56DB",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Faturamento"
                yAxisId="left"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#1A56DB" }}
              />
              <Line
                type="monotone"
                dataKey="acumulado"
                name="Acumulado"
                yAxisId="right"
                stroke="#0E9F6E"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: "#0E9F6E" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {!d.isLoading && d.tabela.length > 0 && <SectionHeader title="Registros" />}

      {!d.isLoading && d.tabela.length > 0 && (
        <div className="panel-shell overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#0F1923]">
                Registros operacionais
                <span className="ml-1.5 rounded-full bg-[#EEF3FF] px-2 py-0.5 text-xs font-medium text-clinic-blue">
                  {fmtNum(d.fechados_qtd)}
                </span>
              </h3>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 shrink-0 cursor-help text-[#C8D2DC] hover:text-[#9BAAB8]" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed" side="top">
                  Lista os procedimentos que saíram de Captação, Negociação e Perdido dentro do filtro atual. A tabela é ordenada pela Data de Agendamento e mostra até 60 registros.
                </TooltipContent>
              </UiTooltip>
            </div>
            <p className="mt-0.5 text-xs text-[#9BAAB8]">
              Ordenado por Data de Agendamento. Exibe até 60 registros.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Registros operacionais de procedimentos cirúrgicos
              </caption>
              <thead>
                <tr className="border-b border-border bg-[#F7F9FB]">
                  {[
                    ["Paciente", "text-left px-5"],
                    ["Agendamento", "text-left px-4"],
                    ["Tipo", "text-left px-4"],
                    ["Modalidade", "text-left px-4"],
                    ["Forma Pgto", "text-left px-4"],
                    ["Etapa", "text-left px-4"],
                    ["Valor bruto", "text-right px-4"],
                    ["Custo", "text-right px-4"],
                    ["Valor líquido", "text-right px-4"],
                    ["Pago", "text-center px-4"],
                  ].map(([label, cls]) => (
                    <th
                      key={label}
                      className={`py-2.5 text-xs font-medium uppercase tracking-wide text-[#9BAAB8] ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.tabela.map((row, index) => {
                  const badge = ETAPA_BADGE[row.etapa] ?? {
                    bg: "#F3F4F6",
                    text: "#374151",
                  };

                  return (
                    <tr
                      key={row.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}
                    >
                      <td className="px-5 py-2.5 font-medium text-[#0F1923]">
                        {row.nome}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#5C6B7A]">
                        {row.data_agendamento}
                      </td>
                      <td className="px-4 py-2.5 text-[#5C6B7A]">{row.tipo}</td>
                      <td className="px-4 py-2.5 text-[#5C6B7A]">{row.modalidade}</td>
                      <td className="px-4 py-2.5 text-[#5C6B7A]">{row.forma_pagamento !== "—" ? row.forma_pagamento : "-"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            background: badge.bg,
                            color: badge.text,
                          }}
                        >
                          {row.etapa}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-[#0F1923]">
                        {row.valor_bruto > 0 ? fmtBRL(row.valor_bruto) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-clinic-amber">
                        {row.custo > 0 ? fmtBRL(row.custo) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-clinic-green">
                        {row.valor_liq > 0 ? fmtBRL(row.valor_liq) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {row.sem_cobranca ? (
                          <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-medium text-clinic-blue">
                            {SEM_COBRANCA_STATUS}
                          </span>
                        ) : row.pago ? (
                          <CheckCircle2 className="inline h-4 w-4 text-clinic-green" />
                        ) : (
                          <XCircle className="inline h-4 w-4 text-[#DDE3EA]" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FunnelStageSheet
        open={Boolean(selectedStage)}
        onOpenChange={(open) => {
          if (!open) setSelectedStage(null);
        }}
        funnelLabel="Procedimentos"
        stageLabel={selectedStage ?? ""}
        accentColor={FUNIL_COLORS[selectedStage ?? ""] ?? "#1A56DB"}
        dateModeLabel={getDateModeLabel(tipoData)}
        records={selectedStageRecords}
      />

      <RecordsDrilldownSheet
        open={Boolean(sheetState)}
        onOpenChange={(open) => {
          if (!open) setSheetState(null);
        }}
        title={sheetState?.title ?? ""}
        description={sheetState?.description ?? ""}
        contextLabel={sheetState?.contextLabel}
        badgeLabel={sheetState?.badgeLabel}
        accentColor={sheetState?.accentColor ?? "#1A56DB"}
        records={sheetState?.records ?? []}
      />
    </div>
  );
}
