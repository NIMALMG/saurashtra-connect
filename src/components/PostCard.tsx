import Link from 'next/link';
import { Heart, MessageCircle, Clock, Tag } from 'lucide-react';
import { Post } from '@/types';
import { formatDate, generateExcerpt, estimateReadTime, getInitials } from '@/lib/utils';
import { Badge } from './ui/Badge';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const excerpt = post.excerpt || generateExcerpt(post.content);

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="card h-full flex flex-col p-6 group-hover:shadow-lg transition-all duration-300 border border-gray-100">
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="primary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-display font-bold text-gray-900 text-xl mb-2 group-hover:text-primary-600 transition-colors leading-snug">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">
          {excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            {post.authorPhotoURL ? (
              <img
                src={post.authorPhotoURL}
                alt={post.authorName}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold">
                {getInitials(post.authorName || 'U')}
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-700">{post.authorName}</p>
              <p className="text-[10px] text-gray-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <span className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {post.readTime || estimateReadTime(post.content)} min
            </span>
            <span className="flex items-center gap-1 text-xs">
              <Heart className="w-3 h-3" />
              {post.likes?.length || 0}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
