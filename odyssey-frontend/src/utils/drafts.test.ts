import { describe, it, expect, beforeEach } from 'vitest';
import { saveDraft, loadDraft, clearDraft, hasDraft, draftAgeLabel } from '@/utils/drafts';

describe('drafts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips values through localStorage', () => {
    saveDraft('journal:new', { title: 'Five mornings in Jaipur', isPublic: true });

    const draft = loadDraft<{ title: string; isPublic: boolean }>('journal:new');

    expect(draft).not.toBeNull();
    expect(draft?.values.title).toBe('Five mornings in Jaipur');
    expect(draft?.values.isPublic).toBe(true);
    expect(draft?.version).toBe(1);
    expect(hasDraft('journal:new')).toBe(true);
  });

  it('returns null for missing, corrupt or wrong-version drafts', () => {
    expect(loadDraft('journal:new')).toBeNull();

    window.localStorage.setItem('odyssey:draft:journal:new', '{not json');
    expect(loadDraft('journal:new')).toBeNull();

    window.localStorage.setItem(
      'odyssey:draft:journal:new',
      JSON.stringify({ version: 99, savedAt: '2020-01-01T00:00:00Z', values: {} }),
    );
    expect(loadDraft('journal:new')).toBeNull();
    expect(hasDraft('journal:new')).toBe(false);
  });

  it('clears drafts', () => {
    saveDraft('journal:new', { title: 'x' });
    clearDraft('journal:new');

    expect(loadDraft('journal:new')).toBeNull();
    expect(hasDraft('journal:new')).toBe(false);
  });

  it('labels draft ages readably', () => {
    const now = new Date('2026-11-14T12:00:00Z');

    expect(draftAgeLabel('2026-11-14T11:59:50Z', now)).toBe('just now');
    expect(draftAgeLabel('2026-11-14T11:30:00Z', now)).toBe('30 min ago');
    expect(draftAgeLabel('2026-11-14T09:00:00Z', now)).toBe('3 h ago');
    expect(draftAgeLabel('2026-11-12T12:00:00Z', now)).toBe('2 d ago');
    expect(draftAgeLabel('not-a-date', now)).toBe('earlier');
  });
});
