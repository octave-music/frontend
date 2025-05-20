// src/components/player/Mobile/MobilePlayerLyricsView.tsx
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ProcessedLyric } from "@/lib/hooks/useAutoScrollLyrics"; // Adjust path

interface MobilePlayerLyricsViewProps {
  lyrics: ProcessedLyric[];
  currentLyricIndex: number;
  lyricProgress: number; // Progress (0-1) within the current lyric line
  lyricsLoading: boolean;
  onCloseLyrics: () => void;
  onSeekToLyricTime: (time: number) => void;
  onUserScroll: () => void; // To notify parent about manual scroll
}

const MobilePlayerLyricsView: React.FC<MobilePlayerLyricsViewProps> = ({
  lyrics,
  currentLyricIndex,
  lyricProgress,
  lyricsLoading,
  onCloseLyrics,
  onSeekToLyricTime,
  onUserScroll,
}) => {
  // The parent MobilePlayer will manage the lyricsRef and auto-scrolling logic,
  // this component just needs to render and handle user interaction.

  if (lyricsLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white/70">
        <p>Loading lyrics...</p>
      </div>
    );
  }

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white/70">
        <p>No lyrics available for this track.</p>
      </div>
    );
  }
  
  return (
    <motion.div
      className="w-full h-full flex flex-col pt-2 px-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center mb-4 w-full shrink-0">
        <button
          onClick={onCloseLyrics}
          className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Back to player"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-md font-semibold text-white ml-3">Lyrics</h2>
      </div>

      <div
        className="flex-1 space-y-5 overflow-y-auto pb-16 text-center scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        // The ref will be passed from the parent MobilePlayer
        // ref={parentLyricsRef}
        onScroll={onUserScroll} // Notify parent of scroll
        onTouchMove={onUserScroll} // For touch devices
      >
        {lyrics.map((line, idx) => {
          const isActive = idx === currentLyricIndex;
          const lineText = line.text || "♪"; // Fallback for empty line

          if (!isActive) {
            return (
              <motion.p
                key={`lyric-${idx}`}
                className="text-lg text-white/50 hover:text-white/80 cursor-pointer transition-colors"
                onClick={() => onSeekToLyricTime(line.time)}
                initial={{ opacity: 0.6 }}
                whileHover={{ opacity: 0.9 }}
              >
                {lineText}
              </motion.p>
            );
          }

          // Active line with character-by-character fill
          const characters = lineText.split("");
          const filledChars = Math.floor(lyricProgress * characters.length);

          return (
            <motion.p
              key={`lyric-active-${idx}`}
              className="text-xl font-semibold text-white leading-relaxed cursor-pointer"
              onClick={() => onSeekToLyricTime(line.time)}
            >
              {characters.map((char, charIdx) => (
                <motion.span
                  key={charIdx}
                  style={{
                    opacity: charIdx < filledChars ? 1 : 0.5,
                    transition: 'opacity 0.1s linear' // Smoother transition for individual chars
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.p>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobilePlayerLyricsView;