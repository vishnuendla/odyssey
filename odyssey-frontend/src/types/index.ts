export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  bio?: string;
  location?: string;
  emailVerified?: boolean;
  role?: 'USER' | 'ADMIN';
  journalsCount?: number;
  followersCount?: number;
  followingCount?: number;
  following?: boolean;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  isPublic: boolean;
  hidden?: boolean;
  location?: Location;
  images?: string[];
  tags?: string[];
  bookmarked?: boolean;
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
  parentId?: string | null;
}

export interface Reaction {
  type: 'like' | 'love' | 'wow' | 'globe';
  count: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'FOLLOW' | 'REACTION' | 'COMMENT' | 'REPLY' | 'BOOKMARK';
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  journalId?: string;
  commentId?: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'JOURNAL' | 'COMMENT';
  targetId: string;
  targetPreview?: string;
  targetAuthorId?: string;
  targetAuthorName?: string;
  targetHidden?: boolean;
  reason: string;
  details?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  resolvedByName?: string;
  resolutionNote?: string;
}

export interface AdminStats {
  users: number;
  journals: number;
  publicJournals: number;
  comments: number;
  openReports: number;
}

export type ThemeMode = 'light' | 'dark';
