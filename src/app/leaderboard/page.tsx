import Link from 'next/link';
import { Trophy, Medal, Star, ShieldCheck } from 'lucide-react';
import { getAllUsers } from '@/lib/firestore'; // Re-use until we add query constraints
import { getInitials, formatName } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

async function getLeaderboard(limitCount = 20): Promise<User[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('score', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
  } catch (err) {
    console.error('Leaderboard query failed, falling back to all users:', err);
    const users = await getAllUsers(limitCount);
    return users.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}

export default async function LeaderboardPage() {
  const users = await getLeaderboard(20);

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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No contributors yet.</div>
          ) : (
            <div className="flex flex-col">
              {users.map((user, index) => {
                const isTop3 = index < 3;
                return (
                  <Link href={`/profile/${user.uid}`} key={user.uid}>
                    <div className="flex items-center p-4 sm:p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <div className="w-8 sm:w-12 text-center shrink-0">
                        {index === 0 && <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto drop-shadow-sm" />}
                        {index === 1 && <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto drop-shadow-sm" />}
                        {index === 2 && <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700 mx-auto drop-shadow-sm" />}
                        {index > 2 && (
                          <span className="text-gray-400 font-bold text-sm sm:text-base">{index + 1}</span>
                        )}
                      </div>

                      <div className="shrink-0 ml-2 sm:ml-4 relative">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={formatName(user.displayName)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-100 transition-all" />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary-100 transition-all text-sm sm:text-base">
                            {getInitials(user.displayName)}
                          </div>
                        )}
                        {user.badges?.includes('community_hero') && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                        )}
                      </div>

                      <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                        <h3 className="text-[15px] sm:text-base font-semibold text-gray-900 truncate">
                          {formatName(user.displayName)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                          {user.badges && user.badges.length > 0 ? (
                            <span className="text-[10px] sm:text-xs text-amber-600 font-medium bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-500 text-amber-500" />
                              {user.badges.length} Badges
                            </span>
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
          )}
        </div>
      </div>
    </div>
  );
}
