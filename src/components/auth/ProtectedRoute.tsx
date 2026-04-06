import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import AccessDenied from "@/pages/AccessDenied";
import LocalAdminLoginDialog from "@/components/auth/LocalAdminLoginDialog";
import {
  hasLocalAdminSession,
  persistLocalAdminSession,
  resolveAccess,
} from "@/lib/accessControl";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [hasLocalAdminAuth, setHasLocalAdminAuth] = useState(() =>
    typeof window !== "undefined" ? hasLocalAdminSession(window.sessionStorage) : false
  );

  const access = resolveAccess({
    search: location.search,
    hostname: typeof window !== "undefined" ? window.location.hostname : null,
    hasLocalAdminAuth,
  });

  if (access.status === "login-required") {
    return (
      <LocalAdminLoginDialog
        onAuthenticated={() => {
          if (typeof window !== "undefined") {
            persistLocalAdminSession(window.sessionStorage);
          }

          setHasLocalAdminAuth(true);
        }}
      />
    );
  }

  if (access.status === "denied") {
    return <AccessDenied userId={access.userId} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
