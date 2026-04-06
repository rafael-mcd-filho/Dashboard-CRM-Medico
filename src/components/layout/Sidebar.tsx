import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  Hammer,
  LayoutDashboard,
  Microscope,
  Stethoscope,
  Users,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Visao Geral", path: "/visao-geral", icon: LayoutDashboard },
  { label: "Contatos", path: "/contatos", icon: Users },
  { label: "Consultas", path: "/consultas", icon: CalendarDays },
  { label: "Broncoscopia", path: "/broncoscopia", icon: Microscope },
  { label: "Espirometria", path: "/espirometria", icon: Wind },
  {
    label: "Proc. Cirurgicos",
    path: "/procedimentos-cirurgicos",
    icon: Stethoscope,
  },
  {
    label: "Em Desenvolvimento",
    path: "/em-desenvolvimento/isolada",
    icon: Hammer,
    openInNewTab: true,
  },
];

export function Sidebar() {
  const { search } = useLocation();

  return (
    <aside
      aria-label="Navegacao principal"
      className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-white shadow-sidebar"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-clinic-blue to-[#0891B2] shadow-sm">
          <LayoutDashboard className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold text-[#0F1923]">
            Dashboard BI
          </span>
          <span className="text-[11px] text-[#9BAAB8]">Derick Vinhas</span>
        </div>
      </div>

      <nav aria-label="Painel de controle" className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="section-label px-2 pb-2 pt-1" aria-hidden="true">
          Painel
        </p>
        {navItems.map(({ label, path, icon: Icon, openInNewTab }) => {
          if (openInNewTab) {
            return (
              <a
                key={path}
                href={`${path}${search}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#5C6B7A] transition-all duration-150 hover:bg-[#F7F9FB] hover:text-[#0F1923] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-inset"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#9BAAB8] transition-colors" />
                {label}
              </a>
            );
          }

          return (
            <NavLink
              key={path}
              to={{ pathname: path, search }}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue focus-visible:ring-inset",
                  isActive
                    ? "bg-[#EEF3FF] text-clinic-blue shadow-[inset_3px_0_0_#1A56DB]"
                    : "text-[#5C6B7A] hover:bg-[#F7F9FB] hover:text-[#0F1923]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-clinic-blue" : "text-[#9BAAB8]"
                    )}
                  />
                  {label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-[11px] text-[#9BAAB8]">v4 · 2026</p>
      </div>
    </aside>
  );
}
