'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, BookOpen, Mic } from 'lucide-react';
import { getApprovedWords, getStats } from '@/lib/firestore';

export default function RightSidebar() {
  const [trendingWords, setTrendingWords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApprovedWords(5).catch(() => []),
      getStats().catch(() => null)
    ]).then(([words, fetchedStats]) => {
      setTrendingWords(words);
      setStats(fetchedStats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-[320px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto pb-8 pl-8 border-l border-[#E5E7EB]/60">
      
      {/* Recommended Topics / Tags */}
      <section className="mb-10">
        <h3 className="font-semibold text-[#111827] text-[15px] mb-4">Recommended topics</h3>
        <div className="flex flex-wrap gap-2">
          {['Culture', 'History', 'Grammar', 'Proverbs', 'Migration'].map(tag => (
            <Link key={tag} href={`/blog?tag=${tag}`} className="bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors text-[#4B5563] text-[13px] font-medium px-3.5 py-1.5 rounded-full">
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Words */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-semibold text-[#111827] text-[15px]">Trending Words</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-[13px] text-[#9CA3AF] animate-pulse">Loading words...</div>
          ) : trendingWords.length > 0 ? trendingWords.map((word, idx) => (
            <Link href="/community" key={word.id} className="group flex flex-col">
              <span className="text-[#111827] font-bold text-[15px] group-hover:text-[#2563EB] transition-colors">{word.sauraWord}</span>
              <span className="text-[#6B7280] text-[13px] line-clamp-1">{word.english} - {word.tamil}</span>
            </Link>
          )) : (
            <div className="text-[13px] text-[#6B7280] italic">No words yet. Be the first contributor.</div>
          )}
        </div>
      </section>

      {/* Community Pulse Component */}
      <section className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 mb-8">
        <h3 className="font-bold text-[#111827] text-[15px] mb-4 border-b border-[#E5E7EB] pb-3">Community Pulse</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          {loading ? (
            <div className="col-span-2 text-[13px] text-[#9CA3AF] animate-pulse">Loading stats...</div>
          ) : (
            <>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 text-[#6B7280] text-xs font-medium"><Users className="w-3.5 h-3.5" /> Members</span>
                <span className="text-[#111827] font-bold text-lg mt-0.5">{stats?.totalMembers || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 text-[#6B7280] text-xs font-medium"><BookOpen className="w-3.5 h-3.5" /> Words</span>
                <span className="text-[#111827] font-bold text-lg mt-0.5">{stats?.totalWords || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 text-[#6B7280] text-xs font-medium"><Mic className="w-3.5 h-3.5" /> Voices</span>
                <span className="text-[#111827] font-bold text-lg mt-0.5">{stats?.totalRecordings || 0}</span>
              </div>
              <div className="flex flex-col items-start justify-center">
                <Link href="/about" className="text-[#2563EB] text-[13px] font-semibold hover:underline">View All Stats</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer Links (Mini) */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[#9CA3AF]">
        <Link href="/about" className="hover:text-[#4B5563] transition-colors">About</Link>
        <Link href="#" className="hover:text-[#4B5563] transition-colors">Help</Link>
        <Link href="#" className="hover:text-[#4B5563] transition-colors">Terms</Link>
        <Link href="#" className="hover:text-[#4B5563] transition-colors">Privacy</Link>
      </div>

    </aside>
  );
}
