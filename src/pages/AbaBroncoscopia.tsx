import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Microscope,
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CrossFunnelPanel } from "@/components/dashboard/CrossFunnelPanel";
import { EmptyChart } from "@/components/dashboard/EmptyChart";
import { DistribuicaoTabsPanel } from "@/components/dashboard/DistribuicaoTabsPanel";
import { FunnelStageSheet } from "@/components/dashboard/FunnelStageSheet";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { LossDiagnosticsPanel } from "@/components/dashboard/LossDiagnosticsPanel";
import { LossReasonsPanel } from "@/components/dashboard/LossReasonsPanel";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { RecebimentoPanel } from "@/components/dashboard/RecebimentoPanel";
import { useFilters } from "@/contexts/FiltersContext";
import { useBroncoscopiaData } from "@/hooks/useBroncoscopiaData";
import { SEM_COBRANCA_STATUS } from "@/lib/billing";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";

const FUNIL_COLORS: Record<string, string> = {
  "Captação": "#9BAAB8",
  "Negociação": "#60A5FA",
  Perdido: "#6B7280",
  Agendado: "#1A56DB",
  "Em Confirmação": "#3B82F6",
  Confirmado: "#0891B2",
  "Não Confirmado": "#F59E0B",
  Lembrete: "#8B5CF6",
  Realizado: "#0E9F6E",
  "Exames / Resultados": "#059669",
  "Não compareceu": "#DC2626",
  "Retorno Agendado": "#0891B2",
  "Compareceu Retorno": "#0E9F6E",
  "Não Compareceu Retorno": "#EF4444",
  "Finalizado/Concluído": "#065F46",
};

const ETAPA_BADGE: Record<string, { bg: string; text: string }> = {
  "Finalizado/Concluído": { bg: "#D1FAE5", text: "#065F46" },
  Realizado: { bg: "#DBEAFE", text: "#1E40AF" },
  "Exames / Resultados": { bg: "#D1FAE5", text: "#065F46" },
  "Retorno Agendado": { bg: "#DBEAFE", text: "#1E40AF" },
  "Compareceu Retorno": { bg: "#D1FAE5", text: "#065F46" },
  Agendado: { bg: "#EFF6FF", text: "#1D4ED8" },
  "Não compareceu": { bg: "#FEE2E2", text: "#991B1B" },
  "Não Compareceu Retorno": { bg: "#FEE2E2", text: "#991B1B" },
  Perdido: { bg: "#F3F4F6", text: "#374151" },
};

const TIPO_COLORS: Record<string, string> = {
  Adulto: "#1A56DB",
  Infantil: "#0891B2",
  "Não definido": "#9BAAB8",
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
  unit = "broncoscopias",
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

export default function AbaBroncoscopia() {
  const d = useBroncoscopiaData();
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

  const comparativoTipoPaciente = Array.from(
    new Set([
      ...d.por_tipo_paciente.map((item) => item.name),
      ...d.por_tipo_realizado.map((item) => item.name),
    ])
  )
    .map((name) => ({
      name,
      agendadas: d.por_tipo_paciente.find((item) => item.name === name)?.value ?? 0,
      realizadas: d.por_tipo_realizado.find((item) => item.name === name)?.value ?? 0,
    }))
    .sort((a, b) => b.agendadas - a.agendadas);

  /* §13 — per-tipo faturamento from full records */
  const tipoFaturamento = useMemo(() => {
    const map: Record<string, number> = {};
    (d.funil_registros ?? []).forEach((r) => {
      const tipo = (r.meta?.tipoPaciente as string | undefined) ?? "Não definido";
      if (r.meta?.realizada) {
        map[tipo] = (map[tipo] ?? 0) + (r.valor ?? 0);
      }
    });
    return map;
  }, [d.funil_registros]);

  /* §13 — codigos KPIs: media + total */
  const codigosKpis = useMemo(() => {
    let totalCodigos = 0;
    let totalProc = 0;
    d.por_codigos.forEach((entry) => {
      const num = parseInt(entry.name, 10);
      if (!isNaN(num)) {
        totalCodigos += num * entry.value;
        totalProc += entry.value;
      }
    });
    return {
      media: totalProc > 0 ? totalCodigos / totalProc : 0,
      total: totalCodigos,
    };
  }, [d.por_codigos]);

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
          <Microscope className="h-5 w-5 text-clinic-blue" />
          <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
            Broncoscopia
          </h1>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
          Volume, faturamento, vínculo com consulta e recebimento do funil de
          broncoscopia.
        </p>
      </div>

      <SectionHeader title="Visão" />

      <div className="animate-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Agendadas"
          value={fmtNum(d.agendadas)}
          description="Broncoscopias que já saíram de Captação, Negociação e Perdido."
          tooltip="Conta as broncoscopias que já saíram de Captação, Negociação e Perdido."
          icon={Microscope}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.agendadas}
        />
        <HeroMetricCard
          label="Realizadas"
          value={fmtNum(d.realizadas)}
          description="Cards que chegaram às etapas tratadas como realizadas no funil."
          tooltip="Conta as broncoscopias em Realizado, Exames / Resultados, Retorno Agendado, Compareceu Retorno, Não Compareceu Retorno ou Finalizado/Concluído."
          icon={CheckCircle2}
          tone="teal"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.realizadas}
        />
        <HeroMetricCard
          label="Faturamento"
          value={fmtBRL(d.faturamento)}
          description="Valor bruto gerado apenas pela base de broncoscopias realizadas."
          tooltip="Soma o valor bruto apenas das broncoscopias consideradas realizadas."
          icon={Wallet}
          tone="purple"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.faturamento}
        />
        <HeroMetricCard
          label="Ticket médio"
          value={fmtBRL(d.ticket_medio)}
          description="Faturamento médio por paciente usando a mesma base das realizadas."
          tooltip="Mostra o faturamento médio por paciente usando a mesma base das broncoscopias realizadas. Cada paciente entra uma vez no cálculo."
          icon={TrendingUp}
          tone="amber"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.ticket_medio}
        />
      </div>

      {/* §13 — KPIs extras: códigos médios + total de códigos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HeroMetricCard
          label="Códigos médios/broncoscopia"
          value={codigosKpis.media > 0 ? fmtDecimal(codigosKpis.media, 1) : "—"}
          description="Média de códigos de procedimento por broncoscopia no período."
          tooltip="Calculado a partir da distribuição de quantidades de códigos por card agendado. Indica a complexidade média dos procedimentos."
          icon={Microscope}
          tone="teal"
          isLoading={d.isLoading}
        />
        <HeroMetricCard
          label="Total de códigos faturados"
          value={codigosKpis.total > 0 ? fmtNum(codigosKpis.total) : "—"}
          description="Soma de todos os códigos de procedimento das broncoscopias no período."
          tooltip="Soma a quantidade de códigos de cada broncoscopia agendada no período. Um card com 2 códigos contribui com 2 para o total."
          icon={TrendingUp}
          tone="purple"
          isLoading={d.isLoading}
        />
      </div>

      <SectionHeader title="Performance" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.9fr)]">
        <PerformancePanel
          title="Performance operacional"
          tooltip="Resume a base agendada, o volume realizado e os dois tipos de no-show. A taxa mostra quanto da base agendada avançou para realizado."
          comparison={d.comparisons?.kpis.taxa_conversao}
          isLoading={d.isLoading}
          headlineLabel="Taxa de realização"
          headlineValue={fmtPct(d.taxa_conversao)}
          headlineDescription="Quanto da base agendada já avançou para as etapas consideradas realizadas neste período."
          progressValue={d.taxa_conversao}
          progressColor="#7C3AED"
          stats={[
            {
              label: "Agendadas",
              value: fmtNum(d.agendadas),
              tone: "default",
            },
            {
              label: "Realizadas",
              value: fmtNum(d.realizadas),
              tone: "success",
            },
            {
              label: "No-show bronco",
              value: fmtNum(d.no_show),
              sub: `${fmtPct(d.no_show_pct)} dos agendamentos`,
              tone: "danger",
            },
            {
              label: "No-show retorno",
              value: fmtNum(d.no_show_retorno),
              sub: `${fmtPct(d.no_show_retorno_pct)} das realizadas`,
              tone: "warning",
            },
          ]}
        />

        <RecebimentoPanel
          title="Recebimento"
          tooltip="Mostra o volume pago, quanto foi recebido no mesmo dia do procedimento e o prazo médio de recebimento."
          comparison={d.comparisons?.kpis.pago_no_dia_pct}
          isLoading={d.isLoading}
          destaqueLabel="Pagos no dia"
          destaqueValue={fmtPct(d.pago_no_dia_pct)}
          destaqueDescription="Mostra qual parte das broncoscopias pagas foi recebida no mesmo dia do procedimento."
          destaqueRatio={d.pago_no_dia_pct}
          stats={[
            {
              label: "Pagos",
              value: fmtNum(d.pago_qtd),
              tone: "default",
            },
            {
              label: "No dia",
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

      <SectionHeader title="Cross-funnel" />

      <CrossFunnelPanel
        title="Vínculo com consulta"
        tooltip="Mostra quantos contatos da base atual de broncoscopia também aparecem em consultas dentro do mesmo filtro."
        items={[
          {
            name: "Com consulta",
            value: d.conversao_consulta,
            share: d.conversao_consulta_pct,
            color: "#0891B2",
          },
        ]}
        baseValue={d.base_contatos}
        baseLabel="Base bronco"
        comparison={d.comparisons?.kpis.conversao_consulta}
        isLoading={d.isLoading}
        emptyLabel="Sem broncoscopias com contato no período"
      />

      <SectionHeader title="Funil por Etapa" />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Funil por etapa"
          tooltip="Mostra quantos cards de broncoscopia estão em cada etapa do funil dentro do filtro atual. A ordem segue o CRM para facilitar a leitura operacional."
          comparison={d.comparisons?.charts.funil}
        />
        {(() => {
          const funnelItems = d.funil.filter((e) => e.value > 0);
          return d.isLoading ? (
            <div className="skeleton h-56" />
          ) : funnelItems.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, funnelItems.length * 38)}>
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
                  width={168}
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

      <SectionHeader title="Análise de Perda" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <LossReasonsPanel
          items={d.motivos_perda}
          comparison={d.comparisons?.charts.motivos_perda}
          isLoading={d.isLoading}
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

      <SectionHeader title="Distribuição" />

      {/* §13 — Mini-painel comparativo Adulto vs Infantil */}
      <div className="panel-shell p-4">
        <PanelTitle
          title="Tipo de paciente"
          tooltip="Compara volume, realizações e faturamento entre Adulto e Infantil dentro do filtro atual."
          comparison={d.comparisons?.charts.comparativo_tipo_paciente}
        />
        {d.isLoading ? (
          <div className="skeleton h-32" />
        ) : comparativoTipoPaciente.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {comparativoTipoPaciente.map((entry) => {
              const color = TIPO_COLORS[entry.name] ?? "#9BAAB8";
              const noShow = Math.max(0, entry.agendadas - entry.realizadas);
              const noShowPct = entry.agendadas > 0 ? noShow / entry.agendadas : 0;
              const fat = tipoFaturamento[entry.name] ?? 0;
              return (
                <button
                  key={entry.name}
                  type="button"
                  className="panel-shell flex flex-col gap-3 p-4 text-left transition-all hover:shadow-pop"
                  onClick={() => {
                    const records = currentRecords.filter(
                      (r) => r.meta?.tipoPaciente === entry.name
                    );
                    if (!records.length) return;
                    setSheetState({
                      title: `Broncoscopias — ${entry.name}`,
                      description: `Todos os cards do tipo ${entry.name} no período atual.`,
                      contextLabel: `Tipo: ${entry.name}`,
                      badgeLabel: "Tipo de paciente",
                      accentColor: color,
                      records,
                    });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-[#0F1923]">{entry.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div>
                      <p className="text-[#9BAAB8]">Agendadas</p>
                      <p className="font-semibold text-[#0F1923]">{fmtNum(entry.agendadas)}</p>
                    </div>
                    <div>
                      <p className="text-[#9BAAB8]">Realizadas</p>
                      <p className="font-semibold text-[#0E9F6E]">{fmtNum(entry.realizadas)}</p>
                    </div>
                    <div>
                      <p className="text-[#9BAAB8]">No-show</p>
                      <p className="font-semibold text-[#F59E0B]">
                        {fmtNum(noShow)}{" "}
                        <span className="font-normal text-[#9BAAB8]">({fmtPct(noShowPct)})</span>
                      </p>
                    </div>
                    {fat > 0 && (
                      <div>
                        <p className="text-[#9BAAB8]">Faturamento</p>
                        <p className="font-semibold text-[#0F1923]">{fmtBRL(fat)}</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid 3 colunas (2 em telas médias) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Faturamento por modalidade"
          tooltip="Faturamento bruto das broncoscopias realizadas agrupado por modalidade."
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
                    "Broncoscopias realizadas que compõem a barra escolhida em Faturamento por modalidade.",
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
          title="Broncoscopias por origem"
          tooltip="Quantidade de broncoscopias agendadas agrupadas por origem de captação do paciente."
          tabs={[
            {
              key: "origem",
              label: "Origem",
              data: d.por_origem,
              tooltipType: "count",
              unit: "broncoscopias",
              color: "#7C3AED",
              yAxisWidth: 120,
              onBarClick: (name) => {
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.origem === name && record.meta?.agendadaBase
                );
                if (!records.length) return;
                setSheetState({
                  title: "Broncoscopias da origem selecionada",
                  description:
                    "Cards que compõem a barra escolhida em Broncoscopias por origem.",
                  contextLabel: `Origem: ${name}`,
                  badgeLabel: "Broncoscopias por origem",
                  accentColor: "#7C3AED",
                  records,
                });
              },
            },
          ]}
        />

        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Quantidade de códigos"
          tooltip="Distribuição de broncoscopias agendadas de acordo com a quantidade de códigos de procedimento utilizados."
          tabs={[
            {
              key: "codigos",
              label: "Códigos",
              data: d.por_codigos,
              tooltipType: "count",
              unit: "procedimentos",
              color: "#0891B2",
              yAxisWidth: 90,
              onBarClick: (name) => {
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.codigos === name && record.meta?.agendadaBase
                );
                if (!records.length) return;
                setSheetState({
                  title: "Broncoscopias da quantidade de códigos selecionada",
                  description:
                    "Cards que compõem a barra escolhida em Quantidade de códigos.",
                  contextLabel: `Códigos: ${name}`,
                  badgeLabel: "Quantidade de códigos",
                  accentColor: "#0891B2",
                  records,
                });
              },
            },
          ]}
        />
      </div>

            <SectionHeader title="Evolução" />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento"
          tooltip={`Mostra como o faturamento das broncoscopias realizadas evolui no tempo. O agrupamento acompanha a ${getDateModeLabel(tipoData)} selecionada no filtro global e organiza os pontos por dia, semana ou mês conforme o período.`}
          comparison={d.comparisons?.charts.evolucao}
        />
        {d.isLoading ? (
          <div className="skeleton h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={d.evolucao}
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
              onClick={(state) => {
                const label = state?.activeLabel;
                if (!label) return;
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.realizada &&
                    getEvolucaoBucketLabel(record.dataReferencia, dataInicio, dataFim) ===
                      label
                );
                if (!records.length) return;
                setSheetState({
                  title: "Broncoscopias realizadas no período selecionado",
                  description:
                    "Cards que compõem o ponto escolhido na evolução do faturamento.",
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
                stroke="#1A56DB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#1A56DB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {!d.isLoading && d.tabela.length > 0 && <SectionHeader title="Registros" />}

      {!d.isLoading && d.tabela.length > 0 && (
        <div className="panel-shell overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-[#0F1923]">
              Registros operacionais
              <span className="ml-1.5 rounded-full bg-[#EEF3FF] px-2 py-0.5 text-xs font-medium text-clinic-blue">
                {fmtNum(d.agendadas)}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-[#9BAAB8]">
              Ordenado por Data de Agendamento. Exibe até 60 registros.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Registros operacionais de broncoscopia</caption>
              <thead>
                <tr className="border-b border-border bg-[#F7F9FB]">
                  {[
                    ["Paciente", "text-left px-5"],
                    ["Agendamento", "text-left px-4"],
                    ["Tipo", "text-left px-4"],
                    ["Modalidade", "text-left px-4"],
                    ["Forma Pgto", "text-left px-4"],
                    ["Cód.", "text-center px-3"],
                    ["Etapa", "text-left px-4"],
                    ["Valor", "text-right px-4"],
                    ["Pago", "text-center px-4"],
                    ["De consulta", "text-center px-4"],
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
                      <td className="px-4 py-2.5 text-[#5C6B7A]">
                        {row.tipo_paciente}
                      </td>
                      <td className="px-4 py-2.5 text-[#5C6B7A]">
                        {row.modalidade}
                      </td>
                      <td className="px-4 py-2.5 text-[#5C6B7A]">
                        {row.forma_pagamento !== "—" ? row.forma_pagamento : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-xs text-[#5C6B7A]">
                        {row.qtd_codigos}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {row.etapa}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-[#0F1923]">
                        {row.valor > 0 ? fmtBRL(row.valor) : "—"}
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
                      <td className="px-4 py-2.5 text-center">
                        {row.convertida ? (
                          <CheckCircle2 className="inline h-4 w-4 text-clinic-teal" />
                        ) : (
                          <span className="text-[#DDE3EA]">—</span>
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
        funnelLabel="Broncoscopia"
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
