// Thin localStorage wrapper used by AppContext to persist the shared mock "database"
// across browser refreshes. Namespaced + try/caught so a private-browsing tab or a
// full storage quota never crashes the app -- it just falls back to in-memory state.
const NAMESPACE = "medilink";

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(`${NAMESPACE}:${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
  } catch {
    // Storage unavailable/full -- fail silently, app keeps working in-memory for this session.
  }
}

export function clearNamespace() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(`${NAMESPACE}:`))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}
