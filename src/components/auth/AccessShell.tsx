import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccessHighlight = {
  label: string;
  value: ReactNode;
};

type AccessShellProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  highlights: AccessHighlight[];
  children: ReactNode;
  tone?: "blue" | "rose";
};

const toneStyles = {
  blue: {
    iconWrap:  "border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB]",
    topRule:   "from-[#2563EB] via-[#0891B2] to-transparent",
    chip:      "border-[#DBEAFE] bg-[#F8FAFF] text-[#2563EB]",
    eyebrow:   "text-clinic-blue",
  },
  rose: {
    iconWrap:  "border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48]",
    topRule:   "from-[#E11D48] via-[#F59E0B] to-transparent",
    chip:      "border-[#FECDD3] bg-[#FFF8F9] text-[#E11D48]",
    eyebrow:   "text-rose-600",
  },
} as const;

const AccessShell = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  highlights,
  children,
  tone = "blue",
}: AccessShellProps) => {
  const styles = toneStyles[tone];

  return (
    /* Fundo limpo: noise sutil + grade fina. Sem halos radiais. */
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-dashboard-grid absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-8 md:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">

          {/* ── Coluna esquerda: hero ── */}
          <section
            className="panel-shell animate-slide-up relative overflow-hidden p-7 shadow-pop md:p-9"
          >
            {/* Linha superior colorida — fina (1px) */}
            <div
              className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", styles.topRule)}
              aria-hidden="true"
            />

            <div className="flex h-full flex-col justify-between gap-8">
              {/* Topo: ícone + eyebrow */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border shadow-sm",
                    styles.iconWrap
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className={cn("section-label before:hidden", styles.eyebrow)}>{eyebrow}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">Dashboard CRM Médico</p>
                </div>
              </div>

              {/* Título + descrição — tamanhos compactos */}
              <div className="space-y-3">
                <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-[2.25rem]">
                  {title}
                </h1>
                <p className="max-w-lg text-[14px] leading-7 text-slate-500">
                  {description}
                </p>
              </div>

              {/* Highlights — 3 cards pequenos */}
              <div className="grid gap-3 md:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-[var(--radius-md)] border p-4",
                      styles.chip
                    )}
                  >
                    <p className="section-label before:hidden">{item.label}</p>
                    <div className="mt-2 text-[12px] leading-6 text-slate-600">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Coluna direita: slot do formulário / status ── */}
          <aside className="panel-shell animate-fade-in overflow-hidden shadow-pop">
            {children}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AccessShell;
