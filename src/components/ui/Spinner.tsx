import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export function Spinner({ size = 'md', className, text }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary-500', sizeMap[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function FullPageSpinner({ text = 'Loading...' }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" text={text} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>
    </div>
  );
}
