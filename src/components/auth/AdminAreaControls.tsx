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
    detail: "Indicadores",
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
    detail: "Cards",
    path: "/operacional",
    icon: Hammer,
  },
];

function getCurrentArea(pathname: string) {
  if (pathname.startsWith("/agenda")) {
    return ADMIN_AREAS[1];
  }

  if (
    pathname.startsWith("/operacional") ||
    pathname.startsWith("/em-desenvolvimento")
  ) {
    return ADMIN_AREAS[2];
  }

  return ADMIN_AREAS[0];
}

function useAdminAreaNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentArea = getCurrentArea(location.pathname);

  const goToArea = (area: AdminArea, options?: { replace?: boolean }) => {
    if (area.id === currentArea.id) {
      return;
    }

    navigate(area.path, { replace: options?.replace });
  };

  return { currentArea, goToArea };
}

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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#F3F6FA]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] border border-[#D8E2EE] bg-white shadow-[0_22px_60px_rgba(15,25,35,0.14)] focus:outline-none"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="grid gap-4 border-b border-[#E6EDF5] px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clinic-blue">
                Acesso administrador
              </p>
              <DialogPrimitive.Title className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-[#0F1923]">
                Escolha a área
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 max-w-xl text-sm leading-6 text-[#5C6B7A]">
                Selecione uma área para continuar.
              </DialogPrimitive.Description>
            </div>
            <span className="w-fit rounded-full border border-[#E2E8F0] bg-[#F8FBFD] px-2.5 py-1 text-[11px] font-medium text-[#40505F]">
              admin@v4.com.br
            </span>
          </div>

          <div className="grid gap-2.5 p-3 sm:grid-cols-3">
            {ADMIN_AREAS.map((area) => {
              const Icon = area.icon;

              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => handleSelect(area)}
                  className="group flex min-h-[106px] items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-3 text-left transition-all hover:border-[#B8C7DB] hover:bg-[#FAFCFE] hover:shadow-[0_12px_26px_rgba(15,25,35,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-blue"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-[#D8E6FF] bg-[#F4F8FF] text-clinic-blue transition-colors group-hover:bg-[#EAF2FF]">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[#0F1923]">
                      {area.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-[#5C6B7A]">
                      {area.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type AdminAreaSwitcherProps = {
  className?: string;
};

export function AdminAreaSwitcher({ className }: AdminAreaSwitcherProps) {
  const { userEmail } = useRouteAccess();
  const { currentArea, goToArea } = useAdminAreaNavigation();

  if (!isAdminEmail(userEmail)) {
    return null;
  }

  const CurrentIcon = currentArea.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-8 rounded-xl border-[#D8E0E8] bg-white px-3 text-[11px] text-[#314356]",
            className
          )}
        >
          <CurrentIcon data-icon="inline-start" />
          {currentArea.label}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#DDE6F0] p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[#8A97A6]">
          Areas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {ADMIN_AREAS.map((area) => {
            const Icon = area.icon;
            const isCurrent = area.id === currentArea.id;

            return (
              <DropdownMenuItem
                key={area.id}
                disabled={isCurrent}
                onSelect={() => goToArea(area)}
                className="gap-2 rounded-lg px-2 py-2 text-sm"
              >
                <Icon aria-hidden="true" />
                <span className="flex flex-1 flex-col">
                  <span className="font-medium">{area.label}</span>
                  <span className="text-[11px] text-[#7A8794]">{area.detail}</span>
                </span>
                {isCurrent ? <Check aria-hidden="true" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminAreaFloatingSwitcher() {
  const { userEmail } = useRouteAccess();

  if (!isAdminEmail(userEmail)) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      <AdminAreaSwitcher className="h-10 rounded-full border-[#C8D5E3] bg-white px-4 text-[12px] shadow-[0_16px_42px_rgba(15,25,35,0.16)] hover:bg-[#F8FBFD]" />
    </div>
  );
}
