// src/components/player/Mobile/MobilePlayerExpandedMainControls.tsx
import React from "react";
import { motion } from "framer-motion";
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1 } from "lucide-react";
import { RepeatMode } from "./types"; // Adjust path

interface MobilePlayerExpandedMainControlsProps {
  isPlaying: boolean;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  onTogglePlay: () => void;
  onSkipTrack: () => void;
  onPreviousTrack: () => void;
  onShuffleQueue: () => void;
  onToggleRepeatMode: () => void;
}

const MobilePlayerExpandedMainControls: React.FC<MobilePlayerExpandedMainControlsProps> = ({
  isPlaying, shuffleOn, repeatMode,
  onTogglePlay, onSkipTrack, onPreviousTrack, onShuffleQueue, onToggleRepeatMode
}) => {
  return (
    // Using justify-center and gap for better control
    <div className="w-full flex items-center justify-center gap-x-4 sm:gap-x-5 mb-6 p-2 shrink-0">
      <button
        onClick={onShuffleQueue}
        className={`p-2.5 rounded-full transition-colors ${shuffleOn ? "text-purple-400" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
        aria-label="Shuffle queue"
      >
        <Shuffle className="w-5 h-5" />
      </button>
      <button
        onClick={onPreviousTrack}
        className="p-2.5 rounded-full text-white hover:bg-white/10"
        aria-label="Previous track or restart"
      >
        <SkipBack className="w-6 h-6" />
      </button>
      <motion.button
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-lg"
        whileTap={{ scale: 0.93 }}
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </motion.button>
      <button
        onClick={onSkipTrack}
        className="p-2.5 rounded-full text-white hover:bg-white/10"
        aria-label="Next track or go to end"
      >
        <SkipForward className="w-6 h-6" />
      </button>
      <button
        onClick={onToggleRepeatMode}
        className={`p-2.5 rounded-full transition-colors ${repeatMode !== "off" ? "text-purple-400" : "text-white/60 hover:text-white/80 hover:bg-white/5"}`}
        aria-label="Toggle repeat mode"
      >
        {repeatMode === "one" ? (
          <Repeat1 className="w-5 h-5" />
        ) : (
          <Repeat className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default MobilePlayerExpandedMainControls;