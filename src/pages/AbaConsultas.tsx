import { useMemo, useState } from "react";
import {
  CheckCircle2,
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
import { useConsultasData } from "@/hooks/useConsultasData";
import { SEM_COBRANCA_STATUS } from "@/lib/billing";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";

const FUNIL_COLORS: Record<string, string> = {
  "Captação": "#9BAAB8",
  "Negociação": "#60A5FA",
  Agendado: "#1A56DB",
  "Em Confirmação": "#3B82F6",
  Confirmado: "#0891B2",
  "Não Confirmado": "#F59E0B",
  Lembrete: "#8B5CF6",
  Realizado: "#0E9F6E",
  "Retorno Agendado": "#0891B2",
  "Compareceu Retorno": "#0E9F6E",
  "Não compareceu": "#DC2626",
  "Não Compareceu Retorno": "#EF4444",
  "Finalizado/Concluído": "#065F46",
  Perdido: "#6B7280",
};

const ETAPA_BADGE: Record<string, { bg: string; text: string }> = {
  "Finalizado/Concluído": { bg: "#D1FAE5", text: "#065F46" },
  Realizado: { bg: "#DBEAFE", text: "#1E40AF" },
  "Retorno Agendado": { bg: "#DBEAFE", text: "#1E40AF" },
  "Compareceu Retorno": { bg: "#D1FAE5", text: "#065F46" },
  Agendado: { bg: "#EFF6FF", text: "#1D4ED8" },
  "Em Confirmação": { bg: "#EFF6FF", text: "#1D4ED8" },
  Confirmado: { bg: "#CFFAFE", text: "#0E7490" },
  "Não compareceu": { bg: "#FEE2E2", text: "#991B1B" },
  "Não Compareceu Retorno": { bg: "#FEE2E2", text: "#991B1B" },
  Perdido: { bg: "#F3F4F6", text: "#374151" },
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

function TooltipNum({
  active,
  payload,
  label,
  unit = "consultas",
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

export default function AbaConsultas() {
  const d = useConsultasData();
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

  const selectedStageRecords = useMemo(
    () =>
      selectedStage
        ? (d.funil_registros ?? []).filter((row) => row.etapa === selectedStage)
        : [],
    [d.funil_registros, selectedStage]
  );

  const currentRecords = d.funil_registros ?? [];

  const crossFunnelItems = [
    {
      name: "Espirometria",
      value: d.conversao_espirometria,
      share: d.conversao_espirometria_pct,
      color: "#0891B2",
    },
    {
      name: "Broncoscopia",
      value: d.conversao_broncoscopia,
      share: d.conversao_broncoscopia_pct,
      color: "#059669",
    },
    {
      name: "Cirurgia",
      value: d.conversao_cirurgia,
      share: d.conversao_cirurgia_pct,
      color: "#7C3AED",
    },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-clinic-blue" />
          <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
            Consultas
          </h1>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
          Volume, faturamento, recebimento e presença em outros funis dentro da
          base de consultas.
        </p>
      </div>

      <SectionHeader title="Visão" />

      <div className="animate-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Agendadas"
          value={fmtNum(d.agendadas)}
          description="Consultas que já saíram de Captação, Negociação e Perdido."
          tooltip="Conta as consultas do período que já saíram das etapas Captação, Negociação e Perdido."
          icon={Stethoscope}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.agendadas}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Realizadas"
          value={fmtNum(d.realizadas)}
          description="Cards que chegaram às etapas consideradas realizadas no funil."
          tooltip="Conta as consultas em Realizado, Retorno Agendado, Compareceu Retorno, Não Compareceu Retorno ou Finalizado/Concluído."
          icon={CheckCircle2}
          tone="teal"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.realizadas}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Faturamento"
          value={fmtBRL(d.faturamento)}
          description="Valor bruto gerado apenas pela base de consultas realizadas."
          tooltip="Soma o valor bruto apenas das consultas consideradas realizadas no período."
          icon={Wallet}
          tone="purple"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.faturamento}
          trend={d.evolucao?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Ticket médio"
          value={fmtBRL(d.ticket_medio)}
          description="Faturamento médio por paciente usando a mesma base das realizadas."
          tooltip="Mostra o faturamento médio por paciente usando a mesma base das consultas realizadas. Cada paciente entra uma vez no cálculo."
          icon={TrendingUp}
          tone="amber"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.ticket_medio}
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
              label: "No-show consulta",
              value: fmtNum(d.no_show_consulta),
              sub: `${fmtPct(d.no_show_consulta_pct)} dos agendamentos`,
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
          tooltip="Mostra o volume pago, quanto foi recebido no mesmo dia e o prazo médio de recebimento."
          comparison={d.comparisons?.kpis.pago_no_dia_pct}
          isLoading={d.isLoading}
          destaqueLabel="Pagos no dia"
          destaqueValue={fmtPct(d.pago_no_dia_pct)}
          destaqueDescription="Mostra qual parte das consultas pagas foi recebida no mesmo dia do atendimento."
          destaqueRatio={d.pago_no_dia_pct}
          stats={[
            {
              label: "Pagos",
              value: fmtNum(d.pago_qtd),
              tone: "default",
            },
            {
              label: "Prazo médio",
              value: d.prazo_medio > 0 ? `${fmtDecimal(d.prazo_medio, 0)} dias` : "—",
              tone: "amber",
            },
            {
              label: "Tempo de captação",
              value:
                d.tempo_medio_captacao > 0
                  ? `${fmtDecimal(d.tempo_medio_captacao, 0)} dias`
                  : "—",
              tone: "teal",
            },
          ]}
        />
      </div>

      <SectionHeader title="Cross-funnel" />

      <CrossFunnelPanel
        title="Contatos também em outros funis"
        tooltip="Mostra quantos contatos da base atual de consultas também aparecem em espirometria, broncoscopia ou cirurgia dentro do mesmo filtro. Clique em um item para ver os detalhes."
        items={crossFunnelItems}
        baseValue={d.base_consulta_contatos}
        baseLabel="Base de consultas"
        comparison={d.comparisons?.charts.cross_funnel}
        isLoading={d.isLoading}
        onItemClick={(name) => {
          setSheetState({
            title: `Consultas com passagem por ${name}`,
            description: `Contatos da base atual de consultas que também possuem cards em ${name} no período.`,
            contextLabel: `Funil: ${name}`,
            badgeLabel: "Cross-funnel",
            accentColor: crossFunnelItems.find((i) => i.name === name)?.color ?? "#1A56DB",
            records: currentRecords.filter((r) => r.meta?.agendadaBase),
          });
        }}
      />

      <SectionHeader title="Funil por Etapa" />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Funil por etapa"
          tooltip="Mostra como os cards de consulta se distribuem pelas etapas do funil dentro do filtro atual."
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
                <Tooltip content={<TooltipNum />} cursor={{ fill: "#F0F3F6" }} />
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
          onBarClick={() => {
            const records = currentRecords.filter((r) =>
              r.etapa.toLowerCase().includes("perdido")
            );
            if (!records.length) return;
            setSheetState({
              title: "Registros perdidos — Consultas",
              description: "Cards na etapa Perdido do funil de consultas no período atual.",
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

      {/* ── Indicadores de retorno e conversão ── */}
      {!d.isLoading && (() => {
        const retornoAgendado = d.funil?.find((f) => f.name === "Retorno Agendado")?.value ?? 0;
        const pctRetorno = d.realizadas > 0 ? retornoAgendado / d.realizadas : 0;
        const taxaConvCirurgia = d.conversao_cirurgia_pct;

        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {/* % Retorno agendado */}
            <div className="panel-shell p-4">
              <p className="section-label text-clinic-teal">% Retorno agendado</p>
              <p className="mt-3 kpi-value-lg text-slate-900">{fmtPct(pctRetorno)}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {fmtNum(retornoAgendado)} retornos de {fmtNum(d.realizadas)} realizadas
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-clinic-teal transition-[width] duration-500"
                  style={{ width: `${Math.min(100, pctRetorno * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Proporção das consultas realizadas que geraram retorno agendado.
              </p>
            </div>

            {/* Conversão consulta → cirurgia */}
            <div className="panel-shell p-4">
              <p className="section-label text-clinic-purple">Conversão consulta → cirurgia</p>
              <p className="mt-3 kpi-value-lg text-slate-900">{fmtPct(taxaConvCirurgia)}</p>
              <p className="mt-1 text-[12px] text-slate-500">
                {fmtNum(d.conversao_cirurgia)} de {fmtNum(d.base_consulta_contatos)} pacientes
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-clinic-purple transition-[width] duration-500"
                  style={{ width: `${Math.min(100, taxaConvCirurgia * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Pacientes com consulta que também aparecem em procedimentos cirúrgicos.
              </p>
            </div>

            {/* Velocidade de captação */}
            <div className="panel-shell p-4">
              <p className="section-label text-clinic-amber">Velocidade de captação</p>
              <p className="mt-3 kpi-value-lg text-slate-900">
                {d.tempo_medio_captacao > 0
                  ? `${fmtDecimal(d.tempo_medio_captacao, 0)} dias`
                  : "—"}
              </p>
              <p className="mt-1 text-[12px] text-slate-500">
                Média entre criação do card e data de agendamento
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Indica o tempo médio que um lead leva para sair de captação e ser efetivamente agendado.
              </p>
            </div>
          </div>
        );
      })()}

      <SectionHeader title="Distribuição" />

      {/* Grid 2 colunas — 4 painéis de distribuição */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Consultas por tipo"
          tooltip="Quantidade de consultas agendadas agrupadas por tipo de atendimento."
          tabs={[
            {
              key: "tipo",
              label: "Tipo",
              data: d.por_tipo.map((e) => ({ name: e.name, value: e.qtd })),
              tooltipType: "count",
              unit: "consultas",
              color: "#1A56DB",
              yAxisWidth: 120,
              onBarClick: (name) => {
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.tipo === name && record.meta?.agendadaBase
                );
                if (!records.length) return;
                setSheetState({
                  title: "Consultas do tipo selecionado",
                  description:
                    "Cards que compõem a barra escolhida em Consultas por tipo.",
                  contextLabel: `Tipo: ${name}`,
                  badgeLabel: "Consultas por tipo",
                  accentColor: "#1A56DB",
                  records,
                });
              },
            },
          ]}
        />

        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Faturamento por modalidade"
          tooltip="Faturamento bruto das consultas realizadas agrupado por modalidade."
          tabs={[
            {
              key: "modalidade",
              label: "Modalidade",
              data: d.por_modalidade.map((e) => ({ name: e.name, value: e.fat })),
              tooltipType: "brl",
              color: "#0891B2",
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
                    "Consultas realizadas que compõem a barra escolhida em Faturamento por modalidade.",
                  contextLabel: `Modalidade: ${name}`,
                  badgeLabel: "Faturamento por modalidade",
                  accentColor: "#0891B2",
                  records,
                });
              },
            },
          ]}
        />

        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Consultas por origem"
          tooltip="Quantidade de consultas agendadas agrupadas por origem de captação do paciente."
          tabs={[
            {
              key: "origem",
              label: "Origem",
              data: d.por_origem,
              tooltipType: "count",
              unit: "consultas",
              color: "#7C3AED",
              yAxisWidth: 120,
              onBarClick: (name) => {
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.origem === name && record.meta?.agendadaBase
                );
                if (!records.length) return;
                setSheetState({
                  title: "Consultas da origem selecionada",
                  description:
                    "Cards que compõem a barra escolhida em Consultas por origem.",
                  contextLabel: `Origem: ${name}`,
                  badgeLabel: "Consultas por origem",
                  accentColor: "#7C3AED",
                  records,
                });
              },
            },
          ]}
        />

        <DistribuicaoTabsPanel
          isLoading={d.isLoading}
          title="Faturamento por origem"
          tooltip="Faturamento bruto das consultas realizadas agrupado por origem de captação do paciente."
          tabs={[
            {
              key: "fat_origem",
              label: "Fat. Origem",
              data: d.faturamento_por_origem,
              tooltipType: "brl",
              color: "#0891B2",
              yAxisWidth: 120,
              onBarClick: (name) => {
                const records = currentRecords.filter(
                  (record) =>
                    record.meta?.origem === name && record.meta?.realizada
                );
                if (!records.length) return;
                setSheetState({
                  title: "Faturamento da origem selecionada",
                  description:
                    "Consultas realizadas que compõem a barra escolhida em Faturamento por origem.",
                  contextLabel: `Origem: ${name}`,
                  badgeLabel: "Faturamento por origem",
                  accentColor: "#0891B2",
                  records,
                });
              },
            },
          ]}
        />
      </div>

      {/* Realizadas por responsável — largura total */}
      <DistribuicaoTabsPanel
        isLoading={d.isLoading}
        title="Realizadas por responsável"
        tooltip="Quantidade de consultas realizadas agrupadas por responsável."
        tabs={[
          {
            key: "responsavel",
            label: "Responsável",
            data: d.realizadas_por_responsavel,
            tooltipType: "count",
            unit: "realizadas",
            color: "#0E9F6E",
            yAxisWidth: 120,
            onBarClick: (name) => {
              const records = currentRecords.filter(
                (record) =>
                  record.responsavel === name && record.meta?.realizada
              );
              if (!records.length) return;
              setSheetState({
                title: "Consultas realizadas do responsável",
                description:
                  "Consultas realizadas que compõem a barra escolhida em Realizadas por responsável.",
                contextLabel: `Responsável: ${name}`,
                badgeLabel: "Realizadas por responsável",
                accentColor: "#0E9F6E",
                records,
              });
            },
          },
        ]}
      />

            <SectionHeader title="Evolução" />

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento"
          tooltip={`Mostra como o faturamento das consultas realizadas evolui no tempo. Entram apenas consultas em Realizado, Retorno Agendado, Compareceu Retorno, Não Compareceu Retorno ou Finalizado/Concluído, e os pontos seguem a ${getDateModeLabel(tipoData)} selecionada no filtro global.`}
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
                  title: "Consultas realizadas no período selecionado",
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
                content={<TooltipBRL />}
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
              <caption className="sr-only">Registros operacionais de consultas</caption>
              <thead>
                <tr className="border-b border-border bg-[#F7F9FB]">
                  {[
                    ["Paciente", "text-left px-5"],
                    ["Agendamento", "text-left px-4"],
                    ["Tipo", "text-left px-4"],
                    ["Modalidade", "text-left px-4"],
                    ["Forma Pgto", "text-left px-4"],
                    ["Origem", "text-left px-4"],
                    ["Etapa", "text-left px-4"],
                    ["Valor", "text-right px-4"],
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
                      <td className="px-4 py-2.5 text-[#5C6B7A]">{row.origem}</td>
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
        funnelLabel="Consultas"
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
