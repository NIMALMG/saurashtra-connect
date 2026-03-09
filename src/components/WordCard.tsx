import { BookOpen, Volume2, Globe } from 'lucide-react';
import { Word } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from './ui/Badge';

interface WordCardProps {
  word: Word;
}

export default function WordCard({ word }: WordCardProps) {
  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-2xl text-primary-600 leading-tight">
            {word.sauraWord}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{formatDate(word.createdAt)}</p>
        </div>
        {word.audioURL && (
          <button
            onClick={() => new Audio(word.audioURL).play()}
            className="w-9 h-9 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center hover:bg-primary-100 transition-colors group-hover:scale-110"
            title="Play pronunciation"
            aria-label="Play pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Meanings */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400 font-medium w-14 shrink-0">English</span>
          <span className="text-sm text-gray-700 font-medium">{word.english}</span>
        </div>
        {word.tamil && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 font-medium w-14 shrink-0">Tamil</span>
            <span className="text-sm text-gray-700 font-medium">{word.tamil}</span>
          </div>
        )}
      </div>

      {/* Example Sentence */}
      {word.sentence && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-gray-400 mb-1 font-medium">Example</p>
          <p className="text-sm text-gray-600 italic">"{word.sentence}"</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">by {word.authorName}</span>
        <Badge variant={word.status === 'approved' ? 'success' : 'warning'} className="text-[10px]">
          {word.status}
        </Badge>
      </div>
    </div>
  );
}
