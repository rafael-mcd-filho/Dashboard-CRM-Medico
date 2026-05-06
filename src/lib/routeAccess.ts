import { createContext, useContext } from "react";

export type OperationsAccessRole = "viewer" | "editor";

export type RouteAccessContextValue = {
  userEmail: string | null;
  operationsRole: OperationsAccessRole | null;
  canEditOperations: boolean;
  signOut: () => Promise<void>;
};

export const RouteAccessContext = createContext<RouteAccessContextValue>({
  userEmail: null,
  operationsRole: null,
  canEditOperations: false,
  signOut: async () => undefined,
});

export function useRouteAccess() {
  return useContext(RouteAccessContext);
}
