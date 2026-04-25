export const USER_ID_QUERY_PARAM = "userid";
export const DASHBOARD_USER_ID_HEADER = "x-dashboard-userid";

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

export const getAuthorizedUserIdFromSearch = (
  search: string,
  userIds: ReadonlySet<string> = allowedUserIds
) => {
  const userId = getUserIdFromSearch(search);

  return userId !== null && userIds.has(userId) ? userId : null;
};

export const isUserAuthorized = (
  userId: string | null,
  userIds: ReadonlySet<string> = allowedUserIds
) => userId !== null && userIds.has(userId);

export const isRecognizedUserId = (
  userId: string | null,
  userIds: ReadonlySet<string> = allowedUserIds
) => userId === null || userIds.has(userId);
