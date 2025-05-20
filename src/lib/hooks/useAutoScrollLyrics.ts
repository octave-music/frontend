// src/hooks/useAutoScrollLyrics.ts (or src/components/player/hooks/useAutoScrollLyrics.ts)
import React, { useMemo, useCallback, useLayoutEffect, useRef } from "react";
import { Lyric } from "@/lib/types/types"; // Adjust path

// Define a processed Lyric type that includes endTime
export type ProcessedLyric = Lyric & { endTime: number };

export function useAutoScrollLyrics(
  showLyrics: boolean,
  currentIdx: number,
  lyrics: Lyric[],
  duration: number,
  seekPosition: number,
) {
  const [userScrolling, setUserScrolling] = React.useState(false);

  const autoRef    = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsRef  = useRef<HTMLDivElement>(null);

  const processedLyrics: ProcessedLyric[] = useMemo(
    () =>
      lyrics.map((l, i) => ({
        ...l,
        endTime: lyrics[i + 1]?.time ?? duration,
      })),
    [lyrics, duration],
  );

  const lyricProgress = useMemo(() => {
    const ln = processedLyrics[currentIdx];
    if (!ln) return 0;
    return Math.min(
      1,
      Math.max(0, (seekPosition - ln.time) / Math.max(ln.endTime - ln.time, 0.01)),
    );
  }, [seekPosition, processedLyrics, currentIdx]);

  const scrollToActive = useCallback(() => {
    if (!lyricsRef.current) return;
    const line =
      lyricsRef.current.children[0]?.children?.[currentIdx] as
        | HTMLElement
        | undefined;
    if (!line) return;

    autoRef.current = true;
    const target =
      line.offsetTop -
      lyricsRef.current.clientHeight / 2 +
      line.offsetHeight / 2;

    lyricsRef.current.scrollTo({ top: target, behavior: "smooth" });

    setTimeout(() => (autoRef.current = false), 600);
  }, [currentIdx]);

  const handleUserScroll = useCallback(() => {
    if (autoRef.current) return;
    setUserScrolling(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
      scrollToActive();
    }, 4000);
  }, [scrollToActive]);

  useLayoutEffect(() => {
    if (!showLyrics || userScrolling) return;
    scrollToActive();
  }, [showLyrics, userScrolling, currentIdx, scrollToActive]);

  return {
    lyricsRef,
    userScrolling,
    handleUserScroll,
    lyricProgress,
    processedLyrics,
  };
}