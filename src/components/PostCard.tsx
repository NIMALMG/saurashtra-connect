'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Post } from '@/types';
import { formatDate, generateExcerpt, estimateReadTime, getInitials, formatName } from '@/lib/utils';
import { togglePostLike, deletePost } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';

interface PostCardProps {
  post: Post;
  onDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const excerpt = post.excerpt || generateExcerpt(post.content);

  // ─── Like State (Optimistic) ──────────────────────────────────────────────
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [liking, setLiking] = useState(false);
  const isLiked = user ? likes.includes(user.uid) : false;

  // ─── Delete State ─────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = user?.uid === post.authorId;

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to blog post
    e.stopPropagation();

    if (!user) {
      toast.error('Sign in to like this post');
      router.push('/join');
      return;
    }
    if (liking) return; // Debounce rapid clicks

    // Optimistic update — UI changes instantly
    const wasLiked = likes.includes(user.uid);
    const optimisticLikes = wasLiked
      ? likes.filter((id) => id !== user.uid)
      : [...likes, user.uid];
    setLikes(optimisticLikes);

    setLiking(true);
    try {
      await togglePostLike(post.id, user.uid, likes);
    } catch {
      // Rollback on failure
      setLikes(likes);
      toast.error('Failed to update like');
    } finally {
      setLiking(false);
    }
  }, [user, likes, liking, post.id, router]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !isOwner) return;

    setDeleting(true);
    try {
      await deletePost(post.id, post.authorId);
      toast.success('Post deleted successfully');
      onDeleted?.(post.id);
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [user, isOwner, post.id, post.authorId, onDeleted]);

  return (
    <article className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:-translate-y-1 hover:shadow-lg transition duration-200 relative">
      {/* Delete Confirmation Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm font-medium text-gray-900 text-center">
            Delete this post? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(false); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Author Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              alt={post.authorName}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-bold ${post.authorPhotoURL ? 'hidden' : ''}`}>
            {getInitials(formatName(post.authorName) || 'U')}
          </div>
          <p className="text-sm text-[#111827] font-medium">{formatName(post.authorName)}</p>
          <span className="text-gray-400 text-xs">•</span>
          <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
        </div>

        {/* Delete Button — Owner Only */}
        {isOwner && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <Link href={`/blog/${post.slug}`} className="block mb-4">
        {/* Title */}
        <h2 className="font-display font-semibold text-gray-900 text-xl mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {excerpt}
        </p>
      </Link>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {post.tags?.length > 0 && (
            <div className="flex items-center">
              <span className="bg-primary-50 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {post.tags[0]}
              </span>
            </div>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime || estimateReadTime(post.content)} min read
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-gray-500">
          {/* Like Button — large touch target */}
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isLiked
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <Heart
              className={`w-[18px] h-[18px] transition-transform duration-150 ${
                isLiked ? 'fill-red-500 text-red-500 scale-110' : ''
              } ${liking ? 'animate-pulse' : ''}`}
            />
            <span>{likes.length}</span>
          </button>

          <Link
            href={`/blog/${post.slug}#comments`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </div>
    </article>
  );
}
