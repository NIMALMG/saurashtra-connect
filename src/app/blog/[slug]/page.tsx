'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, ArrowLeft, Calendar, Clock, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { getPostBySlug, togglePostLike, getComments, addComment, deletePost } from '@/lib/firestore';
import { Post, Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getInitials, estimateReadTime, formatName, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FullPageSpinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, userProfile } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getPostBySlug(slug),
      // Comments fetch will happen after we have the post id
    ]).then(([p]) => {
      setPost(p);
      if (p) {
        getComments(p.id).then(setComments);
      }
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (!user || !post) {
      toast.error('Sign in to like this post');
      return;
    }
    setLiking(true);
    try {
      const newLikes = await togglePostLike(post.id, user.uid, post.likes || []);
      setPost({ ...post, likes: newLikes });
    } catch {
      toast.error('Failed to update like');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !post) {
      toast.error('Sign in to comment');
      return;
    }
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await addComment({
        postId: post.id,
        authorId: user.uid,
        authorName: userProfile.displayName,
        authorPhotoURL: userProfile.photoURL || '',
        content: newComment.trim(),
      });
      setNewComment('');
      const updatedComments = await getComments(post.id);
      setComments(updatedComments);
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !post || user.uid !== post.authorId) return;
    setDeleting(true);
    try {
      await deletePost(post.id, post.authorId);
      toast.success('Post deleted');
      router.push('/blog');
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div className="pt-16"><FullPageSpinner text="Loading post..." /></div>;
  if (!post) return (
    <div className="pt-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Post not found</h2>
      <Link href="/blog" className="text-primary-600 hover:underline">← Back to Blog</Link>
    </div>
  );

  const isLiked = post.likes?.includes(user?.uid || '');
  const isOwner = user?.uid === post.authorId;

  return (
    <div className="pt-16 bg-white pb-24">
      <div className="page-container max-w-[720px] mx-auto py-10 sm:py-16">
        {/* Back */}
        <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span key={tag} className="bg-[#F3F4F6] text-[#4B5563] text-[13px] font-medium px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-[40px] sm:text-[48px] font-bold text-[#111827] leading-[1.1] tracking-tight mb-8">
          {post.title}
        </h1>

        {/* Author Meta */}
        <div className="flex items-center gap-4 mb-8">
          {post.authorPhotoURL ? (
            <img
              src={post.authorPhotoURL}
              className="w-12 h-12 rounded-full object-cover"
              alt={formatName(post.authorName)}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-lg font-bold ${post.authorPhotoURL ? 'hidden' : ''}`}>
            {getInitials(formatName(post.authorName) || 'A')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#111827] text-[15px]">{formatName(post.authorName)}</span>
              <button className="text-[#2563EB] text-[15px] font-medium hover:text-[#1D4ED8] transition-colors">Follow</button>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#6B7280] mt-0.5">
              <span>{estimateReadTime(post.content)} min read</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between py-3 border-y border-[#E5E7EB] mb-12">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isLiked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'hover:text-[#111827] hover:bg-gray-100'} disabled:opacity-50`}
            >
              <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-[#EF4444] text-[#EF4444] scale-110' : ''} ${liking ? 'animate-pulse' : ''}`} />
              <span className="font-medium">{post.likes?.length || 0}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:text-[#111827] hover:bg-gray-100 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span>{comments.length}</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-[#6B7280]">
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
              className="flex items-center gap-2 text-[14px] hover:text-[#111827] transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {isOwner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-[14px] text-gray-400 hover:text-red-500 transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this post?</h3>
              <p className="text-sm text-gray-500 mb-6">This will permanently remove the post and all its comments. This action cannot be undone.</p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <article className="prose prose-lg prose-gray max-w-none mb-16 font-serif leading-[1.8] text-[#374151] prose-headings:font-display prose-headings:font-bold prose-headings:text-[#111827] prose-a:text-[#2563EB] prose-img:rounded-2xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between py-6 border-t border-[#E5E7EB] mb-16">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${isLiked ? 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' : 'border-[#E5E7EB] bg-[#F9FAFB] hover:bg-gray-100 hover:text-[#111827]'} disabled:opacity-50`}
            >
              <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-[#EF4444] text-[#EF4444] scale-110' : ''} ${liking ? 'animate-pulse' : ''}`} />
              <span>{post.likes?.length || 0} claps</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <section>
          <h2 className="font-display font-bold text-2xl text-[#111827] mb-8">
            Responses ({comments.length})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="mb-3"
              />
              <Button type="submit" loading={submittingComment} disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </form>
          ) : (
            <div className="card p-5 mb-8 text-center bg-gray-50">
              <p className="text-gray-500 mb-3">Sign in to join the conversation</p>
              <Link href="/join" className="btn-primary text-sm">Sign In</Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="py-6 border-b border-[#E5E7EB] last:border-0 flex gap-4">
                  {comment.authorPhotoURL ? (
                    <img
                      src={comment.authorPhotoURL}
                      className="w-10 h-10 rounded-full shrink-0 object-cover"
                      alt={formatName(comment.authorName)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-sm font-bold shrink-0 ${comment.authorPhotoURL ? 'hidden' : ''}`}>
                    {getInitials(formatName(comment.authorName) || 'U')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[15px] font-semibold text-[#111827]">{formatName(comment.authorName)}</span>
                      <span className="text-sm text-[#6B7280]">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-[15px] text-[#374151] leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
