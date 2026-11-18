import { User, JournalEntry, Comment as JournalComment, PageResponse, NotificationItem, ReportItem, AdminStats, GeocodingResult, UserStats, AiStatus, AskAnswer, SemanticSearchHit } from '@/types';

// All backend calls go through the Vite proxy, so cookies stay first-party.
const API_BASE_URL = '/api';
const TIMEOUT_DURATION = 15000;

interface ErrorEnvelope {
  message?: string;
  errors?: Record<string, string> | null;
  code?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  /** Stable machine-readable reason, when the API supplies one. */
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string> | null,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
    this.code = code;
  }
}

interface CsrfToken {
  token: string;
  headerName: string;
}

let csrfToken: CsrfToken | null = null;
let csrfRequest: Promise<CsrfToken> | null = null;
let refreshRequest: Promise<boolean> | null = null;

const CSRF_HEADER = 'X-XSRF-TOKEN';
const CSRF_COOKIE = 'XSRF-TOKEN';

/**
 * Fetches a CSRF token and pairs it with the cookie the browser actually
 * stored.
 *
 * Double-submit only works when the header and the cookie agree, so the value
 * returned here always comes from the cookie — never from the JSON body alone.
 * If the cookie is missing right after a successful response the browser is
 * blocking site data, which makes every mutation fail with a 403; reporting
 * that plainly is far more useful than a generic permission error.
 */
async function fetchCsrfToken(force = false): Promise<CsrfToken> {
  if (!force && csrfToken) {
    return csrfToken;
  }
  if (!force && csrfRequest) {
    return csrfRequest;
  }

  const request = fetch(`${API_BASE_URL}/auth/csrf`, {
    credentials: 'include',
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError('Could not start a secure session. Please refresh the page.', response.status);
      }
      const data = (await response.json()) as CsrfToken;
      const cookie = readCsrfCookie();
      if (!cookie) {
        throw new ApiError(
          `Your browser is blocking cookies for ${window.location.host}. Allow cookies for this site, then try again.`,
          403,
          null,
          'cookies_blocked'
        );
      }
      const token: CsrfToken = { token: cookie, headerName: data.headerName || CSRF_HEADER };
      csrfToken = token;
      return token;
    })
    .finally(() => {
      csrfRequest = null;
    });

  csrfRequest = request;
  return request;
}

function isMutation(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
}

/**
 * Reads the double-submit cookie directly so a token rotated by the server is
 * never stale, even if this tab has been open for a long time.
 */
function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Expires every XSRF cookie a page is allowed to remove. Browsers may keep
 * duplicates pinned to deeper paths; the root and /api copies are the ones
 * older builds left behind.
 */
function purgeCsrfCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }
  for (const path of ['/', '/api', '/api/']) {
    document.cookie = `${CSRF_COOKIE}=; Max-Age=0; path=${path}`;
    document.cookie = `${CSRF_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  }
}

/**
 * Drops every local copy of the CSRF token — module cache and cookie — so the
 * next fetch starts clean. Used when the server rejects a mutation with 403:
 * a token that no longer validates can only be fixed by issuing a fresh one.
 */
function clearCsrfState(): void {
  csrfToken = null;
  purgeCsrfCookies();
}

async function csrfHeader(): Promise<Record<string, string>> {
  const cookieToken = readCsrfCookie();
  if (cookieToken) {
    return { [CSRF_HEADER]: cookieToken };
  }
  const token = await fetchCsrfToken(true);
  return { [token.headerName || CSRF_HEADER]: token.token };
}

const RECOVERY_FLAG = 'odyssey:client-recovery';

/**
 * Drops everything a stale deployment or a misbehaving extension can leave
 * behind in one browser: shadowed CSRF cookies, the service worker and its
 * caches. Safe to call any time; it never touches the auth cookies.
 */
export async function resetBrowserSession(): Promise<void> {
  clearCsrfState();
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('[odyssey:auth] could not reset browser storage', error);
  }
}

/**
 * Resets the client and reloads, at most once per tab. Returns false when a
 * repair already ran, so the caller can show the original error instead of
 * looping.
 */
export async function repairAndReload(): Promise<boolean> {
  try {
    if (sessionStorage.getItem(RECOVERY_FLAG)) {
      return false;
    }
    sessionStorage.setItem(RECOVERY_FLAG, '1');
  } catch {
    return false;
  }
  await resetBrowserSession();
  window.location.reload();
  return true;
}

const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/csrf',
];

async function performFetch(path: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0);
    }
    throw new ApiError('Could not reach Odyssey. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const envelope = (data ?? {}) as ErrorEnvelope;

    // The API always answers an error with a JSON envelope. A 403 without a
    // message therefore came from something else on the path — a stale service
    // worker response, a proxy, or a privacy extension — so the client is out
    // of sync and needs a clean reload rather than another blind retry.
    if (response.status === 403 && !envelope.message) {
      logUnexpectedResponse(response, text);
      throw new ApiError(
        'Your browser is holding a stale copy of Odyssey. Reloading to repair it…',
        response.status,
        null,
        'client_out_of_sync'
      );
    }

    throw new ApiError(
      envelope.message || fallbackMessage(response.status),
      response.status,
      envelope.errors,
      envelope.code
    );
  }

  return data as T;
}

function logUnexpectedResponse(response: Response, body: string): void {
  console.error('[odyssey:auth] unexpected 403 response', {
    url: response.url,
    status: response.status,
    contentType: response.headers.get('content-type'),
    body: body.slice(0, 200),
    cookies:
      typeof document === 'undefined'
        ? []
        : document.cookie
            .split('; ')
            .filter(Boolean)
            .map((pair) => pair.split('=')[0]),
    cookieEnabled: typeof navigator === 'undefined' ? null : navigator.cookieEnabled,
    serviceWorker:
      typeof navigator === 'undefined'
        ? null
        : navigator.serviceWorker?.controller?.scriptURL ?? 'none',
  });
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'This action was blocked (often a stale session). Refresh the page and try again.';
    case 404:
      return 'The requested resource was not found.';
    case 413:
      return 'The file size is too large.';
    case 429:
      return 'Too many requests. Please try again later.';
    default:
      return `API error: ${status}`;
  }
}

async function attemptRefresh(): Promise<boolean> {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      try {
        const tokenHeaders = await csrfHeader();
        const response = await performFetch('/auth/refresh', {
          method: 'POST',
          headers: tokenHeaders,
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshRequest = null;
      }
    })();
  }
  return refreshRequest;
}

async function apiRequest<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (isMutation(method)) {
    const tokenHeaders = await csrfHeader();
    Object.entries(tokenHeaders).forEach(([name, value]) => headers.set(name, value));
  }

  let response = await performFetch(path, { ...options, headers });

  if (response.status === 401 && retry && !NO_REFRESH_PATHS.includes(path)) {
    if (await attemptRefresh()) {
      response = await performFetch(path, { ...options, headers });
    }
  }

  // A 403 on a mutation means the double-submit pair did not validate: the
  // cookie is stale, shadowed by a duplicate on a deeper path, or was never
  // stored. Discard every local copy, mint a fresh pair and retry once.
  if (response.status === 403 && retry && isMutation(method)) {
    clearCsrfState();
    const token = await fetchCsrfToken(true);
    headers.set(token.headerName || CSRF_HEADER, token.token);
    response = await performFetch(path, { ...options, headers });
  }

  return parseResponse<T>(response).catch(async (error: unknown) => {
    // A mutation answered by something other than the API cannot be retried
    // into working order; rebuild the client once and let the reload finish.
    if (
      error instanceof ApiError &&
      error.code === 'client_out_of_sync' &&
      isMutation(method)
    ) {
      await repairAndReload();
    }
    throw error;
  });
}

export const accountApi = {
  getUser: async (userId: string): Promise<User> => {
    const user = await apiRequest<Omit<User, 'email'> & { email?: string }>(`/auth/users/${userId}`);
    return { ...user, email: user.email ?? '' };
  },

  getUserJournals: async (userId: string): Promise<JournalEntry[]> => {
    return apiRequest<JournalEntry[]>(`/auth/users/${userId}/journals`);
  },

  follow: async (userId: string): Promise<User> => {
    return apiRequest<User>(`/users/${userId}/follow`, { method: 'POST' });
  },

  unfollow: async (userId: string): Promise<User> => {
    return apiRequest<User>(`/users/${userId}/follow`, { method: 'DELETE' });
  },
};

export interface JournalSearchParams {
  q?: string;
  tag?: string;
  location?: string;
  sort?: 'recent' | 'oldest' | 'popular';
  page?: number;
  size?: number;
}

export const locationApi = {
  autocomplete: async (text: string, limit = 5): Promise<GeocodingResult[]> => {
    return apiRequest<GeocodingResult[]>(
      `/locations/autocomplete?text=${encodeURIComponent(text)}&limit=${limit}`
    );
  },

  geocode: async (text: string, limit = 1): Promise<GeocodingResult[]> => {
    return apiRequest<GeocodingResult[]>(
      `/locations/geocode?text=${encodeURIComponent(text)}&limit=${limit}`
    );
  },
};

// Travel statistics for the signed-in user.
export const statsApi = {
  my: async (): Promise<UserStats> => {
    return apiRequest<UserStats>('/stats/me');
  },
};

// AI features (RAG "Ask your journal"). The provider key stays on the backend;
// the browser only talks to the Odyssey API, like the Geoapify proxy.
export const aiApi = {
  status: async (): Promise<AiStatus> => {
    return apiRequest<AiStatus>('/ai/status');
  },

  ask: async (question: string): Promise<AskAnswer> => {
    return apiRequest<AskAnswer>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  search: async (query: string): Promise<SemanticSearchHit[]> => {
    return apiRequest<SemanticSearchHit[]>('/ai/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  current: boolean;
}

// Auth API calls
export const authApi = {
  login: async (email: string, password: string, rememberMe = false): Promise<User> => {
    const data = await apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    return data.user;
  },

  register: async (name: string, email: string, password: string, acceptTerms = true): Promise<User> => {
    const data = await apiRequest<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, acceptTerms }),
    });
    return data.user;
  },

  logout: async (): Promise<void> => {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  },

  logoutAll: async (): Promise<void> => {
    await apiRequest<void>('/auth/logout-all', { method: 'POST' });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>('/auth/me');
  },

  updateProfile: async (profile: Partial<Pick<User, 'name' | 'avatar' | 'bio' | 'location'>>): Promise<User> => {
    return apiRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  forgotPassword: async (email: string): Promise<string> => {
    const data = await apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return data.message;
  },

  resetPassword: async (token: string, newPassword: string): Promise<string> => {
    const data = await apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
    return data.message;
  },

  verifyEmail: async (token: string): Promise<string> => {
    const data = await apiRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return data.message;
  },

  resendVerification: async (): Promise<string> => {
    const data = await apiRequest<{ message: string }>('/auth/resend-verification', { method: 'POST' });
    return data.message;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<User> => {
    const data = await apiRequest<{ user: User }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return data.user;
  },

  deleteAccount: async (password: string, confirmation: string): Promise<string> => {
    const data = await apiRequest<{ message: string }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation }),
    });
    return data.message;
  },

  getSessions: async (): Promise<SessionInfo[]> => {
    return apiRequest<SessionInfo[]>('/auth/sessions');
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiRequest<void>(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },
};

// Journal API calls
export const journalApi = {
  getAllJournals: async (): Promise<JournalEntry[]> => {
    return apiRequest<JournalEntry[]>('/journals');
  },

  getPublicJournals: async (): Promise<JournalEntry[]> => {
    const page = await apiRequest<JournalEntry[] | PageResponse<JournalEntry>>('/journals/public');
    return Array.isArray(page) ? page : page.content || [];
  },

  getPublicJournalsPage: async (page = 0, size = 12): Promise<PageResponse<JournalEntry>> => {
    const data = await apiRequest<JournalEntry[] | PageResponse<JournalEntry>>(
      `/journals/public?page=${page}&size=${size}`
    );
    return Array.isArray(data)
      ? { content: data, totalElements: data.length, totalPages: 1, number: 0, size: data.length, first: true, last: true }
      : data;
  },

  searchPublicJournals: async (params: JournalSearchParams = {}): Promise<JournalEntry[]> => {
    const page = await journalApi.searchPublicJournalsPage(params);
    return page.content;
  },

  searchPublicJournalsPage: async (params: JournalSearchParams = {}): Promise<PageResponse<JournalEntry>> => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.tag) query.set('tag', params.tag);
    if (params.location) query.set('location', params.location);
    if (params.sort) query.set('sort', params.sort);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));

    const suffix = query.toString();
    const data = await apiRequest<JournalEntry[] | PageResponse<JournalEntry>>(
      `/journals/search${suffix ? `?${suffix}` : ''}`
    );
    return Array.isArray(data)
      ? { content: data, totalElements: data.length, totalPages: 1, number: 0, size: data.length, first: true, last: true }
      : data;
  },

  getPopularTags: async (): Promise<string[]> => {
    return apiRequest<string[]>('/journals/tags');
  },

  getBookmarkedJournals: async (): Promise<JournalEntry[]> => {
    return apiRequest<JournalEntry[]>('/journals/bookmarks');
  },

  addBookmark: async (id: string): Promise<JournalEntry> => {
    return apiRequest<JournalEntry>(`/journals/${id}/bookmark`, { method: 'POST' });
  },

  removeBookmark: async (id: string): Promise<JournalEntry> => {
    return apiRequest<JournalEntry>(`/journals/${id}/bookmark`, { method: 'DELETE' });
  },

  getUserJournals: async (): Promise<JournalEntry[]> => {
    return apiRequest<JournalEntry[]>('/journals/my');
  },

  getJournalById: async (id: string): Promise<JournalEntry> => {
    return apiRequest<JournalEntry>(`/journals/${id}`);
  },

  createJournal: async (journalData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>): Promise<JournalEntry> => {
    return apiRequest<JournalEntry>('/journals', {
      method: 'POST',
      body: JSON.stringify(journalData),
    });
  },

  updateJournal: async (id: string, journalData: Partial<JournalEntry>): Promise<JournalEntry> => {
    return apiRequest<JournalEntry>(`/journals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(journalData),
    });
  },

  deleteJournal: async (id: string): Promise<boolean> => {
    await apiRequest<void>(`/journals/${id}`, { method: 'DELETE' });
    return true;
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    validateFiles(files);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return apiRequest<string[]>('/storage/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// Comment and reaction API calls
export const socialApi = {
  addComment: async (journalId: string, content: string, parentId?: string | null): Promise<JournalComment> => {
    return apiRequest<JournalComment>(`/journals/${journalId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId: parentId ?? null }),
    });
  },

  deleteComment: async (journalId: string, commentId: string): Promise<void> => {
    await apiRequest<void>(`/journals/${journalId}/comments/${commentId}`, { method: 'DELETE' });
  },

  addReaction: async (journalId: string, reactionType: string): Promise<void> => {
    await apiRequest<void>(`/journals/${journalId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType }),
    });
  },
};

export const notificationApi = {
  list: async (): Promise<NotificationItem[]> => {
    return apiRequest<NotificationItem[]>('/notifications');
  },

  unreadCount: async (): Promise<number> => {
    const data = await apiRequest<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  markRead: async (id: string): Promise<void> => {
    await apiRequest<void>(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllRead: async (): Promise<void> => {
    await apiRequest<void>('/notifications/read-all', { method: 'POST' });
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/notifications/${id}`, { method: 'DELETE' });
  },
};

export interface CreateReportInput {
  targetType: 'JOURNAL' | 'COMMENT';
  targetId: string;
  reason: string;
  details?: string;
}

export const moderationApi = {
  report: async (input: CreateReportInput): Promise<ReportItem> => {
    return apiRequest<ReportItem>('/reports', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  listReports: async (status?: string, page = 0, size = 20): Promise<PageResponse<ReportItem>> => {
    const query = new URLSearchParams();
    if (status && status !== 'ALL') query.set('status', status);
    query.set('page', String(page));
    query.set('size', String(size));
    return apiRequest<PageResponse<ReportItem>>(`/admin/reports?${query.toString()}`);
  },

  resolveReport: async (id: string, action: 'HIDE' | 'DISMISS', note?: string): Promise<ReportItem> => {
    return apiRequest<ReportItem>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, note }),
    });
  },

  stats: async (): Promise<AdminStats> => {
    return apiRequest<AdminStats>('/admin/stats');
  },

  setJournalVisibility: async (journalId: string, hidden: boolean): Promise<void> => {
    await apiRequest<void>(`/admin/journals/${journalId}/visibility?hidden=${hidden}`, {
      method: 'PATCH',
    });
  },

  setCommentVisibility: async (commentId: string, hidden: boolean): Promise<void> => {
    await apiRequest<void>(`/admin/comments/${commentId}/visibility?hidden=${hidden}`, {
      method: 'PATCH',
    });
  },
};

export const MAX_FILES_PER_UPLOAD = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_UPLOAD_SIZE = 15 * 1024 * 1024; // 15 MB total per request
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const validateFiles = (files: File[]) => {
  if (files.length === 0) {
    throw new Error('Choose at least one image.');
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new Error(`You can upload up to ${MAX_FILES_PER_UPLOAD} images at a time.`);
  }

  let total = 0;
  files.forEach((file) => {
    total += file.size;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} is larger than 5 MB.`);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF and WebP images are allowed.');
    }
  });

  if (total > MAX_UPLOAD_SIZE) {
    throw new Error('The combined upload must be 15 MB or smaller.');
  }
};
