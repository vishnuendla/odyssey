
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
  location: Location;
  images: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  reactions: Reaction[];
  comments: Comment[];
}

export interface Location {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
}

export interface Reaction {
  type: 'like' | 'love' | 'wow' | 'globe';
  count: number;
}

export type ThemeMode = 'light' | 'dark';
