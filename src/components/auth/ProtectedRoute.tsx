import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AccessConfigurationError from "@/components/auth/AccessConfigurationError";
import AccessLoading from "@/components/auth/AccessLoading";
import AccessDenied from "@/pages/AccessDenied";
import {
  AdminAreaFloatingSwitcher,
  AdminAreaSelectionDialog,
} from "@/components/auth/AdminAreaControls";
import LocalAdminLoginDialog from "@/components/auth/LocalAdminLoginDialog";
import {
  getAuthorizedUserIdFromSearch,
  getUserIdFromSearch,
  isRecognizedUserId,
} from "@/lib/accessControl";
import {
  RouteAccessContext,
  type OperationsAccessRole,
} from "@/lib/routeAccess";
import {
  consumeAdminAreaPromptPending,
  isAdminEmail,
  markAdminAreaPromptPending,
} from "@/lib/adminAccess";
import { supabase } from "@/integrations/supabase/client";

type ProtectedAccessArea = "dashboard" | "operations";

type ProtectedRouteProps = {
  children: ReactNode;
  allowRecognizedUserIdAccess?: boolean;
  accessArea?: ProtectedAccessArea;
};

type AccessViewState =
  | { status: "loading" }
  | { status: "login-required" }
  | {
      status: "authorized";
      userEmail: string | null;
      operationsRole: OperationsAccessRole | null;
    }
  | {
      status: "denied";
      userId: string | null;
      mode: "userid" | "account" | "operations";
    }
  | { status: "redirect"; pathname: string; search?: string }
  | { status: "config-error"; details?: string };

function isOperationsAccessRole(value: string | null | undefined): value is OperationsAccessRole {
  return value === "viewer" || value === "editor";
}

const isMissingRelationError = (
  error: { code?: string | null; message?: string | null } | null,
  relationName: string
) =>
  Boolean(
    error &&
      (error.code === "42P01" || error.message?.toLowerCase().includes(relationName))
  );

const ProtectedRoute = ({
  children,
  allowRecognizedUserIdAccess = true,
  accessArea = "dashboard",
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [access, setAccess] = useState<AccessViewState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminAreaPromptOpen, setAdminAreaPromptOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    const validateAccess = async ({ showLoading = true } = {}) => {
      if (ignore) {
        return;
      }

      if (showLoading) {
        setAccess({ status: "loading" });
      }

      const requestedUserId = getUserIdFromSearch(location.search);
      const authorizedUserId = getAuthorizedUserIdFromSearch(location.search);

      if (accessArea === "operations") {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          if (!ignore) {
            setAccess({ status: "config-error", details: sessionError.message });
          }
          return;
        }

        if (!session) {
          if (!ignore) {
            setAccess({ status: "login-required" });
          }
          return;
        }

        const userEmail = session.user.email?.trim().toLowerCase() ?? null;

        const { data: operationsAccess, error: operationsAccessError } =
          await supabase
            .from("operations_access")
            .select("role")
            .eq("active", true)
            .maybeSingle();

        if (operationsAccessError) {
          if (!ignore) {
            setAccess({
              status: "config-error",
              details: isMissingRelationError(operationsAccessError, "operations_access")
                ? "A tabela public.operations_access ainda nao esta disponivel no backend."
                : operationsAccessError.message,
            });
          }
          return;
        }

        const operationsRole = isOperationsAccessRole(operationsAccess?.role)
          ? operationsAccess.role
          : null;

        if (!operationsRole) {
          let dashboardQuery = supabase
            .from("dashboard_access")
            .select("id")
            .eq("active", true)
            .limit(1);

          if (requestedUserId) {
            dashboardQuery = dashboardQuery.eq("external_userid", requestedUserId);
          }

          const { data: dashboardRows, error: dashboardError } = await dashboardQuery;

          if (dashboardError) {
            if (!ignore) {
              setAccess({
                status: "config-error",
                details: isMissingRelationError(dashboardError, "dashboard_access")
                  ? "A tabela public.dashboard_access ainda nao esta disponivel no backend."
                  : dashboardError.message,
              });
            }
            return;
          }

          if (dashboardRows && dashboardRows.length > 0) {
            if (!ignore) {
              setAccess({
                status: "redirect",
                pathname: "/visao-geral",
                search: location.search,
              });
            }
            return;
          }

          if (!ignore) {
            setAccess({ status: "denied", userId: userEmail, mode: "operations" });
          }
          return;
        }

        if (!ignore) {
          setLoginError(null);
          setAccess({ status: "authorized", userEmail, operationsRole });
        }
        return;
      }

      if (!isRecognizedUserId(requestedUserId)) {
        if (!ignore) {
          setAccess({ status: "denied", userId: requestedUserId, mode: "userid" });
        }
        return;
      }

      if (allowRecognizedUserIdAccess && authorizedUserId) {
        if (!ignore) {
          setLoginError(null);
          setAccess({
            status: "authorized",
            userEmail: null,
            operationsRole: null,
          });
        }
        return;
      }

      // Without a recognized public `userid`, the dashboard still depends on
      // a Supabase session plus the authenticated account permission mapping.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        if (!ignore) {
          setAccess({ status: "config-error", details: sessionError.message });
        }
        return;
      }

      if (!session) {
        if (!ignore) {
          setAccess({ status: "login-required" });
        }
        return;
      }

      let query = supabase.from("dashboard_access").select("id").eq("active", true).limit(1);

      if (requestedUserId) {
        query = query.eq("external_userid", requestedUserId);
      }

      const { data: permissionRows, error: permissionError } = await query;

      if (permissionError) {
        if (!ignore) {
          setAccess({
            status: "config-error",
            details: isMissingRelationError(permissionError, "dashboard_access")
              ? "A tabela public.dashboard_access ainda nao esta disponivel no backend."
              : permissionError.message,
          });
        }
        return;
      }

      if (!permissionRows || permissionRows.length === 0) {
        const { data: operationsAccess, error: operationsAccessError } =
          await supabase
            .from("operations_access")
            .select("role")
            .eq("active", true)
            .maybeSingle();

        if (operationsAccessError) {
          if (!ignore) {
            setAccess({
              status: "config-error",
              details: isMissingRelationError(operationsAccessError, "operations_access")
                ? "A tabela public.operations_access ainda nao esta disponivel no backend."
                : operationsAccessError.message,
            });
          }
          return;
        }

        if (isOperationsAccessRole(operationsAccess?.role)) {
          if (!ignore) {
            setAccess({ status: "redirect", pathname: "/operacional" });
          }
          return;
        }

        if (!ignore) {
          setAccess({ status: "denied", userId: requestedUserId, mode: "account" });
        }
        return;
      }

      if (!ignore) {
        setLoginError(null);
        setAccess({
          status: "authorized",
          userEmail: session.user.email?.trim().toLowerCase() ?? null,
          operationsRole: null,
        });
      }
    };

    void validateAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        return;
      }

      void validateAccess({ showLoading: false });
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [accessArea, allowRecognizedUserIdAccess, location.search]);

  useEffect(() => {
    if (access.status !== "authorized" || !isAdminEmail(access.userEmail)) {
      return;
    }

    if (consumeAdminAreaPromptPending()) {
      setAdminAreaPromptOpen(true);
    }
  }, [access]);

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setIsSubmitting(true);
    setLoginError(null);
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoginError("Email ou senha invalidos.");
    } else if (isAdminEmail(normalizedEmail)) {
      markAdminAreaPromptPending();
      setAdminAreaPromptOpen(true);
    }

    setIsSubmitting(false);
  };

  if (access.status === "loading") {
    return <AccessLoading />;
  }

  if (access.status === "login-required") {
    return (
      <LocalAdminLoginDialog
        onSubmit={handleLogin}
        errorMessage={loginError}
        isSubmitting={isSubmitting}
        accessArea={accessArea}
      />
    );
  }

  if (access.status === "config-error") {
    return <AccessConfigurationError details={access.details} />;
  }

  if (access.status === "denied") {
    return <AccessDenied userId={access.userId} mode={access.mode} />;
  }

  if (access.status === "redirect") {
    return (
      <Navigate
        to={{ pathname: access.pathname, search: access.search }}
        replace
      />
    );
  }

  const shouldShowAdminAreaPrompt =
    adminAreaPromptOpen && isAdminEmail(access.userEmail);

  return (
    <RouteAccessContext.Provider
      value={{
        userEmail: access.userEmail,
        operationsRole: access.operationsRole,
        canEditOperations: access.operationsRole === "editor",
        signOut: async () => {
          const { error } = await supabase.auth.signOut();

          if (error) {
            throw error;
          }
        },
      }}
    >
      <AdminAreaSelectionDialog
        open={shouldShowAdminAreaPrompt}
        onOpenChange={setAdminAreaPromptOpen}
      />
      {shouldShowAdminAreaPrompt ? null : <AdminAreaFloatingSwitcher />}
      {shouldShowAdminAreaPrompt ? null : children}
    </RouteAccessContext.Provider>
  );
};

export default ProtectedRoute;
