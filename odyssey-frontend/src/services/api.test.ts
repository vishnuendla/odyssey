import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, authApi, journalApi } from './api';

interface FakeResponse {
  status: number;
  ok: boolean;
  text: () => Promise<string>;
}

function jsonResponse(body: unknown, status = 200): FakeResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => JSON.stringify(body),
  };
}

function emptyResponse(status = 204): FakeResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => '',
  };
}

const fetchMock = vi.fn();

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    document.cookie = 'XSRF-TOKEN=test-token; path=/';
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('unwraps paged public journal responses', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ content: [{ id: 'j1' }], totalElements: 1 }));

    await expect(journalApi.getPublicJournals()).resolves.toEqual([{ id: 'j1' }]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/journals/public');
    expect(init.credentials).toBe('include');
  });

  it('serializes search filters into the query string', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 5 })
    );

    await journalApi.searchPublicJournalsPage({
      q: 'paris',
      tag: 'food',
      sort: 'popular',
      page: 2,
      size: 5,
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/journals/search?q=paris&tag=food&sort=popular&page=2&size=5'
    );
  });

  it('sends the CSRF double-submit token on mutations', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: { id: 'u1', email: 'a@example.com' } }));

    await authApi.login('a@example.com', 'secret');

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Headers;
    expect(init.method).toBe('POST');
    expect(headers.get('X-XSRF-TOKEN')).toBe('test-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('turns error envelopes into ApiError with field errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Please fix the highlighted fields.', errors: { title: 'Required' } }, 400)
    );

    await expect(journalApi.getJournalById('j1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Please fix the highlighted fields.',
      fieldErrors: { title: 'Required' },
    });
  });

  it('falls back to a readable message when the server sends none', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 413));

    await expect(journalApi.getJournalById('j1')).rejects.toEqual(
      new ApiError('The file size is too large.', 413)
    );
  });

  it('refreshes once and retries a request after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(jsonResponse({ id: 'j1', title: 'Trip' }));

    await expect(journalApi.getJournalById('j1')).resolves.toMatchObject({ id: 'j1' });

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/journals/j1',
      '/api/auth/refresh',
      '/api/journals/j1',
    ]);
  });

  it('does not retry auth endpoints after a 401', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Invalid credentials' }, 401));

    await expect(authApi.login('a@example.com', 'wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse());

    await expect(authApi.logout()).resolves.toBeUndefined();
  });
});
