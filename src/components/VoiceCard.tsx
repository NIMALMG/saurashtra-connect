'use client';

import { MapPin, Users } from 'lucide-react';
import { VoiceRecording } from '@/types';
import { formatDate, formatName } from '@/lib/utils';
import { Badge } from './ui/Badge';

interface VoiceCardProps {
  recording: VoiceRecording;
}

export default function VoiceCard({ recording }: VoiceCardProps) {
  // Extract initials for the avatar
  const initials = recording.authorName
    ? formatName(recording.authorName).substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col gap-4">
      
      {/* Top Meta info */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight mb-1 truncate">
            {recording.phrase}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">{recording.translation}</p>
        </div>
        <Badge variant={recording.status === 'approved' ? 'success' : 'warning'} className="text-[10px] shrink-0">
          {recording.status}
        </Badge>
      </div>

      {/* Native Audio Player */}
      <div className="w-full">
        {recording.audioURL && (
          <audio controls className="w-full h-10 rounded-md bg-gray-50 outline-none">
            <source src={recording.audioURL} />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full text-gray-500">
          <MapPin className="w-3.5 h-3.5" /> {recording.region || 'Unknown region'}
        </span>
        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full text-gray-500">
          <Users className="w-3.5 h-3.5" /> {recording.ageGroup}
        </span>
      </div>

      {/* Author and Date Footer */}
      <div className="mt-1 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Speaker Avatar */}
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <p className="font-semibold text-gray-900 text-sm truncate">
            {formatName(recording.authorName)}
          </p>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {formatDate(recording.createdAt)}
        </span>
      </div>

    </div>
  );
}
