// src/lib/hooks/useAppLyrics.ts
import { useState, useCallback } from 'react';
import { Track, Lyric } from '@/lib/types/types'; // Ensure ProcessedLyric is here or imported correctly
import { ProcessedLyric } from "@/lib/hooks/useAutoScrollLyrics";
import { handleFetchLyrics as fetchLyricsAPI } from '@/lib/api/lyrics';

export function useAppLyrics() {
  const [lyrics, setLyricsState] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndexState] = useState(-1);
  const [lyricsLoading, setLyricsLoadingState] = useState(false);
  const [showLyricsView, setShowLyricsViewState] = useState(false);

  const fetchLyrics = useCallback(async (track: Track | null) => {
    if (!track) {
      setLyricsState([]);
      setCurrentLyricIndexState(-1);
      return;
    }
    setLyricsLoadingState(true);
    setLyricsState([]);
    setCurrentLyricIndexState(-1);
    try {
      const fetched = await fetchLyricsAPI(track);
      setLyricsState(fetched || []);
    } catch (err) {
      console.error("Lyrics fetching error:", err);
      setLyricsState([]);
    } finally {
      setLyricsLoadingState(false);
    }
  }, []);
  
  const updateCurrentLyricIndex = useCallback((currentTime: number, trackDuration: number) => {
    const currentLyrics = lyrics; // Use the 'lyrics' state directly
    if (!currentLyrics || currentLyrics.length === 0) {
        setCurrentLyricIndexState(-1);
        return;
    }
    
    let newIndex = -1;
    for (let i = 0; i < currentLyrics.length; i++) {
        const lyric = currentLyrics[i];
        // Assuming ProcessedLyric includes endTime, or calculate it
        const nextLyricTime = (lyric as ProcessedLyric).endTime || ((i + 1 < currentLyrics.length) ? currentLyrics[i+1].time : trackDuration + 1);
        if (currentTime >= lyric.time && currentTime < nextLyricTime) {
            newIndex = i;
            break;
        }
    }
    
    if (newIndex !== currentLyricIndex) { // Only update if the index actually changed
        setCurrentLyricIndexState(newIndex);
    }
  }, [lyrics, currentLyricIndex]); // Depend on 'lyrics' state

  const toggleLyricsView = useCallback(() => {
    setShowLyricsViewState(prev => !prev);
  }, []);

  return {
    lyrics,
    currentLyricIndex,
    lyricsLoading,
    fetchLyrics,
    updateCurrentLyricIndex,
    showLyricsView,
    toggleLyricsView,
  };
}