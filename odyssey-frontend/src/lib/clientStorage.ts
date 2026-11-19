import { clearListCaches } from './listCache';
import { clearAllDrafts } from '@/utils/drafts';

/**
 * Per-user data that lives outside the auth cookies. Session storage holds list
 * snapshots for instant first paint, CacheStorage can still contain responses
 * written by an older service worker, and localStorage holds editor drafts.
 *
 * Everything here must be dropped when the account changes, otherwise the next
 * person on this browser can see the previous account's library, notifications
 * or unsent journal text.
 */

/**
 * Removes `/api/` responses from CacheStorage, leaving the offline shell alone.
 * Older service workers cached API payloads under URL-only keys; those entries
 * would replay a signed-out session or overwrite a fresh write with stale data.
 */
async function purgeCachedApiResponses(): Promise<void> {
  if (typeof caches === 'undefined') {
    return;
  }
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        await Promise.all(
          requests
            .filter((request) => new URL(request.url).pathname.startsWith('/api/'))
            .map((request) => cache.delete(request)),
        );
      }),
    );
  } catch (error) {
    console.warn('[odyssey:session] could not purge cached API responses', error);
  }
}

export async function clearPerUserClientState(options: { drafts?: boolean } = {}): Promise<void> {
  const { drafts = true } = options;
  clearListCaches();
  if (drafts) {
    clearAllDrafts();
  }
  await purgeCachedApiResponses();
}
