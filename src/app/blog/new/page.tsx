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
    <div className="pt-16 bg-surface">
      <div className="page-container max-w-4xl py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">New Post</h1>
            <p className="text-gray-500 mt-1">Share your knowledge with the community</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setPreview(!preview)}
              icon={preview ? <PenSquare className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            >
              {preview ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Post Title"
            placeholder="An engaging title for your post..."
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Tags */}
          <div>
            <label className="label">Tags (up to 5)</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3 ml-1 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                placeholder="Add a tag (press Enter)"
                className="input-field flex-1"
              />
              <Button type="button" variant="secondary" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="label">Content (Markdown supported)</label>
            {preview ? (
              <div className="prose-custom card p-6 min-h-[400px]">
                <h1 className="font-display font-bold text-3xl text-gray-900 mb-4">{titleValue}</h1>
                <ReactMarkdown>{contentValue}</ReactMarkdown>
              </div>
            ) : (
              <Textarea
                placeholder="Write your post in Markdown... Use **bold**, *italic*, # Heading, - lists, etc."
                rows={20}
                error={errors.content?.message}
                hint="Supports full Markdown formatting"
                {...register('content')}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Publish Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
