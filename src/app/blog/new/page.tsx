'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PenSquare, Eye, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { addPost } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { slugify, generateExcerpt, estimateReadTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { serverTimestamp } from 'firebase/firestore';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewPostPage() {
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const contentValue = watch('content', '');
  const titleValue = watch('title', '');

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = async (data: FormData) => {
    if (!user || !userProfile) {
      toast.error('Please sign in to publish a post');
      router.push('/join');
      return;
    }

    setLoading(true);
    try {
      const slug = slugify(data.title) + '-' + Date.now().toString(36);
      await addPost({
        title: data.title,
        slug,
        content: data.content,
        excerpt: generateExcerpt(data.content),
        authorId: user.uid,
        authorName: userProfile.displayName,
        authorPhotoURL: userProfile.photoURL || '',
        tags,
        likes: [],
        status: 'published',
        readTime: estimateReadTime(data.content),
      });
      toast.success('Post published successfully!');
      router.push('/blog');
    } catch (err) {
      toast.error('Failed to publish post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-24 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sign in to write</h2>
          <p className="text-gray-500 mb-6">You need to be signed in to create a blog post.</p>
          <Button onClick={() => router.push('/join')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 bg-white min-h-screen">
      {/* Top Navigation Bar */}
      <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
        <div className="page-container max-w-[720px] mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="font-medium text-[#111827]">Draft</span>
            <span>in {userProfile?.displayName || 'Saurashtra Connect'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-container max-w-[720px] mx-auto py-10 sm:py-16">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <input
            type="text"
            placeholder="Title"
            className="w-full text-[40px] sm:text-[48px] font-display font-bold text-[#111827] placeholder:text-[#D1D5DB] border-none outline-none bg-transparent leading-tight focus:ring-0 px-0"
            {...register('title')}
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}

          {/* Tags */}
          <div className="py-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[13px] font-medium"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    addTag(); 
                  }
                }}
                placeholder={tags.length === 0 ? "Add tags (press Enter)..." : "Add another tag..."}
                className="w-full text-[15px] text-[#4B5563] placeholder:text-[#9CA3AF] border-none outline-none bg-transparent focus:ring-0 px-0"
              />
            )}
          </div>

          {/* Content */}
          <div className="mt-8">
            {preview ? (
              <div className="prose prose-lg prose-gray max-w-none font-serif leading-[1.8] text-[#374151] prose-headings:font-display prose-headings:font-bold prose-headings:text-[#111827] prose-a:text-[#2563EB] min-h-[400px]">
                <ReactMarkdown>{contentValue}</ReactMarkdown>
              </div>
            ) : (
              <div>
                <textarea
                  placeholder="Tell your story..."
                  className="w-full text-lg sm:text-xl font-serif leading-[1.8] text-[#374151] placeholder:text-[#D1D5DB] border-none outline-none bg-transparent focus:ring-0 px-0 resize-y min-h-[50vh]"
                  {...register('content')}
                />
                {errors.content && <p className="text-red-500 text-sm mt-2">{errors.content.message}</p>}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
