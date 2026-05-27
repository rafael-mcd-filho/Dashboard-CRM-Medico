import { useMemo, useState } from "react";
import { CalendarDays, Download, Search, UserRound, XCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { fmtBRL, fmtNum } from "@/lib/fmt";
import type { FunnelStageDrilldownRecord } from "@/lib/funnelDrilldown";

type FunnelStageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelLabel: string;
  stageLabel: string;
  accentColor: string;
  dateModeLabel: string;
  records: FunnelStageDrilldownRecord[];
};

export function FunnelStageSheet({
  open,
  onOpenChange,
  funnelLabel,
  stageLabel,
  accentColor,
  dateModeLabel,
  records,
}: FunnelStageSheetProps) {
  const [query, setQuery] = useState("");

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.nome, r.responsavel, r.dataAgendamento, ...r.detalhes]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, records]);

  const countLabel = `${fmtNum(filteredRecords.length)} registro${filteredRecords.length === 1 ? "" : "s"}`;

  /* CSV export simples */
  const handleExport = () => {
    const rows = [
      ["Nome", "Data", "Responsável", "Etapa", "Valor", "Detalhes"],
      ...filteredRecords.map((r) => [
        r.nome,
        r.dataAgendamento,
        r.responsavel,
        r.etapa,
        r.valor > 0 ? fmtBRL(r.valor) : "—",
        r.detalhes.join("; "),
      ]),
    ];
    const csv  = rows.map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `${funnelLabel}_${stageLabel}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <SheetContent
        side="right"
        className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-2xl"
      >
        <div className="flex h-full flex-col">

          {/* ── Header ── */}
          <SheetHeader className="border-b border-slate-100 px-6 py-5 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Funil */}
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white"
                style={{ backgroundColor: accentColor }}
              >
                {funnelLabel}
              </span>
              {/* Etapa */}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {stageLabel}
              </span>
              {/* Contagem */}
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {countLabel}
              </span>
            </div>

            <SheetTitle className="mt-2.5 text-[1.125rem] font-semibold tracking-tight text-slate-900">
              Cards que compõem esta etapa
            </SheetTitle>
            <SheetDescription className="max-w-[56ch] text-[12px] leading-5 text-slate-400">
              Registros da etapa selecionada, respeitando os filtros ativos e a base de{" "}
              {dateModeLabel}.
            </SheetDescription>
          </SheetHeader>

          {/* ── Busca ── */}
          <div className="border-b border-slate-100 px-6 py-3">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por paciente, responsável ou detalhe…"
                className="h-9 rounded-[var(--radius-md)] border-slate-200 bg-white pl-9 text-[12px] shadow-none focus-visible:ring-clinic-blue"
              />
            </div>
          </div>

          {/* ── Lista de registros ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredRecords.length === 0 ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <XCircle className="h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-[13px] font-medium text-slate-700">
                  Nenhum registro encontrado
                </p>
                <p className="mt-1 max-w-[34ch] text-[12px] text-slate-400">
                  Ajuste a busca ou selecione outra etapa.
                </p>
              </div>
            ) : (
              /* Stagger de entrada nos cards */
              <div className="animate-stagger space-y-2">
                {filteredRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-[var(--radius-md)] border border-slate-100 bg-white p-4 transition-shadow hover:shadow-[0_4px_12px_rgba(15,25,35,0.07)]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold tracking-tight text-slate-900">
                          {record.nome}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                            <CalendarDays className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            {record.dataAgendamento}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-100">
                            <UserRound className="h-3 w-3 text-slate-400" aria-hidden="true" />
                            {record.responsavel}
                          </span>
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${accentColor}18`,
                              color: accentColor,
                            }}
                          >
                            {record.etapa}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="section-label before:hidden">Valor</p>
                        <div
                          className="mt-1 font-mono text-[1.125rem] font-bold leading-none tracking-[-0.02em] font-variant-numeric tabular-nums"
                          style={{ color: accentColor }}
                        >
                          {record.valor > 0 ? fmtBRL(record.valor) : "—"}
                        </div>
                      </div>
                    </div>

                    {record.detalhes.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                        {record.detalhes.map((detail) => (
                          <span
                            key={`${record.id}-${detail}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer com ações ── */}
          {filteredRecords.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Exportar CSV
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
