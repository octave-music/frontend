// src/components/player/Desktop/DesktopPlayerMinimized.tsx
import React from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronUp } from "lucide-react";
import DesktopSeekbar from "./DesktopSeekbar"; // Assuming DesktopSeekbar is in the same folder

interface DesktopPlayerMinimizedProps {
  seekPosition: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipTrack: () => void;
  onPreviousTrack: () => void; // The one with double-click logic
  onHandleSeek: (time: number) => void;
  onSetCollapsed: (collapsed: boolean) => void;
}

const DesktopPlayerMinimized: React.FC<DesktopPlayerMinimizedProps> = ({
  seekPosition, duration, isPlaying,
  onTogglePlay, onSkipTrack, onPreviousTrack, onHandleSeek, onSetCollapsed
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center flex-1">
        <DesktopSeekbar
          progress={duration > 0 ? seekPosition / duration : 0}
          handleSeek={onHandleSeek}
          duration={duration}
        />
      </div>
      <div className="flex items-center gap-2 pl-2"> {/* Reduced gap */}
        <button
          onClick={onPreviousTrack}
          title="Previous / Restart"
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePlay}
          title={isPlaying ? "Pause" : "Play"}
          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform" // Smaller play button
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-px" />}
        </button>
        <button
          onClick={onSkipTrack}
          title="Next"
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSetCollapsed(false)}
          title="Expand Player"
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DesktopPlayerMinimized;