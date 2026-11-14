/**
 * Draft autosave for the journal forms. Values live in localStorage under a
 * versioned key so a crashed tab, an accidental reload or a closed laptop
 * never costs an hour of writing.
 *
 * Every read is defensive: private-mode browsers, quota errors and half-written
 * JSON must never take the form down — worst case the draft is simply absent.
 */

const PREFIX = 'odyssey:draft:';
const VERSION = 1;

export interface Draft<T> {
  version: number;
  savedAt: string;
  values: T;
}

export function saveDraft<T>(key: string, values: T): void {
  try {
    const draft: Draft<T> = {
      version: VERSION,
      savedAt: new Date().toISOString(),
      values,
    };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(draft));
  } catch {
    // Quota exceeded, storage disabled or private mode: drafts are best-effort.
  }
}

export function loadDraft<T>(key: string): Draft<T> | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Draft<T>;
    if (!parsed || parsed.version !== VERSION || typeof parsed.values !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore: an unreadable store cannot make things worse.
  }
}

export function hasDraft(key: string): boolean {
  return loadDraft(key) !== null;
}

/** Human short label like "just now", "5 min ago" or "2 h ago". */
export function draftAgeLabel(savedAt: string, now: Date = new Date()): string {
  const saved = new Date(savedAt).getTime();
  if (Number.isNaN(saved)) {
    return 'earlier';
  }
  const seconds = Math.max(0, Math.floor((now.getTime() - saved) / 1000));
  if (seconds < 45) {
    return 'just now';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h ago`;
  }
  return `${Math.floor(seconds / 86400)} d ago`;
}
