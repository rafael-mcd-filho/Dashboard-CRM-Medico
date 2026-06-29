import { useState, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Clock3,
  FileJson,
  LayoutDashboard,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CrossFunnelPanel } from "@/components/dashboard/CrossFunnelPanel";
import { EmptyChart } from "@/components/dashboard/EmptyChart";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { LossDiagnosticsPanel } from "@/components/dashboard/LossDiagnosticsPanel";
import { LossReasonsPanel } from "@/components/dashboard/LossReasonsPanel";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PresenceConversionPanel } from "@/components/dashboard/PresenceConversionPanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useFilters } from "@/contexts/FiltersContext";
import { useVisaoGeralData } from "@/hooks/useVisaoGeralData";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";
import { cn } from "@/lib/utils";

/* ── Divisor de seção com label premium ── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <p className="section-label shrink-0 before:hidden">{title}</p>
      <div className="flex-1 border-t border-slate-200" aria-hidden="true" />
    </div>
  );
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("copy_failed");
  }
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back to the legacy copy path below.
    }
  }

  fallbackCopyText(text);
}

const FUNIL_LINE_COLORS = {
  consultas: "#1A56DB",
  espirometria: "#0891B2",
  broncoscopia: "#059669",
  cirurgia: "#7C3AED",
};

function TooltipBRL({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-medium text-[#0F1923]">{label}</p>
      {payload.map((item, index) => (
        <p key={index} style={{ color: item.color ?? "#5C6B7A" }}>
          {item.name}: {fmtBRL(item.value)}
        </p>
      ))}
    </div>
  );
}

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { total: number; realizadas: number; noShow: number };
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-medium text-[#0F1923]">{label}</p>
      <p className="text-[#5C6B7A]">Agendadas: {fmtNum(row.total)}</p>
      <p className="text-[#0E9F6E]">Realizadas: {fmtNum(row.realizadas)}</p>
      <p className="text-clinic-amber">No-show: {fmtNum(row.noShow)}</p>
    </div>
  );
}


/* Keys for "Evolução por funil" interactive legend */
const FUNIL_KEYS = ["consultas", "espirometria", "broncoscopia", "cirurgia"] as const;
type FunilKey = typeof FUNIL_KEYS[number];

const FUNIL_DOT_SHAPES: Record<FunilKey, "circle" | "square" | "triangle" | "diamond"> = {
  consultas: "circle",
  espirometria: "square",
  broncoscopia: "triangle",
  cirurgia: "diamond",
};

const FUNIL_LABELS: Record<FunilKey, string> = {
  consultas: "Consultas",
  espirometria: "Espirometria",
  broncoscopia: "Broncoscopia",
  cirurgia: "Cirurgia",
};

export default function AbaGeral() {
  const d = useVisaoGeralData();
  const {
    filters: { tipoData, dataInicio, dataFim },
  } = useFilters();
  const [sheetState, setSheetState] = useState<{
    title: string;
    description: string;
    contextLabel?: string;
    badgeLabel?: string;
    accentColor: string;
    records: FunnelStageDrilldownRecord[];
  } | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleCopyMetricsJson = useCallback(async () => {
    const payload = {
      ...d.exportacao_metricas,
      gerado_em: new Date().toISOString(),
    };

    try {
      await copyTextToClipboard(JSON.stringify(payload, null, 2));
      setJsonCopied(true);
      toast.success("JSON copiado");
      window.setTimeout(() => setJsonCopied(false), 2200);
    } catch {
      toast.error("Nao foi possivel copiar o JSON");
    }
  }, [d.exportacao_metricas]);

  /* Interactive legend for "Evolução por funil" */
  const [hiddenFunis, setHiddenFunis] = useState<Set<FunilKey>>(new Set());
  const toggleFunil = useCallback((key: FunilKey) => {
    setHiddenFunis((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-clinic-blue" />
          <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
            Visão Geral
          </h1>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-[#5C6B7A]">
          Leitura executiva dos principais resultados, mantendo a mesma lógica
          operacional usada nas abas específicas.
        </p>
      </div>

      {/* ══ VISÃO EXECUTIVA ══ */}
      <SectionHeader title="Visão Executiva" />

      <div className="animate-stagger grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Leads novos"
          value={fmtNum(d.leads_novos)}
          description="Novos contatos que entraram na base dentro do período atual."
          tooltip="Conta os novos contatos criados no período selecionado. Na visão geral, esse indicador sempre usa a Data de Criação do Contato."
          icon={Users}
          tone="blue"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.leads_novos}
        />
        <HeroMetricCard
          label="Faturamento total"
          value={fmtBRL(d.fat_total)}
          description="Soma do faturamento bruto das bases realizadas de todos os funis."
          tooltip={`Soma o valor bruto apenas dos cards considerados realizados em cada funil. A janela segue a ${getDateModeLabel(tipoData)} selecionada.`}
          icon={Wallet}
          tone="teal"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.fat_total}
          trend={d.evolucao_total?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Taxa de realização"
          value={fmtPct(d.taxa_realizacao_global)}
          description="Participação do que já foi realizado sobre toda a base agendada."
          tooltip="Compara o total realizado com a base agendada de todos os funis combinados. Cada funil usa a mesma regra definida na sua aba específica."
          icon={Target}
          tone="purple"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.taxa_realizacao_global}
        />
        <HeroMetricCard
          label="Prazo médio geral"
          value={
            d.prazo_medio_geral > 0
              ? `${fmtDecimal(d.prazo_medio_geral, 0)} dias`
              : "—"
          }
          description="Tempo médio para receber, ponderado pelo volume pago de cada funil."
          tooltip="Mostra o prazo médio para receber considerando todos os funis com pagamento. Os funis com mais pagamentos pesam mais no resultado."
          icon={Clock3}
          tone="amber"
          isLoading={d.isLoading}
          comparison={d.comparisons?.kpis.prazo_medio_geral}
          inverseSentiment
        />
      </div>

      {/* ══ PERFORMANCE ══ */}
      <SectionHeader title="Performance" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
        <PresenceConversionPanel
          title="Presença operacional por funil"
          tooltip="Resume a base agendada, o volume realizado e o no-show de cada funil. A taxa mostra quanto da base agendada já avançou para realizado."
          items={d.volume_por_funil}
          comparison={d.comparisons?.charts.presenca_por_funil}
          isLoading={d.isLoading}
        />

        <CrossFunnelPanel
          title="Contatos de consultas em outros funis"
          tooltip="Mostra quantos contatos da base atual de consultas também aparecem em espirometria, broncoscopia ou cirurgia dentro do mesmo filtro. Clique em um item para ver os registros."
          items={d.cross_funnel}
          baseValue={d.consulta_base_contatos}
          baseLabel="Base de consultas"
          comparison={d.comparisons?.charts.cross_funnel}
          isLoading={d.isLoading}
          onItemClick={(name) => {
            const records = (d.registros_funis ?? []).filter(
              (r) => r.meta?.funil === name && r.meta?.base === "agendadas"
            );
            if (!records.length) return;
            setSheetState({
              title: `Contatos do funil ${name}`,
              description: "Registros do funil selecionado que também possuem consultas no período.",
              contextLabel: `Funil: ${name}`,
              badgeLabel: "Cross-funnel",
              accentColor: d.cross_funnel.find((i) => i.name === name)?.color ?? "#1A56DB",
              records,
            });
          }}
        />
      </div>

      {/* ══ DIAGNÓSTICO DE PERDA ══ */}
      <SectionHeader title="Diagnóstico de Perda" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <LossReasonsPanel
          title="Motivos de perda consolidados"
          tooltip="Consolida apenas os cards na etapa Perdido dos quatro funis. Cada card usa o mapa de tags do seu próprio funil; quando nenhum ID é reconhecido, entra como Sem motivo mapeado. Clique em uma barra para ver os registros perdidos."
          items={d.motivos_perda}
          comparison={d.comparisons?.charts.motivos_perda}
          isLoading={d.isLoading}
          onBarClick={(_name) => {
            const records = (d.registros_funis ?? []).filter(
              (r) => r.etapa.toLowerCase().includes("perdido")
            );
            if (!records.length) return;
            setSheetState({
              title: "Registros perdidos consolidados",
              description: "Todos os cards na etapa Perdido dos quatro funis no período atual.",
              contextLabel: "Etapa: Perdido",
              badgeLabel: "Motivos de perda",
              accentColor: "#6B7280",
              records,
            });
          }}
        />
        <LossDiagnosticsPanel
          title="Diagnóstico de perdas consolidado"
          tooltip="Consolida os cards na etapa Perdido dos quatro funis, mantendo a origem agrupada e a classificação de motivo de cada funil."
          diagnostics={d.perdas_diagnostico}
          originItems={d.perdas_por_origem}
          isLoading={d.isLoading}
          unmappedComparison={d.comparisons?.kpis.perdas_sem_motivo_pct}
          semRetornoComparison={d.comparisons?.kpis.perdas_sem_retorno_pct}
          originsComparison={d.comparisons?.charts.perdas_por_origem}
        />
      </div>

      {/* ══ FINANCEIRO ══ */}
      <SectionHeader title="Financeiro" />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Faturamento por funil"
            tooltip="Compara o faturamento bruto de cada funil usando sempre a base de cards considerados realizados em cada aba."
            comparison={d.comparisons?.charts.fat_por_funil}
          />
          {d.isLoading ? (
            <div className="skeleton h-44 w-full" />
          ) : d.fat_por_funil.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, d.fat_por_funil.length * 58)}
              aria-label="Gráfico de faturamento por funil"
            >
              <BarChart
                data={d.fat_por_funil}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 0 }}
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
                  width={100}
                />
                <Tooltip content={<TooltipBRL />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" name="Faturamento" radius={[0, 4, 4, 0]}>
                  {d.fat_por_funil.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      cursor="pointer"
                      onClick={() => {
                        const records = (d.registros_funis ?? []).filter(
                          (record) =>
                            record.meta?.funil === entry.name &&
                            record.meta?.base === "realizadas"
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Faturamento do funil selecionado",
                          description:
                            "Registros realizados que compõem a barra escolhida em Faturamento por funil.",
                          contextLabel: `Funil: ${entry.name}`,
                          badgeLabel: "Faturamento por funil",
                          accentColor: entry.color,
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
            title="Volume de produção por funil"
            tooltip="Compara a base agendada com a parte já realizada em cada funil. O tooltip também mostra o no-show consolidado dessa mesma base."
            comparison={d.comparisons?.charts.volume_por_funil}
          />
          {d.isLoading ? (
            <div className="skeleton h-44 w-full" />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={260}
              aria-label="Gráfico de volume de produção por funil"
            >
              <BarChart
                data={d.volume_por_funil}
                margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#5C6B7A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9BAAB8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<VolumeTooltip />} cursor={{ fill: "#F0F3F6" }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "#5C6B7A" }}
                />
                <Bar
                  dataKey="total"
                  name="Agendadas"
                  fill="#DDE3EA"
                  radius={[4, 4, 0, 0]}
                >
                  {d.volume_por_funil.map((entry) => (
                    <Cell
                      key={`total-${entry.name}`}
                      fill="#DDE3EA"
                      cursor="pointer"
                      onClick={() => {
                        const records = (d.registros_funis ?? []).filter(
                          (record) =>
                            record.meta?.funil === entry.name &&
                            record.meta?.base === "agendadas"
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Base agendada do funil selecionado",
                          description:
                            "Registros que compõem a barra escolhida na série Agendadas de Volume de produção por funil.",
                          contextLabel: `Funil: ${entry.name}`,
                          badgeLabel: "Volume por funil",
                          accentColor: "#94A3B8",
                          records,
                        });
                      }}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="realizadas"
                  name="Realizadas"
                  fill="#0E9F6E"
                  radius={[4, 4, 0, 0]}
                >
                  {d.volume_por_funil.map((entry) => (
                    <Cell
                      key={`realizadas-${entry.name}`}
                      fill="#0E9F6E"
                      cursor="pointer"
                      onClick={() => {
                        const records = (d.registros_funis ?? []).filter(
                          (record) =>
                            record.meta?.funil === entry.name &&
                            record.meta?.base === "realizadas"
                        );
                        if (!records.length) return;
                        setSheetState({
                          title: "Base realizada do funil selecionado",
                          description:
                            "Registros que compõem a barra escolhida na série Realizadas de Volume de produção por funil.",
                          contextLabel: `Funil: ${entry.name}`,
                          badgeLabel: "Volume por funil",
                          accentColor: "#0E9F6E",
                          records,
                        });
                      }}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="noShow"
                  name="No-show"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento total"
          tooltip={`Mostra a soma do faturamento bruto dos funis usando apenas as bases realizadas. Os pontos seguem a ${getDateModeLabel(tipoData)} selecionada no filtro global.`}
          comparison={d.comparisons?.charts.evolucao_total}
        />
        {d.isLoading ? (
          <div className="skeleton h-48 w-full" />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={220}
            aria-label="Gráfico de evolução do faturamento total"
          >
            <LineChart
              data={d.evolucao_total}
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
              onClick={(state) => {
                const label = state?.activeLabel;
                if (!label) return;
                const records = (d.registros_funis ?? []).filter(
                  (record) =>
                    record.meta?.base === "realizadas" &&
                    getEvolucaoBucketLabel(record.dataReferencia, dataInicio, dataFim) ===
                      label
                );
                if (!records.length) return;
                setSheetState({
                  title: "Registros realizados no período selecionado",
                  description:
                    "Registros que compõem o ponto escolhido na evolução do faturamento total.",
                  contextLabel: `Período: ${label}`,
                  badgeLabel: "Evolução do faturamento total",
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
                name="Faturamento total"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#1A56DB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução do faturamento por funil"
          tooltip={`Mostra a evolução do faturamento bruto de cada funil usando a mesma base de realizados aplicada nas abas específicas. Os pontos seguem a ${getDateModeLabel(tipoData)} selecionada no filtro global.`}
          comparison={d.comparisons?.charts.evolucao_por_funil}
        />

        {/* Interactive legend — click to isolate/hide a line */}
        {!d.isLoading && (
          <div className="mb-3 flex flex-wrap gap-3">
            {FUNIL_KEYS.map((key) => {
              const hidden = hiddenFunis.has(key);
              const color = FUNIL_LINE_COLORS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFunil(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                    hidden
                      ? "border-slate-200 bg-white text-[#9BAAB8] opacity-50"
                      : "border-transparent bg-[#F0F3F6] text-[#0F1923]"
                  )}
                  title={hidden ? `Mostrar ${FUNIL_LABELS[key]}` : `Ocultar ${FUNIL_LABELS[key]}`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: hidden ? "#CBD5E1" : color }}
                  />
                  {FUNIL_LABELS[key]}
                </button>
              );
            })}
          </div>
        )}

        {d.isLoading ? (
          <div className="skeleton h-48 w-full" />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={260}
            aria-label="Gráfico de evolução do faturamento por funil"
          >
            <LineChart
              data={d.evolucao_por_funil}
              margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
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
              <Tooltip content={<TooltipBRL />} />
              <Line
                type="monotone"
                dataKey="consultas"
                name="Consultas"
                stroke={FUNIL_LINE_COLORS.consultas}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenFunis.has("consultas")}
                legendType={FUNIL_DOT_SHAPES.consultas}
              />
              <Line
                type="monotone"
                dataKey="espirometria"
                name="Espirometria"
                stroke={FUNIL_LINE_COLORS.espirometria}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenFunis.has("espirometria")}
                legendType={FUNIL_DOT_SHAPES.espirometria}
              />
              <Line
                type="monotone"
                dataKey="broncoscopia"
                name="Broncoscopia"
                stroke={FUNIL_LINE_COLORS.broncoscopia}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenFunis.has("broncoscopia")}
                legendType={FUNIL_DOT_SHAPES.broncoscopia}
              />
              <Line
                type="monotone"
                dataKey="cirurgia"
                name="Cirurgia"
                stroke={FUNIL_LINE_COLORS.cirurgia}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                hide={hiddenFunis.has("cirurgia")}
                legendType={FUNIL_DOT_SHAPES.cirurgia}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ══ INDICADORES AVANÇADOS ══ */}
      <SectionHeader title="Indicadores Avançados" />

      {(() => {
        /* Custo de oportunidade do no-show */
        const totalNoShow =
          d.consultas_no_show +
          d.consultas_no_show_retorno +
          d.espiro_no_show +
          d.bronco_no_show +
          d.bronco_no_show_retorno +
          d.cirurgia_no_show +
          d.cirurgia_no_show_retorno;

        const ticketMedioGlobal =
          d.total_realizadas > 0 ? d.fat_total / d.total_realizadas : 0;

        const custoOportunidadeNoShow = totalNoShow * ticketMedioGlobal;

        /* Conversão captação → realizado */
        const convCaptacaoRealizado =
          d.leads_novos > 0 ? d.total_realizadas / d.leads_novos : 0;

        /* Taxa de no-show consolidada */
        const taxaNoShowTotal =
          d.total_agendadas > 0 ? totalNoShow / d.total_agendadas : 0;

        return (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {/* Custo de oportunidade do no-show */}
            <div className="panel-shell p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#FFF7ED] text-clinic-amber">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="section-label text-clinic-amber">Custo de oportunidade — No-show</p>
                </div>
              </div>
              {d.isLoading ? (
                <div className="mt-3 skeleton h-8 w-28" />
              ) : (
                <div className="mt-3">
                  <p className="kpi-value-lg text-slate-900">{fmtBRL(custoOportunidadeNoShow)}</p>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    {fmtNum(totalNoShow)} no-show × {fmtBRL(ticketMedioGlobal)} ticket médio
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Receita potencial não capturada pelo não-comparecimento consolidado de todos os funis.
                  </p>
                </div>
              )}
            </div>

            {/* Conversão captação → realizado */}
            <div className="panel-shell p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#EEF4FF] text-clinic-blue">
                    <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="section-label text-clinic-blue">Conversão captação → realizado</p>
                </div>
              </div>
              {d.isLoading ? (
                <div className="mt-3 skeleton h-8 w-28" />
              ) : (
                <div className="mt-3">
                  <p className="kpi-value-lg text-slate-900">{fmtPct(convCaptacaoRealizado)}</p>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    {fmtNum(d.total_realizadas)} realizados ÷ {fmtNum(d.leads_novos)} leads
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-clinic-blue transition-[width] duration-500"
                      style={{ width: `${Math.min(100, convCaptacaoRealizado * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Taxa de aproveitamento da base de novos leads para resultados efetivos.
                  </p>
                </div>
              )}
            </div>

            {/* No-show consolidado */}
            <div className="panel-shell p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#FEF2F2] text-red-500">
                    <Target className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="section-label text-red-500">Taxa de no-show consolidada</p>
                </div>
              </div>
              {d.isLoading ? (
                <div className="mt-3 skeleton h-8 w-28" />
              ) : (
                <div className="mt-3">
                  <p className="kpi-value-lg text-slate-900">{fmtPct(taxaNoShowTotal)}</p>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    {fmtNum(totalNoShow)} não compareceram de {fmtNum(d.total_agendadas)} agendados
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-red-400 transition-[width] duration-500"
                      style={{ width: `${Math.min(100, taxaNoShowTotal * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    No-show consolidado de consultas, espirometria, broncoscopia e cirurgia.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ══ TIME ══ */}
      {!d.isLoading && d.ranking_responsaveis.length > 0 && (
        <SectionHeader title="Time" />
      )}

      {!d.isLoading && d.ranking_responsaveis.length > 0 && (
        <div className="panel-shell overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <PanelTitle
              title="Ranking de responsáveis"
              tooltip="Classificação dos responsáveis pelo faturamento total e volume de realizados em todos os funis."
              comparison={d.comparisons?.charts.ranking_responsaveis}
            />
          </div>
          <div className="overflow-x-auto">
            {(() => {
              const maxFat = Math.max(...d.ranking_responsaveis.map((r) => r.faturamento), 1);
              const maxReal = Math.max(...d.ranking_responsaveis.map((r) => r.realizados), 1);
              return (
                <table className="w-full text-sm">
                  <caption className="sr-only">Ranking de responsáveis por faturamento</caption>
                  <thead>
                    <tr className="border-b border-border bg-[#F7F9FB]">
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                        Responsável
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                        Realizados
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[#9BAAB8]" style={{ minWidth: 160 }}>
                        Faturamento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.ranking_responsaveis.map((row, index) => {
                      const fatPct   = maxFat  > 0 ? (row.faturamento / maxFat) * 100 : 0;
                      const realPct  = maxReal > 0 ? (row.realizados  / maxReal) * 100 : 0;
                      return (
                        <tr
                          key={row.name}
                          className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}
                        >
                          {/* Responsável com avatar de iniciais */}
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[10px] font-semibold text-clinic-blue">
                                {row.name.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="font-medium text-[#0F1923]">{row.name}</span>
                            </div>
                          </td>
                          {/* Realizados com mini barra */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-clinic-green transition-[width] duration-300"
                                  style={{ width: `${realPct}%` }}
                                />
                              </div>
                              <span className="w-8 text-right font-mono text-xs text-[#5C6B7A]">
                                {fmtNum(row.realizados)}
                              </span>
                            </div>
                          </td>
                          {/* Faturamento com barra inline */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" style={{ minWidth: 60, maxWidth: 100 }}>
                                <div
                                  className="h-full rounded-full bg-clinic-blue transition-[width] duration-300"
                                  style={{ width: `${fatPct}%` }}
                                />
                              </div>
                              <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold text-[#0F1923]">
                                {fmtBRL(row.faturamento)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyMetricsJson}
          disabled={d.isLoading}
        >
          {jsonCopied ? (
            <Check data-icon="inline-start" aria-hidden="true" />
          ) : (
            <FileJson data-icon="inline-start" aria-hidden="true" />
          )}
          {jsonCopied ? "JSON copiado" : "Gerar JSON"}
        </Button>
      </div>

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
