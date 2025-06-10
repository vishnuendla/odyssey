import { User, JournalEntry, Location } from '@/types';

// Base API URL - using the proxy configuration from vite.config.ts
const API_BASE_URL = '/api';


// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    
    // Handle specific HTTP status codes
    switch (response.status) {
      case 401:
        throw new Error('Authentication required. Please log in.');
      case 403:
        throw new Error('You do not have permission to perform this action.');
      case 404:
        throw new Error('The requested resource was not found.');
      case 413:
        throw new Error('The file size is too large.');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      default:
        throw new Error(error.message || `API error: ${response.status}`);
    }
  }
  return response.json();
};

// Add request timeout
const TIMEOUT_DURATION = 10000; // 10 seconds

const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

export const accountApi = {
  getUser: async (userId: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },
  deleteUser: async (userId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
}

export const searchLocations = async (query: string): Promise<Location[]> => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to fetch locations');

  const results = await response.json();

  return results.map((item: any) => ({
    name: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    country: item.address.country || '',
    city: item.address.city || item.address.town || item.address.village || '',
  }));
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  register: async (name: string, email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  logout: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

// Journal API calls
export const journalApi = {
  getAllJournals: async (): Promise<JournalEntry[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/journals`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },
  updateUserProfile: async (userId: string, profileData: Partial<User>): Promise<User> => {
    console.log("User Id:", userId);
    console.log("📤 Payload being sent to backend:", profileData);
    const response = await fetch(`${API_BASE_URL}/journals/update/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  getPublicJournals: async (): Promise<JournalEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/journals/public`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  getUserJournals: async (): Promise<JournalEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/journals/my`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  getJournalById: async (id: string): Promise<JournalEntry> => {
    const response = await fetch(`${API_BASE_URL}/journals/${id}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  createJournal: async (journalData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'reactions' | 'comments'>): Promise<JournalEntry> => {
    console.log("📤 Payload being sent to backend:", journalData);
    const response = await fetch(`${API_BASE_URL}/journals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journalData),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  updateJournal: async (id: string, journalData: Partial<JournalEntry>): Promise<JournalEntry> => {
    const response = await fetch(`${API_BASE_URL}/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(journalData),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  deleteJournal: async (id: string) => {
    const res = await fetch(`/api/journals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  
    console.log('Response status:', res.status); // helpful debug
  
    if (!res.ok) {
      const errorText = await res.text(); // Avoid parsing JSON on empty response
      throw new Error(errorText || 'Failed to delete journal');
    }
  
    return true; // No data expected from DELETE
  },
  
  // Image upload endpoint
  uploadImages: async (files: File[]): Promise<string[]> => {
    // Validate all files before upload
    files.forEach(validateFile);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/storage/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  // Location search endpoint
  searchLocations: async (query: string): Promise<Location[]> => {
    const response = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

// Comment and reaction API calls
export const socialApi = {
  addComment: async (journalId: string, content: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/journals/${journalId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  deleteComment: async (journalId: string, commentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/journals/${journalId}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  addReaction: async (journalId: string, reactionType: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/journals/${journalId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: reactionType }),
      credentials: 'include'
    });
    return handleResponse(response);
  },
  
  removeReaction: async (journalId: string, reactionType: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/journals/${journalId}/reactions/${reactionType}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(response);
  }
};

// Add file validation
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
