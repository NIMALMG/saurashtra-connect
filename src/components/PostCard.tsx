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
    <article className="group block py-8 border-b border-[#E5E7EB] last:border-0 hover:bg-gray-50/50 transition-colors px-4 -mx-4 rounded-2xl sm:px-6 sm:-mx-6">
      {/* Author Row */}
      <div className="flex items-center gap-2.5 mb-3">
        {post.authorPhotoURL ? (
          <img
            src={post.authorPhotoURL}
            alt={post.authorName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-[10px] font-bold">
            {getInitials(post.authorName || 'U')}
          </div>
        )}
        <p className="text-sm text-[#111827] font-medium">{post.authorName}</p>
        <span className="text-gray-400 text-xs">•</span>
        <p className="text-[13px] text-gray-500">{formatDate(post.createdAt)}</p>
      </div>

      <Link href={`/blog/${post.slug}`} className="block mb-4">
        {/* Title */}
        <h2 className="font-display font-bold text-[#111827] text-2xl mb-2 group-hover:text-[#2563EB] transition-colors leading-tight line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-[15px] sm:text-base text-gray-600 leading-[1.6] line-clamp-3 font-serif">
          {excerpt}
        </p>
      </Link>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-4">
          {post.tags?.length > 0 && (
            <div className="hidden sm:flex items-center">
              <span className="bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium px-2.5 py-1 rounded-full">
                {post.tags[0]}
              </span>
            </div>
          )}
          <span className="flex items-center gap-1 text-[13px] text-gray-500">
            {post.readTime || estimateReadTime(post.content)} min read
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1.5 text-[13px] hover:text-[#111827] transition-colors">
            <Heart className="w-4 h-4" />
            {post.likes?.length || 0}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] hover:text-[#111827] transition-colors">
            <MessageCircle className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
