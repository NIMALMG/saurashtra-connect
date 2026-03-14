'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BookOpen, Mic, FileText, MapPin, Calendar, Award } from 'lucide-react';
import { getUserProfile, getUserContributions } from '@/lib/firestore';
import { User, Post, Word, VoiceRecording } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import PostCard from '@/components/PostCard';
import WordCard from '@/components/WordCard';
import VoiceCard from '@/components/VoiceCard';
import { FullPageSpinner, SkeletonCard } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Tab = 'posts' | 'words' | 'recordings';

export default function ProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const { user } = useAuth();
  const isOwnProfile = user?.uid === uid;
  const [profile, setProfile] = useState<User | null>(null);
  const [contributions, setContributions] = useState<{ posts: Post[]; words: Word[]; recordings: VoiceRecording[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!uid) return;
    Promise.all([getUserProfile(uid), getUserContributions(uid)])
      .then(([prof, contribs]) => {
        setProfile(prof as User | null);
        setContributions(contribs);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  if (loading) {
    return (
      <div className="pt-24 page-container max-w-4xl min-h-screen flex flex-col">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 mt-4 animate-pulse">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto md:mx-0" />
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto md:mx-0" />
            <div className="flex gap-4 justify-center md:justify-start">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5 flex-grow">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-24 text-center min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500 mt-2">This profile does not exist or has been removed.</p>
        <Link href="/" className="mt-6 btn-primary">Return Home</Link>
      </div>
    );
  }

  const tabs = [
    { key: 'posts', label: 'Blog Posts', icon: <FileText className="w-4 h-4" />, count: contributions?.posts.length || 0 },
    { key: 'words', label: 'Words', icon: <BookOpen className="w-4 h-4" />, count: contributions?.words.length || 0 },
    { key: 'recordings', label: 'Recordings', icon: <Mic className="w-4 h-4" />, count: contributions?.recordings.length || 0 },
  ];

  const showPhoto = profile?.photoURL && !imgError;

  return (
    <div className="pt-16 bg-surface min-h-screen flex flex-col">
      {/* Profile Header */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="page-container max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative shrink-0">
              {showPhoto ? (
                <img
                  src={profile!.photoURL}
                  alt={profile!.displayName}
                  onError={() => setImgError(true)}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-sm">
                  {getInitials(profile!.displayName)}
                </div>
              )}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors z-10"
                  title="Edit profile"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </Link>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1 mt-2 md:mt-0">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="font-display font-semibold text-2xl text-gray-900">{profile.displayName}</h1>
                {profile.role === 'admin' && (
                  <Badge variant="primary" className="text-xs shadow-sm">Admin</Badge>
                )}
              </div>
              {profile.bio && <p className="text-gray-500 mb-3 max-w-md mx-auto md:mx-0 text-sm leading-relaxed">{profile.bio}</p>}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mt-2">
                {profile.region && (
                  <span className="flex items-center gap-1.5 font-medium"><MapPin className="w-4 h-4 text-gray-400" />{profile.region}</span>
                )}
                {profile.joinedAt && (
                  <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-4 h-4 text-gray-400" />Joined {formatDate(profile.joinedAt)}</span>
                )}
                <span className="flex items-center gap-1.5 font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md">
                  <Award className="w-4 h-4 text-primary-500" />
                  {profile.contributionCount || 0} Total Contributions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container max-w-4xl py-6 md:py-8 flex-grow flex flex-col px-4 md:px-0 mx-auto w-full">
        {/* Scrollable Tabs */}
        <div className="w-full overflow-x-auto pb-4 mb-6 custom-scrollbar">
          <div className="flex gap-2 w-fit min-w-min border-b border-gray-200 pb-1">
            {tabs.map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as Tab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all shrink-0 min-w-[120px] justify-center relative ${
                  activeTab === key
                    ? 'text-gray-900 bg-white shadow-md rounded-t-xl border border-gray-200 border-b-0 -mb-[1px] z-10'
                    : 'text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-t-xl border border-transparent hover:text-gray-800'
                }`}
              >
                {icon}
                {label}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-1 ${activeTab === key ? 'bg-primary-50 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          contributions?.posts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No blog posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-8">
              {contributions?.posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          )
        )}
        {activeTab === 'words' && (
          contributions?.words.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No words contributed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-8">
              {contributions?.words.map((word) => <WordCard key={word.id} word={word} />)}
            </div>
          )
        )}
        {activeTab === 'recordings' && (
          contributions?.recordings.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No voice recordings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-8">
              {contributions?.recordings.map((r) => <VoiceCard key={r.id} recording={r} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
