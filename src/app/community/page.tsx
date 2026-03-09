'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, Award, Calendar, Search } from 'lucide-react';
import { getAllUsers } from '@/lib/firestore';
import { User } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { SkeletonCard } from '@/components/ui/Spinner';
import Link from 'next/link';

function MemberAvatar({ member }: { member: User }) {
  const [imgError, setImgError] = useState(false);
  const showImg = member.photoURL && !imgError;
  return showImg ? (
    <img
      src={member.photoURL}
      alt={member.displayName}
      onError={() => setImgError(true)}
      className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-sm"
    />
  ) : (
    <div className="w-20 h-20 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-sm">
      {getInitials(member.displayName)}
    </div>
  );
}

export default function CommunityPage() {
  const [members,  setMembers]  = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    getAllUsers(100)
      .then((data) => {
        const valid = (data as User[]).filter((m) => m.displayName?.trim());
        setMembers(valid);
        setFiltered(valid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const lower = query.toLowerCase();
    setFiltered(
      members.filter(
        (m) =>
          m.displayName?.toLowerCase().includes(lower) ||
          m.region?.toLowerCase().includes(lower) ||
          m.bio?.toLowerCase().includes(lower),
      ),
    );
  }, [query, members]);

  return (
    <div className="pt-16 bg-[#F8FAFC] min-h-screen pb-20">
      {/* Hero Header */}
      <section className="bg-white border-b border-[#E5E7EB] py-16 text-center shadow-sm relative z-10">
        <div className="page-container max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#BFDBFE]">
            <Users className="w-3.5 h-3.5" /> Community Directory
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#111827] mb-3 tracking-tight">
            Meet the Builders
          </h1>
          <p className="text-[#6B7280] text-lg">
            <span className="text-[#2563EB] font-semibold">{members.length}</span> members preserving the language together.
          </p>
        </div>
      </section>

      {/* Search bar */}
      <div className="bg-[#F8FAFC]/80 backdrop-blur-md border-b border-[#E5E7EB] py-6 sticky top-16 z-30 shadow-sm">
        <div className="page-container max-w-4xl">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by name, region, or bio..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all shadow-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] text-lg leading-none"
              >×</button>
            )}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="page-container max-w-6xl py-12">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm mt-8 relative z-10">
            <Users className="w-14 h-14 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#111827] mb-2">No members found</h3>
            <p className="text-[#6B7280] mb-8">
              {query ? `We couldn't find anyone matching "${query}"` : 'Be the first to join!'}
            </p>
            <Link href="/join" className="btn-primary">Join the Community</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {filtered.map((member) => (
              <Link
                key={member.uid}
                href={`/profile/${member.uid}`}
                className="group card flex flex-col relative overflow-hidden bg-white hover:border-[#D1D5DB]"
              >
                {/* Accent stripe */}
                <div className="h-1 bg-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0" />

                <div className="p-6 flex-1 flex flex-col">
                  {/* Avatar + role */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0">
                      <MemberAvatar member={member} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold text-[#111827] text-lg leading-snug truncate group-hover:text-[#2563EB] transition-colors">
                        {member.displayName}
                      </h3>
                      {member.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#2563EB] font-bold bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
                          <Award className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {member.region && (
                        <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                          <span className="truncate">{member.region}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-sm text-[#6B7280] line-clamp-2 mb-4 leading-relaxed flex-1">{member.bio}</p>
                  )}
                  {!member.bio && <div className="flex-1" />}

                  {/* Stats row */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6] mt-auto">
                    <span className="flex items-center gap-1.5 text-xs text-[#4B5563] font-medium">
                      <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                      {member.contributionCount || 0} contribution{member.contributionCount !== 1 ? 's' : ''}
                    </span>
                    {member.joinedAt && (
                      <span className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                        <Calendar className="w-3 h-3" />
                        {formatDate(member.joinedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p className="text-center text-sm text-[#9CA3AF] mt-10">
            Showing {filtered.length} of {members.length} members
          </p>
        )}
      </div>
    </div>
  );
}
