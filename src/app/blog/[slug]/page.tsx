'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, ArrowLeft, Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { getPostBySlug, togglePostLike, getComments, addComment } from '@/lib/firestore';
import { Post, Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatRelativeTime, estimateReadTime, getInitials } from '@/lib/utils';
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

  if (loading) return <div className="pt-16"><FullPageSpinner text="Loading post..." /></div>;
  if (!post) return (
    <div className="pt-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Post not found</h2>
      <Link href="/blog" className="text-primary-600 hover:underline">← Back to Blog</Link>
    </div>
  );

  const isLiked = post.likes?.includes(user?.uid || '');

  return (
    <div className="pt-16 bg-surface">
      <div className="page-container max-w-3xl py-10">
        {/* Back */}
        <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="primary">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-5 mb-8 text-sm text-gray-400 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2">
            {post.authorPhotoURL ? (
              <img src={post.authorPhotoURL} className="w-8 h-8 rounded-full object-cover" alt={post.authorName} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                {getInitials(post.authorName || 'A')}
              </div>
            )}
            <span className="font-medium text-gray-700">{post.authorName}</span>
          </div>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(post.createdAt)}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{estimateReadTime(post.content)} min read</span>
        </div>

        {/* Content */}
        <article className="prose prose-gray max-w-none mb-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>

        {/* Actions */}
        <div className="flex items-center gap-4 py-5 border-t border-b border-gray-100 mb-10">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isLiked
                ? 'bg-red-50 text-red-500 border border-red-100'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
            {post.likes?.length || 0} {isLiked ? 'Liked' : 'Like'}
          </button>
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <MessageCircle className="w-4 h-4" />
            {comments.length} comments
          </span>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
            className="ml-auto flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Comments */}
        <section>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">
            Comments ({comments.length})
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
                <div key={comment.id} className="card p-4 flex gap-3">
                  {comment.authorPhotoURL ? (
                    <img src={comment.authorPhotoURL} className="w-8 h-8 rounded-full shrink-0 object-cover" alt={comment.authorName} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(comment.authorName || 'U')}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
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
