import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AccessConfigurationError from "@/components/auth/AccessConfigurationError";
import AccessLoading from "@/components/auth/AccessLoading";
import AccessDenied from "@/pages/AccessDenied";
import LocalAdminLoginDialog from "@/components/auth/LocalAdminLoginDialog";
import { getUserIdFromSearch, isRecognizedUserId } from "@/lib/accessControl";
import { supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: ReactNode;
  allowRecognizedUserIdAccess?: boolean;
};

type AccessViewState =
  | { status: "loading" }
  | { status: "login-required" }
  | { status: "authorized" }
  | { status: "denied"; userId: string | null; mode: "userid" | "account" }
  | { status: "config-error"; details?: string };

const ProtectedRoute = ({
  children,
  allowRecognizedUserIdAccess = true,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [access, setAccess] = useState<AccessViewState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const validateAccess = async () => {
      if (ignore) {
        return;
      }

      setAccess({ status: "loading" });

      const requestedUserId = getUserIdFromSearch(location.search);

      if (!isRecognizedUserId(requestedUserId)) {
        if (!ignore) {
          setAccess({ status: "denied", userId: requestedUserId, mode: "userid" });
        }
        return;
      }

      if (requestedUserId && allowRecognizedUserIdAccess) {
        if (!ignore) {
          setLoginError(null);
          setAccess({ status: "authorized" });
        }
        return;
      }

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
        const relationMissing =
          permissionError.code === "42P01" ||
          permissionError.message.toLowerCase().includes("dashboard_access");

        if (!ignore) {
          setAccess({
            status: "config-error",
            details: relationMissing
              ? "A tabela public.dashboard_access ainda nao esta disponivel no backend."
              : permissionError.message,
          });
        }
        return;
      }

      if (!permissionRows || permissionRows.length === 0) {
        if (!ignore) {
          setAccess({ status: "denied", userId: requestedUserId, mode: "account" });
        }
        return;
      }

      if (!ignore) {
        setLoginError(null);
        setAccess({ status: "authorized" });
      }
    };

    void validateAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void validateAccess();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [allowRecognizedUserIdAccess, location.search]);

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setIsSubmitting(true);
    setLoginError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("Email ou senha invalidos.");
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
      />
    );
  }

  if (access.status === "config-error") {
    return <AccessConfigurationError details={access.details} />;
  }

  if (access.status === "denied") {
    return <AccessDenied userId={access.userId} mode={access.mode} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
