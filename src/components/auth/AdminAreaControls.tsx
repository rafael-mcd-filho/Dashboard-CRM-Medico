import {
  CalendarDays,
  Check,
  ChevronDown,
  Hammer,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isAdminEmail } from "@/lib/adminAccess";
import { useRouteAccess } from "@/lib/routeAccess";
import { cn } from "@/lib/utils";

type AdminAreaId = "bi" | "agenda" | "operations";

type AdminArea = {
  id: AdminAreaId;
  label: string;
  detail: string;
  path: string;
  icon: LucideIcon;
};

const ADMIN_AREAS: AdminArea[] = [
  {
    id: "bi",
    label: "BI",
    detail: "Indicadores e funis",
    path: "/visao-geral",
    icon: LayoutDashboard,
  },
  {
    id: "agenda",
    label: "Agenda",
    detail: "Agendamentos",
    path: "/agenda",
    icon: CalendarDays,
  },
  {
    id: "operations",
    label: "Operacional",
    detail: "Cards e equipe",
    path: "/operacional",
    icon: Hammer,
  },
];

function getCurrentArea(pathname: string) {
  if (pathname.startsWith("/agenda"))     return ADMIN_AREAS[1];
  if (pathname.startsWith("/operacional") || pathname.startsWith("/em-desenvolvimento"))
    return ADMIN_AREAS[2];
  return ADMIN_AREAS[0];
}

function useAdminAreaNavigation() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const currentArea = getCurrentArea(location.pathname);

  const goToArea = (area: AdminArea, options?: { replace?: boolean }) => {
    if (area.id === currentArea.id) return;
    navigate(area.path, { replace: options?.replace });
  };

  return { currentArea, goToArea };
}

/* ── Seleção de área no login admin ── */
type AdminAreaSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminAreaSelectionDialog({
  open,
  onOpenChange,
}: AdminAreaSelectionDialogProps) {
  const { goToArea } = useAdminAreaNavigation();

  const handleSelect = (area: AdminArea) => {
    onOpenChange(false);
    goToArea(area, { replace: true });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Scrim + centro via flexbox — mais confiável que translate em todos os viewports */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
        {/* Modal com entrada spring */}
        <DialogPrimitive.Content
          className={cn(
            "relative z-50 w-full max-w-[580px]",
            "overflow-hidden rounded-[var(--radius-lg)] border border-slate-200 bg-white",
            "shadow-[0_24px_64px_-12px_rgba(15,25,35,0.24),0_4px_8px_rgba(15,25,35,0.06)]",
            "focus:outline-none",
            "animate-modal-in"
          )}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Linha topo */}
          <div
            className="h-px bg-gradient-to-r from-clinic-blue via-clinic-teal to-transparent"
            aria-hidden="true"
          />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="section-label before:hidden text-clinic-blue">
                Acesso administrador
              </p>
              <DialogPrimitive.Title className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Escolha a área
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-[12px] text-slate-400">
                Selecione uma área para continuar.
              </DialogPrimitive.Description>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              admin
            </span>
          </div>

          {/* Grid de áreas */}
          <div className="grid gap-2 p-3 sm:grid-cols-3">
            {ADMIN_AREAS.map((area) => {
              const Icon = area.icon;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSelect(area)}
                  className={cn(
                    "group flex min-h-[100px] items-center gap-3",
                    "rounded-[var(--radius-md)] border border-slate-200 bg-white p-3.5 text-left",
                    "transition-all duration-200",
                    "hover:border-clinic-blue/30 hover:bg-[#F8FAFF] hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                      "border border-[#DBEAFE] bg-[#EFF6FF] text-clinic-blue",
                      "transition-colors group-hover:bg-[#DBEAFE]"
                    )}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-slate-900">
                      {area.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                      {area.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ── Switcher compacto (dentro de dropdown) ── */
type AdminAreaSwitcherProps = {
  className?: string;
};

export function AdminAreaSwitcher({ className }: AdminAreaSwitcherProps) {
  const { userEmail }             = useRouteAccess();
  const { currentArea, goToArea } = useAdminAreaNavigation();

  if (!isAdminEmail(userEmail)) return null;

  const CurrentIcon = currentArea.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 rounded-[var(--radius-md)] border-slate-200 bg-white px-3 text-[12px] text-slate-700 shadow-none hover:bg-slate-50",
            className
          )}
        >
          <CurrentIcon aria-hidden="true" data-icon="inline-start" />
          {currentArea.label}
          <ChevronDown aria-hidden="true" data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-[var(--radius-lg)] border-slate-200 p-1.5 shadow-pop"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">
          Áreas
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup>
          {ADMIN_AREAS.map((area) => {
            const Icon     = area.icon;
            const isCurrent = area.id === currentArea.id;

            return (
              <DropdownMenuItem
                key={area.id}
                disabled={isCurrent}
                onSelect={() => goToArea(area)}
                className="gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-[13px]"
              >
                <Icon aria-hidden="true" className="h-4 w-4 text-slate-400" />
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{area.label}</span>
                  <span className="text-[10px] text-slate-400">{area.detail}</span>
                </span>
                {isCurrent ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-clinic-blue" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Floating switcher (cantos de telas isoladas) ── */
export function AdminAreaFloatingSwitcher() {
  const { userEmail } = useRouteAccess();

  if (!isAdminEmail(userEmail)) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      <AdminAreaSwitcher className="h-9 rounded-full border-slate-200 bg-white px-4 shadow-pop hover:bg-slate-50" />
    </div>
  );
}
