'use client';

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, MapPin, Users } from 'lucide-react';
import { VoiceRecording } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from './ui/Badge';

interface VoiceCardProps {
  recording: VoiceRecording;
}

export default function VoiceCard({ recording }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(recording.audioURL);
      audioRef.current.addEventListener('timeupdate', () => {
        const pct = ((audioRef.current!.currentTime / audioRef.current!.duration) * 100) || 0;
        setProgress(pct);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="flex items-start gap-4">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="shrink-0 w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-sm hover:shadow-md"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Phrase */}
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight mb-0.5">
            {recording.phrase}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{recording.translation}</p>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary-400 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {recording.region || 'Unknown region'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {recording.ageGroup}
            </span>
            <span>{formatDate(recording.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">by {recording.authorName}</span>
        <Badge variant={recording.status === 'approved' ? 'success' : 'warning'} className="text-[10px]">
          {recording.status}
        </Badge>
      </div>
    </div>
  );
}
