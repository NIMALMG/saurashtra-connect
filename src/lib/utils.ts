import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | Timestamp | string): string {
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return format(d, 'MMM d, yyyy');
}

export function formatRelativeTime(date: Date | Timestamp | string): string {
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateExcerpt(markdown: string, length = 150): string {
  const plain = markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  return truncate(plain, length);
}

export function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function getInitials(name: string | undefined | null): string {
  if (!name || name.trim() === '') return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatName(name: string | undefined | null, email?: string | null): string {
  if (name?.trim()) {
    return name.replace(/\s+\d+$/, '').trim();
  }
  if (email && email.includes('@')) {
    return email.split('@')[0];
  }
  return 'Community Member';
}

export const BADGE_CONFIG: Record<string, { label: string; icon: string }> = {
  first_word: { label: 'First Word', icon: '✨' },
  voice_beginner: { label: 'Voice Contributor', icon: '🎤' },
  writer: { label: 'Writer', icon: '✍️' },
  word_contributor: { label: 'Word Contributor', icon: '📚' },
  voice_keeper: { label: 'Voice Keeper', icon: '🎙️' },
  language_guardian: { label: 'Language Guardian', icon: '🛡️' },
};
