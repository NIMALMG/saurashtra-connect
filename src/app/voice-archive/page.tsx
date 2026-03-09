'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mic, Upload, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { addVoiceRecording, getVoiceRecordings } from '@/lib/firestore';
import { VoiceRecording } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import VoiceCard from '@/components/VoiceCard';
import SearchBar from '@/components/SearchBar';
import { SkeletonCard } from '@/components/ui/Spinner';
import Link from 'next/link';

const schema = z.object({
  phrase: z.string().min(1, 'Phrase is required').max(200),
  translation: z.string().min(1, 'Translation is required').max(200),
  ageGroup: z.enum(['child', 'teen', 'adult', 'senior']),
  region: z.string().min(1, 'Region is required').max(100),
});

type FormData = z.infer<typeof schema>;

const AGE_GROUPS = [
  { value: 'child', label: 'Child (0-12)' },
  { value: 'teen', label: 'Teen (13-19)' },
  { value: 'adult', label: 'Adult (20-59)' },
  { value: 'senior', label: 'Senior (60+)' },
];

export default function VoiceArchivePage() {
  const { user, userProfile } = useAuth();
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [filtered, setFiltered] = useState<VoiceRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ageGroup: 'adult' },
  });

  useEffect(() => {
    getVoiceRecordings()
      .then((data) => { setRecordings(data); setFiltered(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (query: string) => {
    const lower = query.toLowerCase();
    setFiltered(
      recordings.filter(
        (r) =>
          r.phrase.toLowerCase().includes(lower) ||
          r.translation.toLowerCase().includes(lower) ||
          r.region.toLowerCase().includes(lower)
      )
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!user || !userProfile) {
      toast.error('Please sign in to upload');
      return;
    }
    if (!audioFile) {
      toast.error('Please select an audio file');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `voice-recordings/${user.uid}/${Date.now()}-${audioFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, audioFile);

      const audioURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          reject,
          async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
      });

      await addVoiceRecording({
        phrase: data.phrase,
        translation: data.translation,
        ageGroup: data.ageGroup,
        region: data.region,
        audioURL,
        audioName: audioFile.name,
        authorId: user.uid,
        authorName: userProfile.displayName,
      });

      setSubmitted(true);
      reset();
      setAudioFile(null);
      setUploadProgress(0);
      toast.success('Recording submitted for review!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pt-16 bg-surface">
      {/* Header */}
      <section className="bg-cultural-gradient py-16">
        <div className="page-container max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary-600 text-sm font-medium mb-3">
                <Mic className="w-4 h-4" />
                Voice Archive
              </div>
              <h1 className="font-display text-5xl font-bold text-gray-900 mb-3">Voice Archive</h1>
              <p className="text-gray-500 text-lg max-w-md">
                Listen to native Saurashtra speakers or add your own voice to our growing archive.
              </p>
            </div>
            {user && !showForm && (
              <Button onClick={() => setShowForm(true)} icon={<Upload className="w-4 h-4" />}>
                Upload Recording
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="page-container max-w-4xl py-10">
        {/* Upload Form */}
        {showForm && user && (
          <div className="card p-8 mb-10 border border-gray-100">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold text-xl text-gray-900 mb-2">Recording Submitted!</h3>
                <p className="text-gray-500 mb-5">It will be reviewed and published soon.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setSubmitted(false); setShowForm(false); }}>
                    View Archive
                  </Button>
                  <Button variant="secondary" onClick={() => setSubmitted(false)}>
                    Submit Another
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-2xl text-gray-900">Upload a Recording</h2>
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                </div>

                <Input
                  label="Phrase or Sentence *"
                  placeholder="The phrase spoken in Saurashtra"
                  error={errors.phrase?.message}
                  {...register('phrase')}
                />
                <Input
                  label="Translation *"
                  placeholder="English translation of the phrase"
                  error={errors.translation?.message}
                  {...register('translation')}
                />
                <Input
                  label="Your Region *"
                  placeholder="e.g. Madurai, Salem, Chennai"
                  error={errors.region?.message}
                  {...register('region')}
                />
                <div>
                  <label className="label">Speaker Age Group *</label>
                  <select
                    className="input-field"
                    {...register('ageGroup')}
                  >
                    {AGE_GROUPS.map((ag) => (
                      <option key={ag.value} value={ag.value}>{ag.label}</option>
                    ))}
                  </select>
                </div>

                {/* Audio file */}
                <div>
                  <label className="label">Audio File *</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      audioFile ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
                    {audioFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <Mic className="w-5 h-5 text-primary-500" />
                        <span className="text-sm font-medium text-primary-700">{audioFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setAudioFile(null); }} className="text-xs text-red-400">Remove</button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to select audio recording</p>
                        <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A — Max 50MB</p>
                      </>
                    )}
                  </div>
                  {uploading && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Uploading...</span><span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" loading={uploading} className="w-full" size="lg">
                  Submit Recording
                </Button>
              </form>
            )}
          </div>
        )}

        {!user && (
          <div className="card p-6 mb-8 text-center bg-primary-50 border border-primary-100">
            <p className="text-primary-700 mb-3 font-medium">Join the community to add your voice</p>
            <Link href="/join" className="btn-primary">Join Community</Link>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <SearchBar placeholder="Search phrases, translations, regions..." onSearch={handleSearch} />
        </div>

        {/* Recordings Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mic className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No recordings yet</h3>
            <p className="text-gray-400">Be the first to add your voice to the archive!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((recording) => (
              <VoiceCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
