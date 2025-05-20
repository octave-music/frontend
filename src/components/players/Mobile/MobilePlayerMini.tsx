// src/components/player/Mobile/MobilePlayerMini.tsx
import React from "react";
import Image from "next/image";
import { motion, PanInfo, AnimationControls } from "framer-motion";
import { Heart, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import MobileSeekbar from "./MobileSeekbar";
import { Track } from "@/lib/types/types"; // Adjust path

interface MobilePlayerMiniProps {
  currentTrack: Track;
  isPlaying: boolean;
  isLiked: boolean;
  dominantColor: string | null;
  seekPosition: number;
  duration: number;
  framerControls: AnimationControls; // For drag animation
  onTogglePlay: () => void;
  onSkipTrack: (isDoubleClick?: boolean) => void; // For double click logic
  onPreviousTrack: (isDoubleClick?: boolean) => void; // For double click logic
  onToggleLike: () => void;
  onHandleSeek: (time: number) => void;
  onExpandPlayer: () => void;
  onDragEnd: (info: PanInfo) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const MobilePlayerMini: React.FC<MobilePlayerMiniProps> = ({
  currentTrack, isPlaying, isLiked, dominantColor, seekPosition, duration, framerControls,
  onTogglePlay, onSkipTrack, onPreviousTrack, onToggleLike, onHandleSeek, onExpandPlayer,
  onDragEnd, onTouchStart, onTouchMove, onTouchEnd
}) => {

  // Simplified double tap logic for mini player buttons if needed, or pass simple handlers
  const handleMiniPreviousClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreviousTrack(); // Simple previous for now, parent can handle double tap state
  };

  const handleMiniNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkipTrack(); // Simple next
  };
  
  const handleMiniToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLike();
  };

  const handleMiniTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePlay();
  }

  return (
    <motion.div
      className="mx-2 rounded-xl overflow-hidden shadow-lg" // Ensure overflow is visible if needed, or clip
      style={{
        background: dominantColor
          ? `linear-gradient(160deg, ${dominantColor}99 0%, rgba(10,10,10,0.85) 100%)` // Adjusted gradient
          : "rgba(20,20,20,0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={(event, info) => onDragEnd(info)}
      animate={framerControls}
      onClick={onExpandPlayer} // Click anywhere on mini player to expand
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      layoutId="mobile-player" // For shared layout animation with expanded view
    >
      <div className="p-2.5"> {/* Slightly more padding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <motion.div
              className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0" // Slightly smaller art
              layoutId="album-art-mobile"
            >
              <Image
                src={currentTrack.album.cover_medium || "/images/default-album.png"}
                alt={currentTrack.title || "Track"}
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {currentTrack.title}
              </div>
              <p className="text-white/70 text-xs truncate">
                {currentTrack.artist.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 ml-2"> {/* Reduced space */}
            <button
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleMiniPreviousClick}
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 text-white/90" />
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleMiniTogglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleMiniNextClick}
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 text-white/90" />
            </button>
            <button
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              onClick={handleMiniToggleLike}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? "fill-purple-500 text-purple-500" : "text-white/70"
                }`}
              />
            </button>
          </div>
        </div>
        <div className="mt-1.5">
          <MobileSeekbar
            progress={duration > 0 ? seekPosition / duration : 0}
            handleSeek={onHandleSeek}
            duration={duration}
            isMiniPlayer
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MobilePlayerMini;