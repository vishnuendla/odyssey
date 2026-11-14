import { User, JournalEntry, Comment as JournalComment, PageResponse, NotificationItem, ReportItem, AdminStats, GeocodingResult, UserStats } from '@/types';

// All backend calls go through the Vite proxy, so cookies stay first-party.
const API_BASE_URL = '/api';
const TIMEOUT_DURATION = 15000;

interface ErrorEnvelope {
  message?: string;
  errors?: Record<string, string> | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string> | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
  }
}

interface CsrfToken {
  token: string;
  headerName: string;
}

let csrfToken: CsrfToken | null = null;
let csrfRequest: Promise<CsrfToken> | null = null;
let refreshRequest: Promise<boolean> | null = null;

async function loadCsrfToken(): Promise<CsrfToken> {
  if (csrfToken) {
    return csrfToken;
  }
  if (!csrfRequest) {
    csrfRequest = fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new ApiError('Could not start a secure session. Please refresh the page.', response.status);
        }
        const data = (await response.json()) as CsrfToken;
        csrfToken = data;
        return data;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
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

async function csrfHeader(): Promise<Record<string, string>> {
  const cookieToken = readCsrfCookie();
  if (cookieToken) {
    return { 'X-XSRF-TOKEN': cookieToken };
  }
  const token = await loadCsrfToken();
  return { [token.headerName]: token.token };
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
    throw new ApiError(
      envelope.message || fallbackMessage(response.status),
      response.status,
      envelope.errors
    );
  }

  return data as T;
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'You do not have permission to perform this action.';
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

  return parseResponse<T>(response);
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
