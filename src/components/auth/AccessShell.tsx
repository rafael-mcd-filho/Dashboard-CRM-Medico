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
    haloA: "bg-[rgba(26,86,219,0.16)]",
    haloB: "bg-[rgba(8,145,178,0.16)]",
    iconWrap: "border-[#D7E5FF] bg-[#EEF4FF] text-[#1A56DB]",
    topRule: "from-[#1A56DB] via-[#0891B2] to-transparent",
    chip: "border-[#D7E5FF] bg-[#F5F9FF] text-[#1A56DB]",
  },
  rose: {
    haloA: "bg-[rgba(185,28,28,0.14)]",
    haloB: "bg-[rgba(245,158,11,0.12)]",
    iconWrap: "border-[#F4D7D7] bg-[#FFF1F1] text-[#B42318]",
    topRule: "from-[#B42318] via-[#F59E0B] to-transparent",
    chip: "border-[#F4D7D7] bg-[#FFF7F5] text-[#B42318]",
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
    <div className="relative min-h-screen overflow-hidden bg-[#F3F7FB] text-[#0F1923]">
      <div className={cn("absolute left-[-8rem] top-[-6rem] h-[26rem] w-[26rem] rounded-full blur-3xl", styles.haloA)} />
      <div className={cn("absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full blur-3xl", styles.haloB)} />
      <div className="bg-dashboard-grid absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(243,247,251,0.18),rgba(243,247,251,0.92))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-8 md:px-10">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_430px]">
          <section className="panel-shell animate-slide-up relative overflow-hidden border-white/85 bg-white/72 p-8 shadow-[0_35px_120px_rgba(15,25,35,0.12)] backdrop-blur-xl md:p-10">
            <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", styles.topRule)} />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-[20px] border shadow-sm", styles.iconWrap)}>
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="section-label !pb-0 !pt-0 before:hidden">{eyebrow}</p>
                    <p className="text-sm text-[#5C6B7A]">Dashboard CRM Medico</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-3xl text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[3.4rem]">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-[15px] leading-8 text-[#5C6B7A] md:text-[16px]">
                    {description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,25,35,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BAAB8]">
                      {item.label}
                    </p>
                    <div className="mt-3 text-sm leading-7 text-[#0F1923]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="panel-shell animate-fade-in relative overflow-hidden border-white/85 bg-white/94 p-0 shadow-[0_35px_120px_rgba(15,25,35,0.16)]">
            {children}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AccessShell;
