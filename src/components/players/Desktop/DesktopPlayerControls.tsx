// src/components/player/Desktop/DesktopPlayerControls.tsx
import React from "react";
import Image from "next/image";
import {
  Heart, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Maximize2, ListMusic, Info, ChevronDown,
  Volume2, Volume1, VolumeX, Guitar, MessageSquareText
} from "lucide-react";
import { Track } from "@/lib/types/types"; // Adjust path
import { RepeatMode } from "./types";

interface DesktopPlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLiked: boolean;
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  showLyrics: boolean; // To highlight lyrics button
  volume: number;
  listenCount: number;

  onTogglePlay: () => void;
  onSkipTrack: () => void;
  onPreviousTrack: () => void; // The one with double-click logic
  onToggleLike: () => void;
  onShuffleQueue: () => void;
  onToggleRepeatMode: () => void;
  onToggleLyricsView: () => void; // For lyrics button action
  onToggleFullScreen: () => void;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
  
  onOpenSidebar: (tab: 'queue' | 'lyrics' | 'details') => void;
  onSetCollapsed: (collapsed: boolean) => void;
}

const DesktopPlayerControls: React.FC<DesktopPlayerControlsProps> = ({
  currentTrack, isPlaying, isLiked, shuffleOn, repeatMode, showLyrics, volume, listenCount,
  onTogglePlay, onSkipTrack, onPreviousTrack, onToggleLike, onShuffleQueue, onToggleRepeatMode,
  onToggleLyricsView, onToggleFullScreen, onVolumeChange, onToggleMute,
  onOpenSidebar, onSetCollapsed
}) => {

  const VolumeIconComponent = () => {
    if (volume === 0) return <VolumeX size={18} />;
    return volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />;
  };

  if (!currentTrack) {
    // Render a minimal bar or placeholder if no track is active
    return (
      <div className="h-20 flex items-center justify-center text-neutral-500">
        No track playing.
      </div>
    );
  }

  return (
    <div className="h-20 flex items-center justify-between gap-4">
      {/* Left Side: Track Info & Actions */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative group flex-shrink-0">
          <Image
            src={currentTrack.album.cover_medium || "/images/default-album.png"} // Fallback image
            alt={currentTrack.title}
            width={56}
            height={56}
            className="rounded-md object-cover aspect-square"
          />
          <button
            onClick={() => onOpenSidebar("details")}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="min-w-0">
          <h3 className="text-white font-medium text-sm truncate hover:underline cursor-pointer" onClick={() => onOpenSidebar("details")}>
            {currentTrack.title}
          </h3>
          <p className="text-xs text-neutral-400 truncate hover:underline cursor-pointer">
            {currentTrack.artist.name}
          </p>
          {listenCount > 0 && (
            <p className="text-yellow-400 text-[10px] mt-0.5 flex items-center gap-1">
              <Guitar className="w-3 h-3" />
              <span>{listenCount.toLocaleString()}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onToggleLike}
            title={isLiked ? "Unlike" : "Like"}
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              isLiked ? "text-pink-500" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onToggleFullScreen}
            title="Fullscreen"
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {/* <button title="Share" className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors">
            <Share className="w-4 h-4" />
          </button> */}
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onShuffleQueue}
            title="Shuffle"
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              shuffleOn ? "text-green-400" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={onPreviousTrack}
            title="Previous / Restart"
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            title={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 translate-x-px" />
            )}
          </button>
          <button
            onClick={onSkipTrack}
            title="Next"
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleRepeatMode}
            title="Repeat"
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              repeatMode !== "off" ? "text-green-400" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Right Side: Extra Controls & Volume */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={() => { onToggleLyricsView(); onOpenSidebar("lyrics"); }}
          title="Lyrics"
          className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
            showLyrics ? "text-green-400" : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <MessageSquareText className="w-4 h-4" /> {/* Changed icon to MessageSquareText */}
        </button>
        <button
          onClick={() => onOpenSidebar("queue")}
          title="Queue"
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 min-w-[120px] max-w-[150px]"> {/* Volume slider width constraints */}
          <button
            onClick={onToggleMute}
            title={volume === 0 ? "Unmute" : "Mute"}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <VolumeIconComponent />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 accent-white bg-neutral-600 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                       [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none"
            aria-label="Volume"
          />
        </div>
        <button
          onClick={() => onSetCollapsed(true)}
          title="Collapse Player"
          className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DesktopPlayerControls;