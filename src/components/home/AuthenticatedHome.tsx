'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import PostCard from '@/components/PostCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPosts, getApprovedWords } from '@/lib/firestore';
import { Post, Word } from '@/types';
import { SkeletonCard } from '@/components/ui/Spinner';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function AuthenticatedHome() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [wordOfTheDay, setWordOfTheDay] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'foryou' | 'latest'>('foryou');

  useEffect(() => {
    Promise.all([
      getPosts(10).catch(() => ({ posts: [], lastVisible: undefined })),
      getDocs(collection(db, 'words')).catch(() => null)
    ]).then(([postsResult, snapshot]) => {
      setPosts(postsResult.posts);
      if (snapshot && !snapshot.empty) {
        const wordsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Word);
        setWordOfTheDay(wordsArray[Math.floor(Math.random() * wordsArray.length)]);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="page-container grid md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_300px] gap-8 py-8 pt-[88px] max-w-screen-xl mx-auto min-h-screen">
        
        {/* Left Sticky Nav - Substack/Medium Style */}
        <div className="hidden md:block w-[240px] shrink-0">
          <LeftSidebar />
        </div>

        {/* Center Feed */}
        <main className="flex-1 w-full max-w-[720px] pb-24 border-x border-transparent">
          
          {/* Tabs Navigation */}
          <div className="flex items-center gap-6 border-b border-[#E5E7EB] mb-8 sticky top-[80px] bg-white z-40 pt-4 pb-2">
            <button 
              onClick={() => setActiveTab('foryou')}
              className={`pb-3 text-[15px] font-medium transition-colors relative ${activeTab === 'foryou' ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              For You
              {activeTab === 'foryou' && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#111827]"></span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('latest')}
              className={`pb-3 text-[15px] font-medium transition-colors relative ${activeTab === 'latest' ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              Latest
              {activeTab === 'latest' && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#111827]"></span>
              )}
            </button>
          </div>

          {/* Word of the Day */}
          {!loading && wordOfTheDay ? (
            <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/30 rounded-xl p-6 my-6 border border-[#BFDBFE] shadow-sm relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-[#2563EB]" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-[#2563EB] text-[13px] font-bold tracking-wide uppercase mb-3">
                  <Sparkles className="w-4 h-4" /> Word of the Day
                </div>
                <h2 className="text-3xl font-display font-bold text-[#111827] mb-4 group-hover:text-[#2563EB] transition-colors">{wordOfTheDay.sauraWord}</h2>
                <div className="flex flex-col gap-1.5 mb-6">
                  <p className="text-[15px] text-[#4B5563]"><span className="font-semibold text-[#111827]">English:</span> {wordOfTheDay.english}</p>
                  <p className="text-[15px] text-[#4B5563]"><span className="font-semibold text-[#111827]">Tamil:</span> {wordOfTheDay.tamil}</p>
                  {wordOfTheDay.sentence && (
                    <p className="text-[14px] text-[#6B7280] italic mt-2 border-l-2 border-[#BFDBFE] pl-3">"{wordOfTheDay.sentence}"</p>
                  )}
                </div>
                <Link href="/contribute" className="inline-flex items-center gap-1.5 bg-white text-[#2563EB] text-[13px] font-semibold px-4 py-2 rounded-full border border-[#93C5FD] hover:bg-[#EFF6FF] transition-colors shadow-sm">
                  Contribute a New Word <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : null}

          {/* Posts List */}
          <div className="flex flex-col">
            {loading ? (
              <div className="flex flex-col gap-8">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-24 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] mt-4">
                <p className="text-[#6B7280] text-lg font-serif">No stories found in your feed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sticky Discovery Sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
