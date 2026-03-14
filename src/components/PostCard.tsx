import Link from 'next/link';
import { Heart, MessageCircle, Clock, Tag } from 'lucide-react';
import { Post } from '@/types';
import { formatDate, generateExcerpt, estimateReadTime, getInitials, formatName } from '@/lib/utils';
import { Badge } from './ui/Badge';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const excerpt = post.excerpt || generateExcerpt(post.content);

  return (
    <article className="group block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:-translate-y-1 hover:shadow-lg transition duration-200">
      {/* Author Row */}
      <div className="flex items-center gap-2.5 mb-3">
        {post.authorPhotoURL ? (
          <img
            src={post.authorPhotoURL}
            alt={post.authorName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-bold">
            {getInitials(formatName(post.authorName) || 'U')}
          </div>
        )}
        <p className="text-sm text-[#111827] font-medium">{formatName(post.authorName)}</p>
        <span className="text-gray-400 text-xs">•</span>
        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
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
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50/50">
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
