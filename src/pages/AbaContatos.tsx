import { useMemo, useState } from "react";
import { CheckCircle2, Users, XCircle } from "lucide-react";
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

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-[#9BAAB8]">
      {label}
    </div>
  );
}

function MultiFunnelPanel({
  isLoading,
  contatosMultiFunil,
  taxaRetencao,
  comparison,
}: {
  isLoading: boolean;
  contatosMultiFunil: number;
  taxaRetencao: number;
  comparison?: Parameters<typeof PanelTitle>[0]["comparison"];
}) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle
        title="Participação multi-funil"
        tooltip="Mostra quantos contatos apareceram em pelo menos dois funis no mesmo período e qual fatia isso representa dentro da base nova de leads."
        comparison={comparison}
        extra={
          <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-medium text-clinic-blue">
            Multi-funil: {fmtNum(contatosMultiFunil)}
          </span>
        }
      />

      {isLoading ? (
        <div className="h-36 animate-pulse rounded-[20px] bg-[#F0F3F6]" />
      ) : (
        <div className="rounded-[20px] border border-[#D8EEF5] bg-[linear-gradient(135deg,#FFFFFF_0%,#F2FBFF_100%)] p-4 shadow-[0_10px_28px_rgba(15,25,35,0.05)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BAAB8]">
                Retenção multi-funil
              </p>
              <div className="mt-2.5 font-mono text-[2.15rem] font-bold leading-none tracking-[-0.07em] text-clinic-teal">
                {fmtPct(taxaRetencao)}
              </div>
            </div>

            <p className="max-w-[38ch] text-[13px] leading-5 text-[#5C6B7A]">
              Mede quanto da base nova de leads do período reaparece em dois ou
              mais funis, indicando profundidade de relacionamento.
            </p>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#DDEFF5]">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, taxaRetencao * 100))}%`,
                backgroundColor: "#0891B2",
              }}
            />
          </div>
        </div>
      )}
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
    leads_por_origem,
    leads_por_tag,
    evolucao_leads,
    multiFilnTable,
    comparisons,
    registros,
  } = useContatosData();

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

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <HeroMetricCard
          label="Leads novos"
          value={fmtNum(leads_novos)}
          description="Total de contatos criados no período selecionado."
          tooltip="Conta os novos contatos criados no período selecionado. Esse indicador sempre usa a Data de Criação do Contato."
          icon={Users}
          tone="blue"
          isLoading={isLoading}
          comparison={comparisons?.kpis.leads_novos}
        />

        <MultiFunnelPanel
          isLoading={isLoading}
          contatosMultiFunil={contatos_multi_funil}
          taxaRetencao={taxa_retencao}
          comparison={comparisons?.kpis.taxa_retencao}
        />
      </div>

      <div className="panel-shell p-4">
        <PanelTitle
          title="Evolução de leads"
          comparison={comparisons?.charts.evolucao_leads}
        />
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
            <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
            <div className="h-48 animate-pulse rounded-lg bg-[#F0F3F6]" />
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
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[#9BAAB8]">
                    Paciente
                  </th>
                  {[
                    "Consultas",
                    "Broncoscopia",
                    "Espirometria",
                    "Proc. Cirúrgicos",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-[#9BAAB8]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {multiFilnTable.map((row, index) => (
                  <tr
                    key={row.contato_id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}
                  >
                    <td className="px-5 py-2.5 font-medium text-[#0F1923]">
                      {row.nome}
                    </td>
                    {(
                      [
                        row.consultas,
                        row.broncoscopia,
                        row.espirometria,
                        row.procedimentos,
                      ] as boolean[]
                    ).map((has, idx) => (
                      <td key={idx} className="px-4 py-2.5 text-center">
                        {has ? (
                          <CheckCircle2 className="inline h-4 w-4 text-clinic-green" />
                        ) : (
                          <XCircle className="inline h-4 w-4 text-[#DDE3EA]" />
                        )}
                      </td>
                    ))}
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
