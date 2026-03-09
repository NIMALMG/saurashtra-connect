'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Upload, Mic, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { addWord } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema = z.object({
  sauraWord: z.string().min(1, 'Saurashtra word is required').max(100),
  english: z.string().min(1, 'English meaning is required').max(200),
  tamil: z.string().max(200).optional(),
  sentence: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContributePage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be less than 10MB');
      return;
    }
    setAudioFile(file);
  };

  const onSubmit = async (data: FormData) => {
    if (!user || !userProfile) {
      toast.error('Please sign in to contribute');
      router.push('/join');
      return;
    }

    setUploading(true);
    try {
      let audioURL = '';

      if (audioFile) {
        const storageRef = ref(storage, `word-audio/${user.uid}/${Date.now()}-${audioFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, audioFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            },
            reject,
            async () => {
              audioURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      await addWord({
        sauraWord: data.sauraWord,
        english: data.english,
        tamil: data.tamil || '',
        sentence: data.sentence || '',
        audioURL,
        authorId: user.uid,
        authorName: userProfile.displayName,
      });

      setSubmitted(true);
      reset();
      setAudioFile(null);
      setUploadProgress(0);
      toast.success('Word submitted for review!');
    } catch (err) {
      toast.error('Failed to submit word. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center card p-10 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to Contribute</h2>
          <p className="text-gray-500 mb-6">Join the community to submit Saurashtra words to our dictionary.</p>
          <Link href="/join" className="btn-primary">Join Community</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pt-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center card p-10 max-w-md mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Word Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Thank you for contributing! Your word will be reviewed by our admins and published soon.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
            <Link href="/contribute" className="btn-secondary" onClick={() => setSubmitted(false)}>View Dictionary</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-surface">
      {/* Header */}
      <section className="bg-cultural-gradient py-16">
        <div className="page-container max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-primary-600 text-sm font-medium mb-3">
            <BookOpen className="w-4 h-4" />
            Dictionary Contribution
          </div>
          <h1 className="font-display text-5xl font-bold text-gray-900 mb-3">Contribute a Word</h1>
          <p className="text-gray-500 text-lg">
            Help grow the Saurashtra dictionary. Every word brings us closer to preserving our language.
          </p>
        </div>
      </section>

      <div className="page-container max-w-2xl py-10">
        <div className="card p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Saurashtra Word *"
              placeholder="Enter the word in Saurashtra..."
              error={errors.sauraWord?.message}
              hint="Write in Roman or native script"
              {...register('sauraWord')}
            />

            <Input
              label="Meaning in English *"
              placeholder="English translation or meaning"
              error={errors.english?.message}
              {...register('english')}
            />

            <Input
              label="Meaning in Tamil"
              placeholder="தமிழ் பொருள் (optional)"
              error={errors.tamil?.message}
              {...register('tamil')}
            />

            <Textarea
              label="Example Sentence"
              placeholder="An example sentence using this word (optional)"
              rows={3}
              error={errors.sentence?.message}
              {...register('sentence')}
            />

            {/* Audio Upload */}
            <div>
              <label className="label">Pronunciation Audio (Optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  audioFile ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {audioFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <Mic className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-medium text-primary-700">{audioFile.name}</p>
                      <p className="text-xs text-primary-500">{(audioFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                      className="text-xs text-red-400 hover:text-red-600 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload audio recording</p>
                    <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A up to 10MB</p>
                  </>
                )}
              </div>

              {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading audio...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-700">
                <strong>Review Process:</strong> All submissions are reviewed by community admins before publishing. 
                This usually takes 1-2 days. Thank you for your contribution!
              </p>
            </div>

            <Button type="submit" loading={uploading} className="w-full" size="lg">
              Submit Word for Review
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
