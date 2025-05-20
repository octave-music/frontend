// src/components/player/Desktop/LyricsPanel.tsx
import React from "react";
import { Track } from "@/lib/types/types"; // Adjust path
import { ProcessedLyric } from "@/lib/hooks/useAutoScrollLyrics"; // Adjust path

interface LyricsPanelProps {
  currentTrack: Track | null; // Allow null if no track
  currentLyricIndex: number;
  handleSeek: (time: number) => void;
  lyricsRef: React.RefObject<HTMLDivElement>;
  processedLyrics: ProcessedLyric[];
  lyricProgress: number;
  userScrolling: boolean;
  handleUserScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  lyricsLoading: boolean;
}

const LyricsPanel: React.FC<LyricsPanelProps> = ({
  currentTrack,
  currentLyricIndex,
  handleSeek,
  lyricsRef,
  processedLyrics,
  lyricProgress,
  userScrolling,
  handleUserScroll,
  lyricsLoading,
}) => {
  if (!currentTrack) {
    return <p className="text-neutral-400 text-center p-4">No track selected.</p>;
  }

  if (lyricsLoading) {
    return <p className="text-neutral-400 text-center p-4">Fetching lyrics…</p>;
  }

  if (processedLyrics.length === 0) {
    return <p className="text-neutral-400 text-center p-4">No lyrics available for this track.</p>;
  }

  return (
    <div
      ref={lyricsRef}
      onScroll={handleUserScroll}
      className="flex-1 overflow-y-auto p-6 scrollbar-fade"
      style={{ maxHeight: "calc(100vh - 250px)" }} // Adjusted maxHeight slightly if needed for container
    >
      <div className="space-y-4">
        {processedLyrics.map((line, idx) => {
          const isActive = idx === currentLyricIndex;

          if (!isActive) {
            return (
              <p
                key={`${line.time}-${idx}`} // More robust key
                onClick={() => handleSeek(line.time)}
                className="text-lg text-neutral-400 hover:text-white/90 cursor-pointer opacity-70 transition-colors duration-150"
              >
                {line.text || "♪"} {/* Fallback for empty lyric text */}
              </p>
            );
          }

          return (
            <p
              key={`${line.time}-${idx}-active`}
              onClick={() => handleSeek(line.time)}
              className="text-xl font-semibold text-white text-center leading-relaxed cursor-pointer" // Enhanced active style
            >
              {line.text.split("").map((char, i) => (
                <span
                  key={i}
                  style={{
                    opacity: i < Math.floor(lyricProgress * line.text.length) ? 1 : 0.35,
                    transition: "opacity .08s linear",
                  }}
                >
                  {char}
                </span>
              ))}
            </p>
          );
        })}
      </div>

      {userScrolling && (
        <div className="sticky bottom-0 left-0 right-0 p-2 bg-neutral-900/80 backdrop-blur-sm text-center">
          <p className="text-xs text-neutral-500 italic">
            Scrolling manually. Auto-scroll resumes shortly.
          </p>
        </div>
      )}
    </div>
  );
};

export default LyricsPanel;