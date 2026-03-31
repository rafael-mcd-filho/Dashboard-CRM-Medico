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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FinancialBridgePanel } from "@/components/dashboard/FinancialBridgePanel";
import { FunnelStageSheet } from "@/components/dashboard/FunnelStageSheet";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PerformancePanel } from "@/components/dashboard/PerformancePanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { RecebimentoPanel } from "@/components/dashboard/RecebimentoPanel";
import { useFilters } from "@/contexts/FiltersContext";
import { useProcedimentosData } from "@/hooks/useProcedimentosData";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";
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

function EmptyChart({ label = "Sem dados no período" }: { label?: string }) {
  return (
    <div className="flex h-44 items-center justify-center text-sm text-[#9BAAB8]">
      {label}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Fechados"
          value={fmtNum(d.fechados_qtd)}
          description="Base comercial que já saiu de Captação, Negociação e Perdido."
          tooltip="Conta os procedimentos que já saíram de Captação, Negociação e Perdido. Nesta aba, essa é a base operacional principal."
          icon={Stethoscope}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.fechados_qtd}
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

      <FinancialBridgePanel
        title="Resultado financeiro"
        tooltip="Consolida o bruto, os custos diretos e o valor líquido dos procedimentos realizados. A margem mostra quanto do bruto permaneceu como resultado."
        comparison={d.comparisons?.charts.resultado_financeiro}
        isLoading={d.isLoading}
        bruto={fmtBRL(d.faturamento)}
        custos={fmtBRL(d.custo_total)}
        liquido={fmtBRL(d.valor_liquido_total)}
        margemRatio={margemRatio}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Funil por etapa"
            tooltip="Mostra quantos cards de procedimentos estão em cada etapa do funil dentro do filtro atual. A ordem segue o CRM para facilitar a leitura operacional."
            comparison={d.comparisons?.charts.funil}
          />
          {d.isLoading ? (
            <div className="h-52 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.funil.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, d.funil.length * 38)}
            >
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
                  width={160}
                />
                <Tooltip content={<ChartTooltipNum />} cursor={{ fill: "#F0F3F6" }} />
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

        <div className="panel-shell p-4">
          <PanelTitle
            title="Custos por categoria"
            tooltip="Soma os custos lançados nos procedimentos realizados e separa por Hospital, Anestesia, Comissão, Impostos e Instrumentação."
            comparison={d.comparisons?.charts.custos_por_categoria}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.custos_por_categoria.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, d.custos_por_categoria.length * 44)}
            >
              <BarChart
                data={d.custos_por_categoria}
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
                <Bar dataKey="value" name="Custo total" fill="#B45309" radius={[0, 4, 4, 0]}>
                  {d.custos_por_categoria.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#B45309"
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
                          description:
                            "Cards realizados que compõem a barra escolhida em Custos por categoria.",
                          contextLabel: `Categoria: ${entry.name}`,
                          badgeLabel: "Custos por categoria",
                          accentColor: "#B45309",
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
            title="Faturamento e valor líquido por tipo"
            tooltip="Compara o valor bruto e o valor líquido dos procedimentos realizados em cada tipo. O valor líquido é calculado descontando os custos lançados do valor bruto."
            comparison={d.comparisons?.charts.por_tipo}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
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

        <div className="panel-shell p-4">
          <PanelTitle
            title="Faturamento por modalidade"
            tooltip="Soma o valor bruto dos procedimentos realizados em cada modalidade de pagamento. Quando a modalidade não está preenchida, o registro entra como Não definido."
            comparison={d.comparisons?.charts.por_modalidade}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.por_modalidade.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, d.por_modalidade.length * 40)}
            >
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
                <Tooltip content={<ChartTooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" name="Faturamento" fill="#0891B2" radius={[0, 4, 4, 0]}>
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
                            "Procedimentos realizados que compõem a barra escolhida em Faturamento por modalidade.",
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
            title="Procedimentos por origem"
            tooltip="Conta quantos procedimentos fechados estão ligados a cada origem de contato. A origem é classificada a partir das tags e da origem do contato, não do texto bruto do card."
            comparison={d.comparisons?.charts.por_origem}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
          ) : d.por_origem.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, d.por_origem.length * 40)}
            >
              <BarChart
                data={d.por_origem}
                layout="vertical"
                margin={{ left: 8, right: 28, top: 4, bottom: 0 }}
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
                  width={90}
                />
                <Tooltip content={<ChartTooltipNum />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]}>
                  {d.por_origem.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#7C3AED"
                      cursor="pointer"
                      onClick={() => {
                        const records = currentRecords.filter(
                          (record) =>
                            record.meta?.origem === entry.name &&
                            record.meta?.fechadaBase
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Procedimentos da origem selecionada",
                          description:
                            "Cards que compõem a barra escolhida em Procedimentos por origem.",
                          contextLabel: `Origem: ${entry.name}`,
                          badgeLabel: "Procedimentos por origem",
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
            title="Ticket médio por responsável"
            tooltip="Faturamento médio por paciente para cada responsável, considerando apenas procedimentos realizados."
            comparison={d.comparisons?.charts.ticket_por_responsavel}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento"
          tooltip={`Mostra como o valor bruto dos procedimentos realizados evolui ao longo do tempo. O agrupamento acompanha a ${getDateModeLabel(tipoData)} selecionada no filtro global e organiza os pontos por dia, semana ou mês conforme o período.`}
          comparison={d.comparisons?.charts.evolucao}
        />
        {d.isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
