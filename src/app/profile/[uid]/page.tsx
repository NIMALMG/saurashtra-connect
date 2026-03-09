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
import { FullPageSpinner } from '@/components/ui/Spinner';
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

  if (loading) return <div className="pt-16"><FullPageSpinner text="Loading profile..." /></div>;
  if (!profile) return (
    <div className="pt-24 text-center min-h-[60vh]">
      <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
    </div>
  );

  const tabs = [
    { key: 'posts', label: 'Blog Posts', icon: <FileText className="w-4 h-4" />, count: contributions?.posts.length || 0 },
    { key: 'words', label: 'Words', icon: <BookOpen className="w-4 h-4" />, count: contributions?.words.length || 0 },
    { key: 'recordings', label: 'Recordings', icon: <Mic className="w-4 h-4" />, count: contributions?.recordings.length || 0 },
  ];

  const showPhoto = profile?.photoURL && !imgError;

  return (
    <div className="pt-16 bg-surface">
      {/* Profile Header */}
      <section className="bg-cultural-gradient py-16">
        <div className="page-container max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              {showPhoto ? (
                <img
                  src={profile!.photoURL}
                  alt={profile!.displayName}
                  onError={() => setImgError(true)}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">
                  {getInitials(profile!.displayName)}
                </div>
              )}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                  title="Edit profile"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                </Link>
              )}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                <h1 className="font-display font-bold text-3xl text-gray-900">{profile.displayName}</h1>
                {profile.role === 'admin' && (
                  <Badge variant="primary">Admin</Badge>
                )}
              </div>
              {profile.bio && <p className="text-gray-500 mb-3 max-w-sm">{profile.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 justify-center sm:justify-start">
                {profile.region && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{profile.region}</span>
                )}
                {profile.joinedAt && (
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {formatDate(profile.joinedAt)}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-accent-500" />
                  {profile.contributionCount || 0} contributions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container max-w-4xl py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {tabs.map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon}
              {label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === key ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          contributions?.posts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No blog posts yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {contributions?.posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          )
        )}
        {activeTab === 'words' && (
          contributions?.words.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No words contributed yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {contributions?.words.map((word) => <WordCard key={word.id} word={word} />)}
            </div>
          )
        )}
        {activeTab === 'recordings' && (
          contributions?.recordings.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No voice recordings yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {contributions?.recordings.map((r) => <VoiceCard key={r.id} recording={r} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
