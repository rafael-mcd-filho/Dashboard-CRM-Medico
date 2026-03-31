import { PanelTitle } from "@/components/dashboard/PanelTitle";
import type { MetricComparison } from "@/lib/comparison";
import { fmtNum, fmtPct } from "@/lib/fmt";

export type PresenceConversionItem = {
  name: string;
  total: number;
  realizadas: number;
  noShow: number;
  color: string;
};

type PresenceConversionPanelProps = {
  title: string;
  tooltip: string;
  items: PresenceConversionItem[];
  comparison?: MetricComparison;
  isLoading?: boolean;
};

function PresenceCard({ item }: { item: PresenceConversionItem }) {
  const taxaRealizacao = item.total > 0 ? item.realizadas / item.total : 0;

  return (
    <div className="rounded-[20px] border border-[#E2E6EB] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-3 shadow-[0_8px_24px_rgba(15,25,35,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-[13px] font-semibold text-[#0F1923]">{item.name}</p>
          </div>
          <p className="mt-1 text-[11px] text-[#9BAAB8]">
            {fmtNum(item.realizadas)} de {fmtNum(item.total)} realizados
          </p>
        </div>

        <span className="rounded-full bg-[#FFF4E8] px-2 py-0.5 text-[10px] font-medium text-clinic-amber">
          No-show {fmtNum(item.noShow)}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <span
            className="font-mono text-[1.8rem] font-bold leading-none tracking-[-0.06em]"
            style={{ color: item.color }}
          >
            {fmtPct(taxaRealizacao)}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#9BAAB8]">
            Taxa de realização
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EDF3]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.max(0, Math.min(100, taxaRealizacao * 100))}%`,
              backgroundColor: item.color,
            }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#E6EBF1] pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAB8]">
            Agendadas
          </p>
          <p className="mt-1 font-mono text-[13px] font-semibold text-[#0F1923]">
            {fmtNum(item.total)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAB8]">
            Realizadas
          </p>
          <p className="mt-1 font-mono text-[13px] font-semibold text-[#0E9F6E]">
            {fmtNum(item.realizadas)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9BAAB8]">
            No-show
          </p>
          <p className="mt-1 font-mono text-[13px] font-semibold text-clinic-amber">
            {fmtNum(item.noShow)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PresenceConversionPanel({
  title,
  tooltip,
  items,
  comparison,
  isLoading,
}: PresenceConversionPanelProps) {
  return (
    <div className="panel-shell p-4">
      <PanelTitle
        title={title}
        tooltip={tooltip}
        comparison={comparison}
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[188px] animate-pulse rounded-[20px] bg-[#F0F3F6]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <PresenceCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
