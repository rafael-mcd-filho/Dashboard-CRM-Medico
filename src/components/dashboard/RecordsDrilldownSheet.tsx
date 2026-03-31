import { useMemo, useState } from "react";
import { CalendarDays, Search, UserRound, XCircle } from "lucide-react";
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

type RecordsDrilldownSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badgeLabel?: string;
  contextLabel?: string;
  title: string;
  description: string;
  accentColor: string;
  records: FunnelStageDrilldownRecord[];
};

export function RecordsDrilldownSheet({
  open,
  onOpenChange,
  badgeLabel,
  contextLabel,
  title,
  description,
  accentColor,
  records,
}: RecordsDrilldownSheetProps) {
  const [query, setQuery] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;

    return records.filter((record) => {
      const haystack = [
        record.nome,
        record.responsavel,
        record.dataAgendamento,
        record.etapa,
        ...record.detalhes,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, records]);

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <SheetContent
        side="right"
        className="w-full border-l border-white/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,1)_18%,rgba(248,250,252,0.98)_100%)] p-0 sm:max-w-2xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-[#E2E6EB] px-6 py-5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {badgeLabel ? (
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {badgeLabel}
                </span>
              ) : null}
              {contextLabel ? (
                <span className="rounded-full border border-[#D9E2EC] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">
                  {contextLabel}
                </span>
              ) : null}
              <span className="rounded-full border border-[#D9E2EC] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">
                {fmtNum(filteredRecords.length)} registro{filteredRecords.length === 1 ? "" : "s"}
              </span>
            </div>
            <SheetTitle className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-[#0F1923]">
              {title}
            </SheetTitle>
            <SheetDescription className="max-w-[56ch] text-[13px] leading-5 text-[#5C6B7A]">
              {description}
            </SheetDescription>
          </SheetHeader>

          <div className="border-b border-[#E9EEF3] px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BAAB8]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por paciente, responsável ou detalhe"
                className="h-10 rounded-xl border-[#D9E2EC] bg-white pl-10 text-sm shadow-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {filteredRecords.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#D9E2EC] bg-white/70 px-6 text-center">
                <XCircle className="h-8 w-8 text-[#D0D9E2]" />
                <p className="mt-4 text-sm font-medium text-[#0F1923]">
                  Nenhum registro encontrado
                </p>
                <p className="mt-1 max-w-[34ch] text-sm text-[#7A8896]">
                  Ajuste a busca ou clique em outra série do gráfico para ver os registros que compõem o valor.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-[20px] border border-[#E2E6EB] bg-white p-4 shadow-[0_10px_24px_rgba(15,25,35,0.05)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#0F1923]">
                          {record.nome}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#5C6B7A]">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F8FB] px-2.5 py-1">
                            <CalendarDays className="h-3.5 w-3.5 text-[#9BAAB8]" />
                            {record.dataAgendamento}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F8FB] px-2.5 py-1">
                            <UserRound className="h-3.5 w-3.5 text-[#9BAAB8]" />
                            {record.responsavel}
                          </span>
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${accentColor}14`,
                              color: accentColor,
                            }}
                          >
                            {record.etapa}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BAAB8]">
                          Valor
                        </p>
                        <div
                          className="mt-1 font-mono text-[1.35rem] font-bold leading-none tracking-[-0.05em]"
                          style={{ color: accentColor }}
                        >
                          {record.valor > 0 ? fmtBRL(record.valor) : "—"}
                        </div>
                      </div>
                    </div>

                    {record.detalhes.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#EEF2F6] pt-3">
                        {record.detalhes.map((detail) => (
                          <span
                            key={`${record.id}-${detail}`}
                            className="rounded-full border border-[#E2E6EB] bg-[#FAFBFC] px-2.5 py-1 text-[11px] font-medium text-[#5C6B7A]"
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
