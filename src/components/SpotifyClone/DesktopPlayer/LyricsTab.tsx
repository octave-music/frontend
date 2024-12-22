// src/components/SpotifyClone/DesktopPlayer/LyricsTab.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lyric } from '@/lib/types'; // or your interface location

interface LyricsTabProps {
  lyrics: Lyric[];
  currentLyricIndex: number;
  seekPosition: number;
  duration: number;
  handleSeek: (time: number) => void;
}

/**
 * Optional: If you have a "processedLyrics" approach, do it here.
 */
export default function LyricsTab({
  lyrics,
  currentLyricIndex,
  seekPosition,
  duration,
  handleSeek,
}: LyricsTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef(false);

  // example "processed" version:
  const processedLyrics = lyrics.map((lyric, i) => ({
    ...lyric,
    endTime: lyrics[i + 1]?.time ?? duration,
  }));

  const getLyricProgress = useCallback(() => {
    if (currentLyricIndex < 0 || !processedLyrics[currentLyricIndex]) return 0;
    const current = processedLyrics[currentLyricIndex];
    const next = processedLyrics[currentLyricIndex + 1];
    const lyricStart = current.time;
    const lyricEnd = next?.time || duration;
    const lyricDuration = lyricEnd - lyricStart;
    const elapsed = seekPosition - lyricStart;
    return Math.min(Math.max(elapsed / lyricDuration, 0), 1);
  }, [processedLyrics, currentLyricIndex, duration, seekPosition]);

  const lyricProgress = getLyricProgress();

  // auto-scroll logic
  const scrollToCurrentLyric = useCallback(() => {
    if (!containerRef.current) return;
    if (currentLyricIndex < 0 || userScrolling) return;
    const container = containerRef.current;
    const activeLyricEl = container.children[currentLyricIndex] as HTMLElement;
    if (activeLyricEl) {
      isAutoScrollingRef.current = true;
      const elementOffset = activeLyricEl.offsetTop;
      const elementHeight = activeLyricEl.offsetHeight;
      const containerHeight = container.clientHeight;
      const scrollPosition = elementOffset - containerHeight / 2 + elementHeight / 2;
      container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 1000);
    }
  }, [currentLyricIndex, userScrolling]);

  useEffect(() => {
    scrollToCurrentLyric();
  }, [currentLyricIndex, scrollToCurrentLyric]);

  const onUserScroll = () => {
    if (isAutoScrollingRef.current) return;
    setUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
      scrollToCurrentLyric();
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="p-4 h-full overflow-y-auto" onScroll={onUserScroll}>
      {processedLyrics.length > 0 ? (
        <div className="space-y-4">
          {processedLyrics.map((lyric, i) => {
            const isActive = i === currentLyricIndex;
            if (!isActive) {
              // inactive lyric
              return (
                <p
                  key={i}
                  onClick={() => handleSeek(lyric.time)}
                  className="text-lg cursor-pointer text-neutral-400 hover:text-white opacity-50 transition-all"
                >
                  {lyric.text}
                </p>
              );
            }
            // active lyric
            const letters = lyric.text.split('');
            const totalLetters = letters.length;
            const filledLetters = Math.floor(lyricProgress * totalLetters);
            return (
              <p key={i} onClick={() => handleSeek(lyric.time)} className="text-lg cursor-pointer font-medium text-white">
                {letters.map((letter: string, idx: number) => (
                  <span
                    key={idx}
                    className={idx < filledLetters ? 'text-white' : 'text-neutral-400'}
                  >
                    {letter}
                  </span>
                ))}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="text-neutral-400 text-center">No lyrics available</p>
      )}
    </div>
  );
}
