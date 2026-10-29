export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  bio?: string;
  location?: string;
  journalsCount?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isPublic: boolean;
  location?: Location;
  images?: string[];
  reactions: Array<{
    type: string;
    count: number;
  }>;
  comments?: Comment[];
}

export interface Location {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  placeName?: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface Reaction {
  type: 'like' | 'love' | 'wow' | 'globe';
  count: number;
}

export type ThemeMode = 'light' | 'dark';
