import { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VoiceRecorderProps {
  onSave: (audioUrl: string, duration: number) => void;
}

export default function VoiceRecorder({ onSave }: VoiceRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl: string, blob: Blob) => {
      // Create audio element to get duration
      const audio = new Audio(blobUrl);
      audio.onloadedmetadata = () => {
        setDuration(Math.round(audio.duration));
        setAudioEl(audio);
      };
    }
  });

  const handlePlay = () => {
    if (audioEl) {
      if (isPlaying) {
        audioEl.pause();
      } else {
        audioEl.play();
      }
      setIsPlaying(!isPlaying);
      
      audioEl.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const handleSave = () => {
    if (mediaBlobUrl && duration > 0) {
      onSave(mediaBlobUrl, duration);
      clearBlobUrl();
      setAudioEl(null);
    }
  };

  const handleReset = () => {
    if (audioEl) {
      audioEl.pause();
      setIsPlaying(false);
    }
    clearBlobUrl();
    setAudioEl(null);
    setDuration(0);
  };

  const isRecording = status === 'recording';
  const hasRecording = status === 'stopped' && mediaBlobUrl;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-neutral-200">
      <div className="flex flex-col">
        <div className="text-sm font-medium text-neutral-700 mb-2">Voice Note</div>
        
        {!hasRecording ? (
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              size="sm"
              variant={isRecording ? 'destructive' : 'default'}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center"
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
            {isRecording && (
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
                <span className="text-sm text-neutral-600">Recording...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handlePlay}
                className="flex items-center"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
              <span className="text-sm text-neutral-600">{formatTime(duration)}</span>
            </div>
            
            <Progress value={isPlaying ? 50 : 0} className="h-2" />
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={handleReset}
              >
                Record Again
              </Button>
              
              <Button 
                type="button" 
                size="sm" 
                variant="default" 
                onClick={handleSave}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Voice Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}