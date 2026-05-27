import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Microscope,
  Stethoscope,
  Users,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteAccess } from "@/lib/routeAccess";

/* ── Grupos de navegação ── */
const NAV_GROUPS = [
  {
    label: "Visão",
    items: [
      { label: "Visão Geral", path: "/visao-geral", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operação",
    items: [
      { label: "Contatos", path: "/contatos", icon: Users },
    ],
  },
  {
    label: "Funis",
    items: [
      { label: "Consultas",        path: "/consultas",                icon: CalendarDays },
      { label: "Broncoscopia",     path: "/broncoscopia",             icon: Microscope   },
      { label: "Espirometria",     path: "/espirometria",             icon: Wind         },
      { label: "Proc. Cirúrgicos", path: "/procedimentos-cirurgicos", icon: Stethoscope  },
    ],
  },
] as const;

export function Sidebar() {
  const { search }             = useLocation();
  const navigate               = useNavigate();
  const { userEmail, signOut } = useRouteAccess();

  const initials     = userEmail ? userEmail.slice(0, 2).toUpperCase() : "DV";
  const displayEmail = userEmail ?? "dashboard@v4.com.br";

  return (
    <aside
      aria-label="Navegação principal"
      className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card"
    >
      {/* ── Cabeçalho ── */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <LogoIcon />
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold text-foreground">Dashboard BI</span>
          <span className="text-[11px] text-muted-foreground">Derick Vinhas</span>
        </div>
      </div>

      {/* ── Navegação por grupos ── */}
      <nav
        aria-label="Painel de controle"
        className="flex flex-1 flex-col overflow-y-auto p-2"
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && "mt-1")}>
            <p
              aria-hidden="true"
              className="section-label px-2.5 pb-1 pt-2 before:hidden whitespace-nowrap"
            >
              {group.label}
            </p>

            {group.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={{ pathname: path, search }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] font-medium",
                    "transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-inset",
                    isActive
                      ? "border-l-2 border-l-clinic-blue bg-[#EEF4FF] pl-[calc(0.625rem-2px)] text-clinic-blue"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-clinic-blue" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Rodapé ── */}
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] p-2">
          <Avatar initials={initials} />
          <div className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-foreground">
              {displayEmail}
            </span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              v4 · 2026
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void signOut().catch(() => { navigate("/"); });
          }}
          className="mt-0.5 flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-[12px] text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  );
}

/* ── Sub-componentes ── */

function LogoIcon() {
  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/10">
      <img
        src="/7ce3d3b_20250916160913681_8f7f4ed99aabbdb1238946fa76330ba8.jpeg"
        alt="Dr. Dérick Vinhas"
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[11px] font-semibold text-clinic-blue ring-1 ring-inset ring-[#DBEAFE]">
      {initials}
    </span>
  );
}
