export const USER_ID_QUERY_PARAM = "userid";
export const LOCAL_ADMIN_SESSION_KEY = "crm-local-admin-auth";
export const LOCAL_ADMIN_USERNAME = "admin";
export const LOCAL_ADMIN_PASSWORD = "admin";

// Troque os IDs abaixo ou defina VITE_ALLOWED_USER_IDS=123,456 no ambiente.
const FALLBACK_ALLOWED_USER_IDS = [
  "8d971874-ab74-406f-a1a6-d7425ee3527b",
  "cf2f9f63-cc46-4231-bb8d-9e898bfdd089",
  "eafdc413-36ff-4c11-bf85-aa76c25fe068",
];

export const parseAllowedUserIds = (value?: string | null) =>
  Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const envAllowedUserIds = parseAllowedUserIds(import.meta.env.VITE_ALLOWED_USER_IDS);

export const allowedUserIds = new Set(
  envAllowedUserIds.length > 0 ? envAllowedUserIds : FALLBACK_ALLOWED_USER_IDS
);

export const getUserIdFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  const rawValue = params.get(USER_ID_QUERY_PARAM)?.trim();

  return rawValue ? rawValue : null;
};

export const isUserAuthorized = (
  userId: string | null,
  userIds: ReadonlySet<string> = allowedUserIds
) => userId !== null && userIds.has(userId);

export const isLocalHostname = (hostname?: string | null) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

export const isLocalAdminLoginEnabled = (
  hostname?: string | null,
  isDevelopment = import.meta.env.DEV
) => isDevelopment || isLocalHostname(hostname);

export const isLocalAdminCredentialsValid = (username: string, password: string) =>
  username === LOCAL_ADMIN_USERNAME && password === LOCAL_ADMIN_PASSWORD;

export const hasLocalAdminSession = (storage?: Pick<Storage, "getItem"> | null) =>
  storage?.getItem(LOCAL_ADMIN_SESSION_KEY) === "true";

export const persistLocalAdminSession = (storage?: Pick<Storage, "setItem"> | null) => {
  storage?.setItem(LOCAL_ADMIN_SESSION_KEY, "true");
};

type ResolveAccessArgs = {
  search: string;
  hostname?: string | null;
  hasLocalAdminAuth?: boolean;
  userIds?: ReadonlySet<string>;
  isDevelopment?: boolean;
};

export type AccessResolution =
  | { status: "authorized"; userId: string | null; accessMode: "userid" | "local-admin" }
  | { status: "login-required"; userId: null }
  | { status: "denied"; userId: string | null };

export const resolveAccess = ({
  search,
  hostname,
  hasLocalAdminAuth = false,
  userIds = allowedUserIds,
  isDevelopment = import.meta.env.DEV,
}: ResolveAccessArgs): AccessResolution => {
  const userId = getUserIdFromSearch(search);

  if (userId !== null) {
    return isUserAuthorized(userId, userIds)
      ? { status: "authorized", userId, accessMode: "userid" }
      : { status: "denied", userId };
  }

  if (isLocalAdminLoginEnabled(hostname, isDevelopment)) {
    return hasLocalAdminAuth
      ? { status: "authorized", userId: null, accessMode: "local-admin" }
      : { status: "login-required", userId: null };
  }

  return { status: "denied", userId: null };
};
