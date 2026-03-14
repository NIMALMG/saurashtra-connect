import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  region?: string;
  website?: string;
  role: 'user' | 'admin';
  joinedAt: Timestamp | Date;
  contributionCount: number;
  // Gamification & Scoring system
  contributions?: {
    blogs: number;
    words: number;
    recordings: number;
  };
  score?: number;
  badges?: string[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // markdown
  excerpt: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  tags: string[];
  likes: string[]; // array of user uids
  status: 'published' | 'draft' | 'removed';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  coverImage?: string;
  readTime?: number;
}

export interface Word {
  id: string;
  sauraWord: string;
  english: string;
  tamil: string;
  sentence?: string;
  audioURL?: string;
  authorId: string;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

export interface VoiceRecording {
  id: string;
  phrase: string;
  translation: string;
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  region: string;
  audioURL: string;
  audioName: string;
  duration?: number;
  authorId: string;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Timestamp | Date;
}

export interface Stats {
  totalWords: number;
  totalRecordings: number;
  totalMembers: number;
  totalPosts: number;
}

export type ContentStatus = 'pending' | 'approved' | 'rejected' | 'removed';

export interface AdminAction {
  type: 'approve' | 'reject' | 'delete';
  collection: 'words' | 'voiceRecordings' | 'posts';
  documentId: string;
}
