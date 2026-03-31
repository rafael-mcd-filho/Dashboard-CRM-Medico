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
import { FunnelStageSheet } from "@/components/dashboard/FunnelStageSheet";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { RecebimentoPanel } from "@/components/dashboard/RecebimentoPanel";
import { useFilters } from "@/contexts/FiltersContext";
import { useConsultasData } from "@/hooks/useConsultasData";
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

function EmptyChart({ label = "Sem dados no período" }: { label?: string }) {
  return (
    <div className="flex h-44 items-center justify-center text-sm text-[#9BAAB8]">
      {label}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Agendadas"
          value={fmtNum(d.agendadas)}
          description="Consultas que já saíram de Captação, Negociação e Perdido."
          tooltip="Conta as consultas do período que já saíram das etapas Captação, Negociação e Perdido."
          icon={Stethoscope}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.agendadas}
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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <CrossFunnelPanel
          title="Contatos também em outros funis"
          tooltip="Mostra quantos contatos da base atual de consultas também aparecem em espirometria, broncoscopia ou cirurgia dentro do mesmo filtro."
          items={crossFunnelItems}
          baseValue={d.base_consulta_contatos}
          baseLabel="Base de consultas"
          comparison={d.comparisons?.charts.cross_funnel}
          isLoading={d.isLoading}
        />

        <div className="panel-shell p-4">
          <PanelTitle
            title="Tempo médio de captação"
            tooltip="Tempo médio em dias entre a Data de Criação do Card e a Data de Agendamento."
            comparison={d.comparisons?.kpis.tempo_medio_captacao}
          />
          {d.isLoading ? (
            <div className="h-36 animate-pulse rounded-[22px] bg-[#F0F3F6]" />
          ) : (
            <div className="rounded-[20px] border border-[#E2E6EB] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7FAFF_100%)] p-4 shadow-[0_10px_28px_rgba(15,25,35,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BAAB8]">
                Jornada até o agendamento
              </p>
              <div className="mt-3 font-mono text-[2.15rem] font-bold leading-none tracking-[-0.07em] text-clinic-blue">
                {d.tempo_medio_captacao > 0
                  ? `${fmtDecimal(d.tempo_medio_captacao, 0)} dias`
                  : "—"}
              </div>
              <p className="mt-2.5 max-w-[34ch] text-[13px] leading-5 text-[#5C6B7A]">
                Mede quanto tempo, em média, os cards levam para sair da criação e
                chegar à data marcada para a consulta.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Funil por etapa"
          tooltip="Mostra como os cards de consulta se distribuem pelas etapas do funil dentro do filtro atual."
          comparison={d.comparisons?.charts.funil}
        />
        {d.isLoading ? (
          <div className="h-56 animate-pulse rounded-lg bg-[#F0F3F6]" />
        ) : d.funil.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, d.funil.length * 38)}>
            <BarChart
              data={d.funil}
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
                {d.funil.map((entry) => (
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
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Consultas por tipo"
            tooltip="Conta quantas consultas agendadas existem em cada tipo dentro do filtro atual. Quando o tipo não está preenchido, o registro entra como Não definido."
            comparison={d.comparisons?.charts.por_tipo}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.por_tipo.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, d.por_tipo.length * 44)}>
              <BarChart
                data={d.por_tipo}
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
                <Tooltip content={<TooltipNum />} cursor={{ fill: "#F0F3F6" }} />
                <Bar
                  dataKey="qtd"
                  name="Quantidade"
                  fill="#1A56DB"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
                >
                  {d.por_tipo.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#1A56DB"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.tipo === entry.name &&
                            record.meta?.agendadaBase
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Consultas do tipo selecionado",
                          description:
                            "Cards que compõem a barra escolhida em Consultas por tipo.",
                          contextLabel: `Tipo: ${entry.name}`,
                          badgeLabel: "Consultas por tipo",
                          accentColor: "#1A56DB",
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

        <div className="panel-shell p-4">
          <PanelTitle
            title="Faturamento por modalidade"
            tooltip="Soma o valor bruto das consultas realizadas em cada modalidade de pagamento. Quando a modalidade não está preenchida, o registro entra como Não definido."
            comparison={d.comparisons?.charts.por_modalidade}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.por_modalidade.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, d.por_modalidade.length * 44)}>
              <BarChart
                data={d.por_modalidade}
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
                <Tooltip content={<TooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="fat" name="Faturamento" fill="#0891B2" radius={[0, 4, 4, 0]}>
                  {d.por_modalidade.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#0891B2"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.modalidade === entry.name &&
                            record.meta?.realizada
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Faturamento da modalidade selecionada",
                          description:
                            "Consultas realizadas que compõem a barra escolhida em Faturamento por modalidade.",
                          contextLabel: `Modalidade: ${entry.name}`,
                          badgeLabel: "Faturamento por modalidade",
                          accentColor: "#0891B2",
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
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Consultas por origem"
            tooltip="Conta quantas consultas agendadas estão ligadas a cada origem de contato. A origem é classificada pelas tags e pela origem do contato, não pelo texto cru do card."
            comparison={d.comparisons?.charts.por_origem}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.por_origem.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, d.por_origem.length * 40)}>
              <BarChart
                data={d.por_origem}
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
                <Tooltip content={<TooltipNum />} cursor={{ fill: "#F0F3F6" }} />
                <Bar
                  dataKey="value"
                  fill="#7C3AED"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
                >
                  {d.por_origem.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#7C3AED"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.origem === entry.name &&
                            record.meta?.agendadaBase
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Consultas da origem selecionada",
                          description:
                            "Cards que compõem a barra escolhida em Consultas por origem.",
                          contextLabel: `Origem: ${entry.name}`,
                          badgeLabel: "Consultas por origem",
                          accentColor: "#7C3AED",
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

        <div className="panel-shell p-4">
          <PanelTitle
            title="Faturamento por origem"
            tooltip="Soma o faturamento bruto das consultas realizadas em cada origem de contato, usando a mesma classificação de origem aplicada no restante do dashboard."
            comparison={d.comparisons?.charts.faturamento_por_origem}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.faturamento_por_origem.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, d.faturamento_por_origem.length * 40)}>
              <BarChart
                data={d.faturamento_por_origem}
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
                <Tooltip content={<TooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" name="Faturamento" fill="#0891B2" radius={[0, 4, 4, 0]}>
                  {d.faturamento_por_origem.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#0891B2"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.origem === entry.name &&
                            record.meta?.realizada
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Faturamento da origem selecionada",
                          description:
                            "Consultas realizadas que compõem a barra escolhida em Faturamento por origem.",
                          contextLabel: `Origem: ${entry.name}`,
                          badgeLabel: "Faturamento por origem",
                          accentColor: "#0891B2",
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
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Realizadas por responsável"
          tooltip="Conta quantas consultas realizadas ficaram com cada responsável dentro do filtro atual."
          comparison={d.comparisons?.charts.realizadas_por_responsavel}
        />
        {d.isLoading ? (
          <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
        ) : d.realizadas_por_responsavel.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, d.realizadas_por_responsavel.length * 36)}>
            <BarChart
              data={d.realizadas_por_responsavel}
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
              <Tooltip content={<TooltipNum unit="realizadas" />} cursor={{ fill: "#F0F3F6" }} />
                <Bar
                  dataKey="value"
                  fill="#0E9F6E"
                  radius={[0, 4, 4, 0]}
                  label={{ position: "right", fontSize: 11, fill: "#9BAAB8" }}
                >
                  {d.realizadas_por_responsavel.map((entry) => (
                    <Cell
                      key={entry.name}
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
                          title: "Consultas realizadas do responsável",
                          description:
                            "Cards que compõem a barra escolhida em Realizadas por responsável.",
                          contextLabel: `Responsável: ${entry.name}`,
                          badgeLabel: "Realizadas por responsável",
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

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento"
          tooltip={`Mostra como o faturamento das consultas realizadas evolui no tempo. Entram apenas consultas em Realizado, Retorno Agendado, Compareceu Retorno, Não Compareceu Retorno ou Finalizado/Concluído, e os pontos seguem a ${getDateModeLabel(tipoData)} selecionada no filtro global.`}
          comparison={d.comparisons?.charts.evolucao}
        />
        {d.isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
                        {row.pago ? (
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
