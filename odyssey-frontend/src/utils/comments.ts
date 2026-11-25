import type { CommentMediaType } from '@/types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * The API writes comment timestamps from a UTC clock but serialises them
 * without an offset ("2026-11-25T17:18:08.44915"). `new Date()` would read that
 * as local time, so a comment posted seconds earlier showed up as "5h" for
 * anyone east of UTC. Treat offset-less values as UTC and leave explicit
 * offsets (optimistic `toISOString()` rows) untouched.
 */
export function parseCommentTime(value: string): number {
  const needsUtc = /^\d{4}-\d{2}-\d{2}T/.test(value) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(needsUtc ? `${value}Z` : value).getTime();
}

/**
 * Instagram-style shorthand: "now", "4m", "2h", "3d", then a short date.
 * Keeping it compact lets timestamps sit beside Reply without stealing focus.
 */
export function formatCommentTime(iso: string, now: number = Date.now()): string {
  const then = parseCommentTime(iso);
  if (!Number.isFinite(then)) {
    return '';
  }

  const elapsed = Math.max(0, now - then);
  if (elapsed < MINUTE) return 'now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}d`;

  const date = new Date(then);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function commentMediaLabel(type: CommentMediaType): string {
  switch (type) {
    case 'GIF':
      return 'GIF';
    case 'VIDEO':
      return 'Video';
    default:
      return 'Photo';
  }
}
