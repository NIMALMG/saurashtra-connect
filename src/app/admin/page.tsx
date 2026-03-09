'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Trash2, Download, Users, BookOpen, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPendingContent, moderateContent, deleteContent, getStats, getAllUsers } from '@/lib/firestore';
import { Word, VoiceRecording, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';

type AdminTab = 'words' | 'recordings' | 'users';

export default function AdminPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('words');
  const [pendingWords, setPendingWords] = useState<Word[]>([]);
  const [pendingRecordings, setPendingRecordings] = useState<VoiceRecording[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalWords: 0, totalPosts: 0, totalMembers: 0, totalRecordings: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || userProfile?.role !== 'admin')) {
      router.push('/');
      return;
    }
    if (userProfile?.role === 'admin') {
      loadData();
    }
  }, [user, userProfile, authLoading]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const pending = await getPendingContent();
      setPendingWords(pending.words);
      setPendingRecordings(pending.recordings);
    } catch (e) {
      console.error('Failed to load pending content:', e);
    }
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
    try {
      const users = await getAllUsers(200);
      setAllUsers(users as User[]);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
    setDataLoading(false);
  };

  const handleModerate = async (collection: string, id: string, action: 'approved' | 'rejected', type: 'word' | 'recording') => {
    try {
      await moderateContent(collection, id, action);
      if (type === 'word') {
        setPendingWords((prev) => prev.filter((w) => w.id !== id));
      } else {
        setPendingRecordings((prev) => prev.filter((r) => r.id !== id));
      }
      toast.success(`${action === 'approved' ? 'Approved' : 'Rejected'} successfully`);
    } catch {
      toast.error('Failed to moderate');
    }
  };

  const handleDelete = async (collection: string, id: string, type: 'user' | 'word' | 'recording') => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteContent(collection, id);
      if (type === 'word') setPendingWords((p) => p.filter((w) => w.id !== id));
      if (type === 'recording') setPendingRecordings((p) => p.filter((r) => r.id !== id));
      toast.success('Deleted successfully');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saurashtra-words-${Date.now()}.csv`;
      a.click();
      toast.success('Dataset exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  if (authLoading || dataLoading) return <div className="pt-16"><FullPageSpinner text="Loading admin panel..." /></div>;

  if (!user || userProfile?.role !== 'admin') {
    return (
      <div className="pt-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-surface">
      {/* Header */}
      <section className="bg-gray-950 text-white py-12">
        <div className="page-container">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-2">
                <Shield className="w-4 h-4" />
                Admin Panel
              </div>
              <h1 className="font-display text-4xl font-bold">Dashboard</h1>
            </div>
            <Button
              variant="secondary"
              onClick={exportCSV}
              icon={<Download className="w-4 h-4" />}
              className="text-gray-900"
            >
              Export Dataset
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Total Words', value: stats.totalWords, icon: <BookOpen className="w-5 h-5" /> },
              { label: 'Recordings', value: stats.totalRecordings, icon: <Mic className="w-5 h-5" /> },
              { label: 'Members', value: stats.totalMembers, icon: <Users className="w-5 h-5" /> },
              { label: 'Pending Review', value: pendingWords.length + pendingRecordings.length, icon: <Shield className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-900 rounded-xl p-4">
                <div className="text-gray-400 mb-2 flex items-center gap-2">{stat.icon} <span className="text-xs">{stat.label}</span></div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="page-container py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {([
            { key: 'words', label: `Words (${pendingWords.length} pending)`, icon: <BookOpen className="w-4 h-4" /> },
            { key: 'recordings', label: `Recordings (${pendingRecordings.length} pending)`, icon: <Mic className="w-4 h-4" /> },
            { key: 'users', label: `Users (${allUsers.length})`, icon: <Users className="w-4 h-4" /> },
          ] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Words Tab */}
        {activeTab === 'words' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
              Pending Word Submissions ({pendingWords.length})
            </h2>
            {pendingWords.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">All caught up! No pending words.</p>
              </div>
            ) : (
              pendingWords.map((word) => (
                <div key={word.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-xl text-primary-600">{word.sauraWord}</h3>
                      <StatusBadge status={word.status} />
                    </div>
                    <div className="text-sm text-gray-600">EN: {word.english} {word.tamil && `| TA: ${word.tamil}`}</div>
                    {word.sentence && <p className="text-xs text-gray-400 mt-1 italic">"{word.sentence}"</p>}
                    <p className="text-xs text-gray-400 mt-1">by {word.authorName} · {formatDate(word.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleModerate('words', word.id, 'approved', 'word')}
                      icon={<CheckCircle className="w-3.5 h-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleModerate('words', word.id, 'rejected', 'word')}
                      icon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete('words', word.id, 'word')}
                      icon={<Trash2 className="w-3.5 h-3.5 text-gray-400" />}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Recordings Tab */}
        {activeTab === 'recordings' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
              Pending Recording Submissions ({pendingRecordings.length})
            </h2>
            {pendingRecordings.length === 0 ? (
              <div className="card p-10 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">No pending recordings.</p>
              </div>
            ) : (
              pendingRecordings.map((rec) => (
                <div key={rec.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{rec.phrase}</h3>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="text-sm text-gray-600">{rec.translation}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {rec.ageGroup} · {rec.region} · by {rec.authorName} · {formatDate(rec.createdAt)}
                    </p>
                    {rec.audioURL && (
                      <audio controls className="mt-2 h-8 w-full max-w-xs" src={rec.audioURL} />
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="secondary" className="text-green-600 border-green-200"
                      onClick={() => handleModerate('voiceRecordings', rec.id, 'approved', 'recording')}
                      icon={<CheckCircle className="w-3.5 h-3.5" />}
                    >Approve</Button>
                    <Button size="sm" variant="secondary" className="text-red-500 border-red-200"
                      onClick={() => handleModerate('voiceRecordings', rec.id, 'rejected', 'recording')}
                      icon={<XCircle className="w-3.5 h-3.5" />}
                    >Reject</Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => handleDelete('voiceRecordings', rec.id, 'recording')}
                      icon={<Trash2 className="w-3.5 h-3.5 text-gray-400" />}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">All Members ({allUsers.length})</h2>
            <div className="card overflow-hidden border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Contributions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{u.displayName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                        {u.joinedAt ? formatDate(u.joinedAt) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary-600">
                        {u.contributionCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
