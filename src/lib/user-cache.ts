// Per-viewer cache of the visitor's name/email so reserve, waitlist, and
// subscribe forms can pre-populate. Lives only in the visitor's browser.

const KEY = "yardSaleUser";

export type CachedUser = { name?: string; email?: string };

export function getCachedUser(): CachedUser {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : {};
  } catch {
    return {};
  }
}

export function setCachedUser(user: CachedUser): void {
  if (typeof window === "undefined") return;
  try {
    const merged = { ...getCachedUser(), ...user };
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // ignore (private mode, blocked storage, etc.)
  }
}
