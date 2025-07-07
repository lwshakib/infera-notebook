"use client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioFile {
  id: string;
  name: string;
  file: string;
  type: string;
}

interface AudioPlayerProps {
  audioFiles: AudioFile[];
}

export const AudioPlayer = ({ audioFiles }: AudioPlayerProps) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioPositions, setAudioPositions] = useState<Record<string, number>>(
    {}
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update progress and time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.removeEventListener("loadedmetadata", updateTime);
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSliderChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    // Update position for current audio
    if (playingAudio) {
      setAudioPositions((prev) => ({
        ...prev,
        [playingAudio]: newTime,
      }));
    }
  };

  const handleSliderCommit = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    // Update position for current audio
    if (playingAudio) {
      setAudioPositions((prev) => ({
        ...prev,
        [playingAudio]: newTime,
      }));
    }
  };

  const handlePlayAudio = (audioId: string, audioFile: string) => {
    if (playingAudio === audioId) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Play new audio or resume from current position
      if (audioRef.current) {
        if (audioRef.current.src !== audioFile) {
          // New audio file - start from beginning or saved position
          audioRef.current.src = audioFile;
          const savedPosition = audioPositions[audioId] || 0;
          audioRef.current.currentTime = savedPosition;
          setCurrentTime(savedPosition);
        } else {
          // Same audio file - resume from current position
          const savedPosition = audioPositions[audioId] || 0;
          audioRef.current.currentTime = savedPosition;
          setCurrentTime(savedPosition);
        }
        audioRef.current.play();
        setPlayingAudio(audioId);
      }
    }
  };

  return (
    <div className="border-b border-border p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Volume2 className="w-5 h-5" />
        Audio Overview
      </h2>
      <div className="w-full">
        {audioFiles.map((audio) => (
          <div
            key={audio.id}
            className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors w-full"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base">{audio.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePlayAudio(audio.id, audio.file)}
                className="h-10 w-10 p-0"
              >
                {playingAudio === audio.id ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[2.5rem]">
                  {formatTime(
                    playingAudio === audio.id
                      ? currentTime
                      : audioPositions[audio.id] || 0
                  )}
                </span>
                <Slider
                  value={[
                    duration > 0
                      ? ((playingAudio === audio.id
                          ? currentTime
                          : audioPositions[audio.id] || 0) /
                          duration) *
                        100
                      : 0,
                  ]}
                  onValueChange={(value) => {
                    const newTime = (value[0] / 100) * duration;
                    setAudioPositions((prev) => ({
                      ...prev,
                      [audio.id]: newTime,
                    }));
                    if (playingAudio === audio.id) {
                      setCurrentTime(newTime);
                      if (audioRef.current) {
                        audioRef.current.currentTime = newTime;
                      }
                    }
                  }}
                  onValueCommit={(value) => {
                    const newTime = (value[0] / 100) * duration;
                    setAudioPositions((prev) => ({
                      ...prev,
                      [audio.id]: newTime,
                    }));
                    if (playingAudio === audio.id) {
                      setCurrentTime(newTime);
                      if (audioRef.current) {
                        audioRef.current.currentTime = newTime;
                      }
                    }
                  }}
                  max={100}
                  min={0}
                  step={0.1}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground min-w-[2.5rem]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} />
    </div>
  );
};

export default AudioPlayer;
