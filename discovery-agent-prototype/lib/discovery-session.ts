const KEY_DISMISSED = "da-not-interested";
const KEY_ADDED = "da-added-this-session";
const KEY_NO_QUICK = "da-no-quick-trips";

function safeGet(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(key) === "1";
}

function safeSet(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(key, "1");
  else window.sessionStorage.removeItem(key);
}

/** Max one Discovery card outcome per browser session */
export function isDiscoveryBlockedThisSession(): boolean {
  return (
    safeGet(KEY_DISMISSED) ||
    safeGet(KEY_ADDED) ||
    safeGet(KEY_NO_QUICK)
  );
}

export function markDiscoveryDismissed() {
  safeSet(KEY_DISMISSED, true);
}

export function markDiscoveryAdded() {
  safeSet(KEY_ADDED, true);
}

export function markNoSuggestOnQuickTrips(enabled: boolean) {
  safeSet(KEY_NO_QUICK, enabled);
}

export function getNoSuggestOnQuickTrips(): boolean {
  return safeGet(KEY_NO_QUICK);
}

/** Demo helper — clear session gates (used only from Demo controls) */
export function resetDiscoverySessionFlags() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY_DISMISSED);
  window.sessionStorage.removeItem(KEY_ADDED);
  window.sessionStorage.removeItem(KEY_NO_QUICK);
  window.dispatchEvent(new Event("da-session-change"));
}
