'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Star, ShieldCheck } from 'lucide-react';
import { getInitials, formatName, BADGE_CONFIG } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('score', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      const liveUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() } as User));
      setUsers(liveUsers);
      setLoading(false);
    }, (err) => {
      console.error('Leaderboard realtime sync failed:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <div className="pt-24 min-h-screen bg-surface flex flex-col">
      <div className="page-container max-w-3xl mx-auto px-4 w-full flex-grow">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl mb-4 shadow-sm">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">Community Leaderboard</h1>
          <p className="text-gray-500 max-w-lg mx-auto mb-2 text-sm sm:text-base">
            Celebrating the top contributors helping to preserve and grow the Saurashtra language.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-gray-400 mt-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 3 pts / Blog</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> 2 pts / Audio</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 1 pt / Word</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-40 bg-gray-100 rounded-2xl w-full"></div>
            <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
            <div className="h-20 bg-gray-100 rounded-2xl w-full"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            No contributors yet.
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
              {[1, 0, 2].map((orderedIndex) => {
                const user = top3[orderedIndex];
                if (!user) return null;
                const rank = orderedIndex + 1;
                const displayName = formatName(user.displayName, user.email);
                const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

                let cardClasses = "bg-white border-gray-100";
                let rankIcon = null;
                if (rank === 1) {
                    cardClasses = "bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/5 backdrop-blur-lg border border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/20 scale-105 z-10 ring-1 ring-[#FFD700]/40 transition-all duration-300 hover:shadow-[#FFD700]/50 hover:-translate-y-2 hover:scale-110";
                    rankIcon = "🥇";
                } 
                else if (rank === 2) {
                    cardClasses = "bg-gradient-to-br from-[#C0C0C0]/25 to-[#C0C0C0]/5 backdrop-blur-lg border border-[#C0C0C0]/40 shadow-lg shadow-[#C0C0C0]/20 transition-all duration-300 hover:shadow-[#C0C0C0]/50 hover:-translate-y-2 hover:scale-105";
                    rankIcon = "🥈";
                 } 
                else if (rank === 3) {
                    cardClasses = "bg-gradient-to-br from-[#CD7F32]/25 to-[#CD7F32]/5 backdrop-blur-lg border border-[#CD7F32]/40 shadow-lg shadow-[#CD7F32]/20 transition-all duration-300 hover:shadow-[#CD7F32]/50 hover:-translate-y-2 hover:scale-105";
                    rankIcon = "🥉";
                }
                

                return (
                  <Link href={`/profile/${user.uid}`} key={user.uid} className={`block rounded-2xl p-6 text-center transition-transform hover:-translate-y-1 ${cardClasses}`}>
                    <div className="relative inline-block mb-3">
                      <img src={avatarUrl} alt={displayName} className={`w-20 h-20 mx-auto rounded-full object-cover ring-4 ${rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-gray-300' : 'ring-amber-300'}`} />
                      {user.badges?.includes('language_guardian') && (
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                          <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-2 flex items-center justify-center gap-2">
                      <span className="text-2xl">{rankIcon}</span> {displayName}
                    </h3>
                    
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 min-h-[24px]">
                      {user.badges && user.badges.length > 0 ? (
                        user.badges.map(b => BADGE_CONFIG[b] ? (
                          <span key={b} className="text-lg" title={BADGE_CONFIG[b].label}>{BADGE_CONFIG[b].icon}</span>
                        ) : null)
                      ) : (
                        <span className="text-xs text-gray-400">Rising Contributor</span>
                      )}
                    </div>
                    
                    <div className="text-xl font-bold text-gray-900">
                      {user.score || 0} <span className="text-sm font-medium text-gray-500">Points</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Remaining Users */}
            {others.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
                <div className="flex flex-col">
                  {others.map((user, index) => {
                    const rank = index + 4;
                    const displayName = formatName(user.displayName, user.email);
                    const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

                    return (
                      <Link href={`/profile/${user.uid}`} key={user.uid}>
                        <div className="flex items-center p-4 sm:p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                          <div className="w-8 sm:w-12 text-center shrink-0">
                            <span className="text-gray-400 font-bold text-sm sm:text-base">{rank}</span>
                          </div>

                          <div className="shrink-0 ml-2 sm:ml-4 relative">
                            <img src={avatarUrl} alt={displayName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-100 transition-all" />
                            {user.badges?.includes('language_guardian') && (
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                              </div>
                            )}
                          </div>

                          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                            <h3 className="text-[15px] sm:text-base font-semibold text-gray-900 truncate">
                              {displayName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {user.badges && user.badges.length > 0 ? (
                                user.badges.map(b => BADGE_CONFIG[b] ? (
                                  <span key={b} className="text-[11px] sm:text-xs text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-md flex items-center gap-1" title={BADGE_CONFIG[b].label}>
                                    {BADGE_CONFIG[b].icon} <span className="hidden sm:inline">{BADGE_CONFIG[b].label}</span>
                                  </span>
                                ) : null)
                              ) : (
                                <span className="text-[11px] sm:text-xs text-gray-400">Rising Contributor</span>
                              )}
                            </div>
                          </div>

                          <div className="ml-2 sm:ml-4 text-right shrink-0">
                            <div className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                              {user.score || 0}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                              Points
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
