import { useState } from "react";
import {
  Clock3,
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
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { PresenceConversionPanel } from "@/components/dashboard/PresenceConversionPanel";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { useFilters } from "@/contexts/FiltersContext";
import { useVisaoGeralData } from "@/hooks/useVisaoGeralData";
import { getDateModeLabel } from "@/lib/dateMode";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtBRL, fmtDecimal, fmtNum, fmtPct } from "@/lib/fmt";

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

function EmptyChart({ label = "Sem dados no período" }: { label?: string }) {
  return (
    <div className="flex h-44 items-center justify-center text-sm text-[#9BAAB8]">
      {label}
    </div>
  );
}

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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        />
      </div>

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
          tooltip="Mostra quantos contatos da base atual de consultas também aparecem em espirometria, broncoscopia ou cirurgia dentro do mesmo filtro."
          items={d.cross_funnel}
          baseValue={d.consulta_base_contatos}
          baseLabel="Base de consultas"
          comparison={d.comparisons?.charts.cross_funnel}
          isLoading={d.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Faturamento por funil"
            tooltip="Compara o faturamento bruto de cada funil usando sempre a base de cards considerados realizados em cada aba."
            comparison={d.comparisons?.charts.fat_por_funil}
          />
          {d.isLoading ? (
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
            <div className="h-44 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
          <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
        {d.isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: "#5C6B7A" }}
              />
              <Line
                type="monotone"
                dataKey="consultas"
                name="Consultas"
                stroke={FUNIL_LINE_COLORS.consultas}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="espirometria"
                name="Espirometria"
                stroke={FUNIL_LINE_COLORS.espirometria}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="broncoscopia"
                name="Broncoscopia"
                stroke={FUNIL_LINE_COLORS.broncoscopia}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cirurgia"
                name="Cirurgia"
                stroke={FUNIL_LINE_COLORS.cirurgia}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

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
            <table className="w-full text-sm">
              <caption className="sr-only">
                Ranking de responsáveis por faturamento
              </caption>
              <thead>
                <tr className="border-b border-border bg-[#F7F9FB]">
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                    Responsável
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                    Realizados
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                    Faturamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.ranking_responsaveis.map((row, index) => (
                  <tr
                    key={row.name}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}
                  >
                    <td className="px-5 py-2.5 font-medium text-[#0F1923]">
                      {row.name}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-[#5C6B7A]">
                      {fmtNum(row.realizados)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-[#0F1923]">
                      {fmtBRL(row.faturamento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
