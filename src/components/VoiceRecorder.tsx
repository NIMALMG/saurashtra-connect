'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mic, Square, Play, Pause, Upload, Trash2, CheckCircle, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { addVoiceRecording } from '@/lib/firestore';
import toast from 'react-hot-toast';

interface VoiceRecorderProps {
  phrase: string;
  translation: string;
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  region: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type TabMode = 'record' | 'upload';

export default function VoiceRecorder({ phrase, translation, ageGroup, region, onSuccess, onCancel }: VoiceRecorderProps) {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabMode>('record');
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFilename, setAudioFilename] = useState<string>('voice-submission.webm');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const generatedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(generatedBlob);
        setAudioUrl(url);
        setAudioBlob(generatedBlob);
        setAudioFilename('voice-submission.webm');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone permission denied or not available.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Audio file exceeds 3MB limit.');
      return;
    }

    const validTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid format. Please upload WEBM, MP3, or WAV.');
      return;
    }
    
    setAudioBlob(file);
    setAudioFilename(file.name);
    setAudioUrl(URL.createObjectURL(file));
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => setIsPlaying(false);

  const handleUpload = async () => {
    if (!user || !userProfile || !audioBlob) return;
    
    // Validate size (3MB max)
    if (audioBlob.size > 3 * 1024 * 1024) {
      toast.error('Audio exceeds 3MB limit. Please provide a smaller clip.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, audioFilename);
      formData.append('userId', user.uid);

      const res = await fetch('/api/upload-voice', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload to Azure Storage');
      }

      await addVoiceRecording({
        phrase,
        translation,
        ageGroup,
        region,
        audioURL: data.url,
        audioName: audioFilename,
        authorId: user.uid,
        authorName: userProfile.displayName,
      });

      toast.success('Awesome! Recording securely saved and is awaiting approval.');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Network error handling upload.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-sm max-w-md mx-auto relative overflow-hidden">
      {/* Hidden Audio Player for Preview */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleEnded}
          className="hidden"
        />
      )}

      {/* Tabs */}
      {!audioUrl && (
        <div className="flex bg-[#F3F4F6] p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'record' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'}`}
          >
            Record Voice
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'}`}
          >
            Upload Audio
          </button>
        </div>
      )}

      <h3 className="font-display font-bold text-xl text-[#111827] mb-6 text-center">
        {audioUrl ? 'Review Audio' : activeTab === 'record' ? 'Record Your Voice' : 'Upload Audio File'}
      </h3>

      {/* Interaction State */}
      {!audioUrl ? (
        <div className="flex flex-col items-center">
          {activeTab === 'record' ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  isRecording 
                    ? 'bg-red-50 text-red-500 border-[8px] border-red-100 animate-pulse' 
                    : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:scale-105'
                }`}
              >
                {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-12 h-12" />}
              </button>
              
              <p className={`mt-6 font-medium ${isRecording ? 'text-red-500' : 'text-[#6B7280]'}`}>
                {isRecording ? 'Recording... Tap square to stop' : 'Tap microphone to start'}
              </p>
            </>
          ) : (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#D1D5DB] rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors cursor-pointer group"
              >
                <input ref={fileInputRef} type="file" accept="audio/webm,audio/mp3,audio/wav,audio/mpeg" onChange={handleFileUpload} className="hidden" />
                <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4 group-hover:bg-[#DBEAFE] transition-colors">
                  <Upload className="w-8 h-8 text-[#6B7280] group-hover:text-[#2563EB]" />
                </div>
                <p className="font-semibold text-[#374151] mb-1">Click to browse your files</p>
                <p className="text-sm text-[#6B7280]">Accepts WEBM, MP3, WAV (Max 3MB)</p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Preview State */
        <div className="flex flex-col items-center w-full">
          {activeTab === 'upload' && (
            <div className="flex items-center gap-3 w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 mb-6">
              <FileAudio className="w-6 h-6 text-[#2563EB]" />
              <span className="text-sm font-medium text-[#1E3A8A] truncate">{audioFilename}</span>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center gap-6 mb-8 w-full justify-center bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E7EB]">
            <button 
              onClick={resetRecording}
              className="p-3 text-[#6B7280] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete and re-record"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={togglePlayback}
              className="w-16 h-16 bg-[#2563EB] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1D4ED8] transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
            </button>

            <div className="w-11" /> {/* Spacer for balance */}
          </div>

          {/* Upload Controls */}
          <Button 
            onClick={handleUpload} 
            loading={uploading} 
            className="w-full text-base py-3 mb-3 bg-[#2563EB] hover:bg-[#1D4ED8]"
            icon={<CheckCircle className="w-5 h-5" />}
          >
            {uploading ? 'Uploading to Azure...' : 'Submit Recording'}
          </Button>
        </div>
      )}

      {!isRecording && !audioUrl && (
         <button onClick={onCancel} className="mt-6 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mx-auto block">
           Cancel
         </button>
      )}
    </div>
  );
}
