/**
 * Small sessionStorage-backed cache for list pages.
 *
 * Pages read their last result synchronously on mount so a revisit (or a
 * reload in the same tab session) paints real content on the first frame, then
 * revalidate in the background. Entries are namespaced and versioned so a
 * deployment with a different data shape never renders stale objects.
 */
const PREFIX = 'odyssey.cache.';
const SCHEMA = 'v1';
const MAX_ENTRIES = 24;

function storageKey(key: string): string {
  return `${PREFIX}${SCHEMA}:${key}`;
}

export function readListCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Private windows and hardened profiles can throw on storage access.
    return null;
  }
}

export function writeListCache<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(value));
    prune();
  } catch {
    // Quota exceeded or storage disabled: the in-memory copy still works.
  }
}

function prune(): void {
  try {
    const keys = Object.keys(sessionStorage).filter((key) => key.startsWith(`${PREFIX}${SCHEMA}:`));
    if (keys.length <= MAX_ENTRIES) {
      return;
    }
    keys
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore: pruning is best effort.
  }
}
