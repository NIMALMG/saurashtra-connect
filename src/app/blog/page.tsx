'use client';

import { useState, useEffect } from 'react';
import { PenSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getPosts } from '@/lib/firestore';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';
import { SkeletonCard } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filtered, setFiltered] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    getPosts(100)
      .then(({ posts }) => {
        setPosts(posts);
        setFiltered(posts);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || []))).slice(0, 12);

  const handleSearch = (query: string) => {
    const lower = query.toLowerCase();
    const result = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.excerpt?.toLowerCase().includes(lower) ||
        p.tags?.some((t) => t.toLowerCase().includes(lower))
    );
    setFiltered(activeTag ? result.filter((p) => p.tags?.includes(activeTag)) : result);
    setCurrentPage(1);
  };

  const handleTagFilter = (tag: string) => {
    const newTag = tag === activeTag ? '' : tag;
    setActiveTag(newTag);
    setFiltered(newTag ? posts.filter((p) => p.tags?.includes(newTag)) : posts);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="pt-16 bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header */}
      <section className="bg-white border-b border-[#E5E7EB] py-16 shadow-sm">
        <div className="page-container max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-md mb-4 border border-[#BFDBFE]">
                <BookOpen className="w-3.5 h-3.5" /> Community Blog
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-[#111827] tracking-tight">Stories &amp; Insights</h1>
              <p className="text-[#6B7280] mt-3 text-lg">
                Stories, research, and reflections from the Saurashtra community.
              </p>
            </div>
            {user && (
              <Link href="/blog/new" className="btn-primary shrink-0 shadow-sm">
                <PenSquare className="w-4 h-4" />
                Write a Post
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="page-container py-10 max-w-7xl">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <SearchBar
            placeholder="Search posts, topics..."
            onSearch={handleSearch}
            className="flex-1"
          />
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mb-8">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-[#2563EB] border border-[#2563EB] text-white shadow-sm'
                    : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] shadow-sm'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mt-4">
            <BookOpen className="w-14 h-14 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#111827] mb-2">No posts found</h3>
            <p className="text-[#6B7280] mb-8">Be the first to share a story!</p>
            {user && (
              <Link href="/blog/new" className="btn-primary shadow-sm">
                Write the First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-12"
        />
      </div>
    </div>
  );
}
