import { User, JournalEntry, Location, Comment as JournalComment } from '@/types';

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
};

export interface JournalSearchParams {
  q?: string;
  tag?: string;
  location?: string;
  sort?: 'recent' | 'oldest';
  page?: number;
  size?: number;
}

export const searchLocations = async (query: string): Promise<Location[]> => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to fetch locations');

  const results: Array<{ display_name: string; lat: string; lon: string; address: { country?: string; city?: string; town?: string; village?: string } }> = await response.json();

  return results.map((item) => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    country: item.address.country || '',
    city: item.address.city || item.address.town || item.address.village || '',
  }));
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
    const data = await apiRequest<JournalEntry[] | { content: JournalEntry[] }>('/journals/public');
    return Array.isArray(data) ? data : data.content || [];
  },

  searchPublicJournals: async (params: JournalSearchParams = {}): Promise<JournalEntry[]> => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.tag) query.set('tag', params.tag);
    if (params.location) query.set('location', params.location);
    if (params.sort) query.set('sort', params.sort);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));

    const suffix = query.toString();
    const data = await apiRequest<JournalEntry[] | { content: JournalEntry[] }>(
      `/journals/search${suffix ? `?${suffix}` : ''}`
    );
    return Array.isArray(data) ? data : data.content || [];
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
    files.forEach(validateFile);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    return apiRequest<string[]>('/storage/upload', {
      method: 'POST',
      body: formData,
    });
  },

  searchLocations: async (query: string): Promise<Location[]> => {
    return apiRequest<Location[]>(`/locations/search?q=${encodeURIComponent(query)}`);
  },
};

// Comment and reaction API calls
export const socialApi = {
  addComment: async (journalId: string, content: string): Promise<JournalComment> => {
    return apiRequest<JournalComment>(`/journals/${journalId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
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

  removeReaction: async (journalId: string, reactionType: string): Promise<void> => {
    await apiRequest<void>(`/journals/${journalId}/reactions/${reactionType}`, { method: 'DELETE' });
  },
};

const validateFile = (file: File) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 5MB');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and GIF images are allowed');
  }
};
