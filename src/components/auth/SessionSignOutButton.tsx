import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useRouteAccess } from "@/lib/routeAccess";
import { cn } from "@/lib/utils";

type SessionSignOutButtonProps = {
  className?: string;
  showEmail?: boolean;
};

export function SessionSignOutButton({
  className,
  showEmail = true,
}: SessionSignOutButtonProps) {
  const queryClient = useQueryClient();
  const { signOut, userEmail } = useRouteAccess();

  if (!userEmail) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Nao foi possivel sair da conta."
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showEmail ? (
        <span className="max-w-[220px] truncate rounded-full border border-[#E2E6EB] bg-white px-3 py-1 text-[11px] font-medium text-[#5C6B7A]">
          {userEmail}
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-8 rounded-xl border-[#D8E0E8] px-3 text-[11px]"
        onClick={() => void handleSignOut()}
      >
        <LogOut data-icon="inline-start" />
        Sair
      </Button>
    </div>
  );
}
