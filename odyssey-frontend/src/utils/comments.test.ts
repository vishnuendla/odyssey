import { describe, it, expect } from 'vitest';
import { commentMediaLabel, formatCommentTime, parseCommentTime } from '@/utils/comments';

const NOW = new Date('2026-11-25T12:00:00Z').getTime();

describe('parseCommentTime', () => {
  it('reads offset-less API timestamps as UTC', () => {
    // The backend serialises LocalDateTime from a UTC clock without an offset.
    expect(parseCommentTime('2026-11-25T12:00:00')).toBe(NOW);
    expect(parseCommentTime('2026-11-25T12:00:00.449')).toBe(NOW + 449);
  });

  it('keeps explicit offsets and optimistic ISO values as-is', () => {
    expect(parseCommentTime('2026-11-25T12:00:00Z')).toBe(NOW);
    expect(parseCommentTime('2026-11-25T17:30:00+05:30')).toBe(NOW);
  });
});

describe('formatCommentTime', () => {
  it('uses short ages for recent comments', () => {
    expect(formatCommentTime(new Date(NOW - 10_000).toISOString(), NOW)).toBe('now');
    expect(formatCommentTime(new Date(NOW - 4 * 60_000).toISOString(), NOW)).toBe('4m');
    expect(formatCommentTime(new Date(NOW - 2 * 60 * 60_000).toISOString(), NOW)).toBe('2h');
    expect(formatCommentTime(new Date(NOW - 3 * 24 * 60 * 60_000).toISOString(), NOW)).toBe('3d');
  });

  it('shows a just-posted offset-less comment as "now", not hours old', () => {
    expect(formatCommentTime('2026-11-25T11:59:30', NOW)).toBe('now');
  });

  it('falls back to a short calendar date after a week', () => {
    const label = formatCommentTime('2026-01-08T12:00:00Z', NOW);
    expect(label).toContain('Jan');
    expect(label).toContain('8');
  });

  it('handles invalid timestamps without rendering Invalid Date', () => {
    expect(formatCommentTime('not-a-date', NOW)).toBe('');
  });
});

describe('commentMediaLabel', () => {
  it('names each attachment kind for screen readers', () => {
    expect(commentMediaLabel('GIF')).toBe('GIF');
    expect(commentMediaLabel('VIDEO')).toBe('Video');
    expect(commentMediaLabel('IMAGE')).toBe('Photo');
  });
});
