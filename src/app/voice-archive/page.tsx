'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mic, Upload, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getVoiceRecordings } from '@/lib/firestore';
import { VoiceRecording } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import VoiceCard from '@/components/VoiceCard';
import VoiceRecorder from '@/components/VoiceRecorder';
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
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Local state to hold form data before recording starts
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ageGroup: 'adult' },
  });

  useEffect(() => {
    getVoiceRecordings()
      .then((data) => { setRecordings(data); setFiltered(data); })
      .catch((e) => console.error('Error fetching voice recordings:', e))
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

  // When users click 'Next' on the text form, they are shown the VoiceRecorder
  const onProceedToRecord = (data: FormData) => {
    if (!user || !userProfile) {
      toast.error('Please sign in to upload');
      return;
    }
    setCurrentFormData(data);
  };

  const handleRecordingSuccess = () => {
    setSubmitted(true);
    setCurrentFormData(null);
    reset();
    
    // Refresh the list immediately to show the new Azure link
    getVoiceRecordings().then(data => {
      setRecordings(data);
      setFiltered(data);
    });
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
            ) : currentFormData ? (
              // STEP 2: Record Voice via new Azure component
              <div className="py-2">
                <VoiceRecorder 
                  phrase={currentFormData.phrase}
                  translation={currentFormData.translation}
                  ageGroup={currentFormData.ageGroup}
                  region={currentFormData.region}
                  onSuccess={handleRecordingSuccess}
                  onCancel={() => setCurrentFormData(null)}
                />
              </div>
            ) : (
              // STEP 1: Capture phrase metadata
              <form onSubmit={handleSubmit(onProceedToRecord)} className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-2xl text-gray-900">Step 1: Phrase Details</h2>
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

                <Button type="submit" className="w-full text-base py-3" size="lg">
                  Next: Add Audio
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
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No recordings yet. Be the first to contribute!</h3>
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
