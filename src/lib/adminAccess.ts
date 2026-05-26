export const ADMIN_EMAIL = "admin@v4.com.br";
export const ADMIN_AREA_PROMPT_STORAGE_KEY = "crm-admin-area-prompt";

export function isAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}

export function markAdminAreaPromptPending() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ADMIN_AREA_PROMPT_STORAGE_KEY, "1");
}

export function consumeAdminAreaPromptPending() {
  if (typeof window === "undefined") {
    return false;
  }

  const isPending =
    window.sessionStorage.getItem(ADMIN_AREA_PROMPT_STORAGE_KEY) === "1";

  if (isPending) {
    window.sessionStorage.removeItem(ADMIN_AREA_PROMPT_STORAGE_KEY);
  }

  return isPending;
}
