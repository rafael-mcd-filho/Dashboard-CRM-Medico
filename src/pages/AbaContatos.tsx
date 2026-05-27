import { useMemo, useState } from "react";
import { ArrowUpDown, Clock3, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { EmptyChart } from "@/components/dashboard/EmptyChart";
import { HeroMetricCard } from "@/components/dashboard/HeroMetricCard";
import { PanelTitle } from "@/components/dashboard/PanelTitle";
import { RecordsDrilldownSheet } from "@/components/dashboard/RecordsDrilldownSheet";
import { useFilters } from "@/contexts/FiltersContext";
import { useContatosData } from "@/hooks/useContatosData";
import { getEvolucaoBucketLabel } from "@/lib/evolucao";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";
import { fmtNum, fmtPct } from "@/lib/fmt";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-medium text-[#0F1923]">{label}</p>
      <p className="text-[#5C6B7A]">{fmtNum(payload[0].value)} leads</p>
    </div>
  );
}



export default function AbaContatos() {
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
  const {
    isLoading,
    leads_novos,
    contatos_multi_funil,
    taxa_retencao,
    tempo_medio_segundo_funil,
    leads_por_origem,
    leads_por_tag,
    evolucao_leads,
    multiFilnTable,
    comparisons,
    registros,
  } = useContatosData();

  /* §6.3 — sortable multi-funil table */
  const [tableSort, setTableSort] = useState<"nome" | "primeira_entrada">("primeira_entrada");
  const sortedMultiFunilTable = useMemo(
    () =>
      [...multiFilnTable].sort((a, b) => {
        if (tableSort === "nome") return a.nome.localeCompare(b.nome);
        return (b.primeira_entrada ?? "").localeCompare(a.primeira_entrada ?? "");
      }),
    [multiFilnTable, tableSort]
  );

  const registrosOrdenados = useMemo(
    () => (registros ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome)),
    [registros]
  );

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-clinic-blue" />
          <h1 className="text-balance text-xl font-semibold text-[#0F1923]">
            Contatos
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#5C6B7A]">
          Aquisição de leads, origem e profundidade de relacionamento por
          paciente.
        </p>
        {tipoData === "agendamento" && (
          <p className="mt-2 inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-clinic-blue">
            Nesta aba, o período continua usando a Data de Criação do Contato.
          </p>
        )}
      </div>

      {/* §6.1 — 4 KPIs em vez de 1 + painel */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HeroMetricCard
          label="Leads novos"
          value={fmtNum(leads_novos)}
          description="Total de contatos criados no período selecionado."
          tooltip="Conta os novos contatos criados no período selecionado. Esse indicador sempre usa a Data de Criação do Contato."
          icon={Users}
          tone="blue"
          isLoading={isLoading}
          comparison={comparisons?.kpis.leads_novos}
          trend={evolucao_leads?.map((p) => p.value)}
        />
        <HeroMetricCard
          label="Contatos multi-funil"
          value={fmtNum(contatos_multi_funil)}
          description="Contatos que aparecem em pelo menos dois funis no período."
          tooltip="Conta quantos leads do período selecionado possuem cards em dois ou mais funis (Consultas, Espirometria, Broncoscopia ou Proc. Cirúrgicos)."
          icon={RefreshCw}
          tone="teal"
          isLoading={isLoading}
          comparison={comparisons?.kpis.contatos_multi_funil}
        />
        <HeroMetricCard
          label="Taxa de retenção"
          value={fmtPct(taxa_retencao)}
          description="Percentual de leads que reaparece em dois ou mais funis."
          tooltip="Mede quanto da base nova de leads do período reaparece em dois ou mais funis, indicando profundidade de relacionamento."
          icon={Users}
          tone="purple"
          isLoading={isLoading}
          comparison={comparisons?.kpis.taxa_retencao}
        />
        <HeroMetricCard
          label="Tempo médio até 2º funil"
          value={
            tempo_medio_segundo_funil > 0
              ? `${Math.round(tempo_medio_segundo_funil)} dias`
              : "—"
          }
          description="Média de dias entre o 1º e o 2º card em funis distintos."
          tooltip="Para cada contato multi-funil, calcula a diferença em dias entre a criação do card mais antigo e o segundo mais antigo em funis diferentes. Mostra a média desses valores."
          icon={Clock3}
          tone="amber"
          isLoading={isLoading}
          comparison={comparisons?.kpis.tempo_medio_segundo_funil}
          inverseSentiment
        />
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução de leads"
          comparison={comparisons?.charts.evolucao_leads}
        />
        {isLoading ? (
          <div className="skeleton h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={evolucao_leads}
              margin={{ left: 0, right: 16, top: 4, bottom: 0 }}
              onClick={(state) => {
                const label = state?.activeLabel;
                if (!label) return;

                const records = registrosOrdenados.filter(
                  (record) =>
                    getEvolucaoBucketLabel(
                      record.dataReferencia,
                      dataInicio,
                      dataFim
                    ) === label
                );

                if (!records.length) return;

                setSheetState({
                  title: "Leads do período selecionado",
                  description:
                    "Contatos que compõem o ponto selecionado na evolução de leads.",
                  contextLabel: `Período: ${label}`,
                  badgeLabel: "Evolução de leads",
                  accentColor: "#1A56DB",
                  records,
                });
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E2E6EB"
                vertical={false}
              />
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
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#1A56DB", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#1A56DB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="panel-shell p-4">
          <PanelTitle
            title="Leads por origem"
            comparison={comparisons?.charts.leads_por_origem}
          />
          {isLoading ? (
            <div className="skeleton h-48" />
          ) : leads_por_origem.length === 0 ? (
            <EmptyChart label="Sem dados no período" />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, leads_por_origem.length * 34)}
            >
              <BarChart
                data={leads_por_origem}
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
                  width={110}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" fill="#0891B2" radius={[0, 4, 4, 0]}>
                  {leads_por_origem.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#0891B2"
                      cursor="pointer"
                      onClick={() => {
                        const records = registrosOrdenados.filter(
                          (record) => record.meta?.origem === entry.name
                        );

                        if (!records.length) return;

                        setSheetState({
                          title: "Leads da origem selecionada",
                          description:
                            "Contatos que compõem a barra escolhida em Leads por origem.",
                          contextLabel: `Origem: ${entry.name}`,
                          badgeLabel: "Leads por origem",
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

        <div className="panel-shell p-4">
          <PanelTitle
            title="Leads por tag"
            comparison={comparisons?.charts.leads_por_tag}
          />
          {isLoading ? (
            <div className="skeleton h-48" />
          ) : leads_por_tag.length === 0 ? (
            <EmptyChart label="Sem tags no período" />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, leads_por_tag.length * 32)}
            >
              <BarChart
                data={leads_por_tag}
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
                  tick={{ fontSize: 11, fill: "#5C6B7A" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F0F3F6" }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[0, 4, 4, 0]}>
                  {leads_por_tag.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill="#7C3AED"
                      cursor="pointer"
                      onClick={() => {
                        const records = registrosOrdenados.filter((record) =>
                          String(record.meta?.tags ?? "")
                            .split(" | ")
                            .includes(entry.name)
                        );

                        if (!records.length) return;

                        setSheetState({
                          title: "Leads da tag selecionada",
                          description:
                            "Contatos que carregam a tag escolhida dentro do período atual.",
                          contextLabel: `Tag: ${entry.name}`,
                          badgeLabel: "Leads por tag",
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
      </div>

      {/* §6.3 — multi-funil table with avatars, "Primeira entrada", sortable */}
      {!isLoading && multiFilnTable.length > 0 && (
        <div className="panel-shell overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-[#0F1923]">
              Pacientes multi-funil{" "}
              <span className="ml-1 rounded-full bg-[#EEF3FF] px-2 py-0.5 text-xs font-medium text-clinic-blue">
                {fmtNum(contatos_multi_funil)}
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-[#9BAAB8]">
              Pacientes com cards em pelo menos dois funis dentro do período.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Pacientes multi-funil</caption>
              <thead>
                <tr className="border-b border-border bg-[#F7F9FB]">
                  <th className="px-5 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => setTableSort("nome")}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors",
                        tableSort === "nome" ? "text-clinic-blue" : "text-[#9BAAB8] hover:text-[#5C6B7A]"
                      )}
                    >
                      Paciente <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setTableSort("primeira_entrada")}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors",
                        tableSort === "primeira_entrada" ? "text-clinic-blue" : "text-[#9BAAB8] hover:text-[#5C6B7A]"
                      )}
                    >
                      Entrada <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  {(["Consultas", "Bronco.", "Espiro.", "Cirurgia"] as const).map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[#9BAAB8]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMultiFunilTable.map((row, index) => {
                  const initials = row.nome
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w: string) => w[0].toUpperCase())
                    .join("");
                  const funnelCols: {key: string; color: string; bg: string; active: boolean}[] = [
                    { key: "consultas",    color: "#1A56DB", bg: "#EEF4FF", active: row.consultas },
                    { key: "broncoscopia", color: "#059669", bg: "#ECFDF5", active: row.broncoscopia },
                    { key: "espirometria", color: "#0891B2", bg: "#E0F9FF", active: row.espirometria },
                    { key: "procedimentos", color: "#7C3AED", bg: "#F3EEFF", active: row.procedimentos },
                  ];
                  return (
                    <tr
                      key={row.contato_id}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[10px] font-semibold text-clinic-blue">
                            {initials || "?"}
                          </span>
                          <span className="font-medium text-[#0F1923]">{row.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#5C6B7A]">
                        {row.primeira_entrada
                          ? row.primeira_entrada.slice(0, 10).split("-").reverse().join("/")
                          : "—"}
                      </td>
                      {funnelCols.map((col) => (
                        <td key={col.key} className="px-3 py-2.5 text-center">
                          {col.active ? (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: col.color }}
                              title="Possui card neste funil"
                            />
                          ) : (
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
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
