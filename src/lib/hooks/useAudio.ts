// useAudio.ts

import { useCallback, useRef, useState, useEffect } from "react";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
  validateBlob,
  refreshTrackBlob
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager";
import { Track } from "../types/types";

const API_BASE_URL = "https://mbck.cloudgen.xyz";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Set initial values
    setVolume(audioElement.volume);
    setCurrentTime(audioElement.currentTime);
    setDuration(audioElement.duration);

    const handleTimeUpdate = () => {
      if (!audioElement) return;

      const newTime = audioElement.currentTime;

      // Batch state updates (throttle updates to prevent re-renders every frame)
      setCurrentTime((prevTime) => {
        if (Math.abs(newTime - prevTime) > 0.2) {
          // Only update if difference > threshold
          return newTime;
        }
        return prevTime;
      });
    };

    const handleLoadedMetadata = () => {
      if (audioElement) {
        setDuration(audioElement.duration);
      }
    };

    const handleEnded = () => {
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Add event listeners
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    // Cleanup
    return () => {
      if (!audioElement) return;
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, []);

  const setOnTrackEndCallback = useCallback((callback: () => void) => {
    onTrackEndCallbackRef.current = callback;
  }, []);

  const getCurrentPlaybackTime = useCallback(() => {
    return audioElement?.currentTime || 0;
  }, []);

  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset = 0) => {
      if (!audioElement) {
        console.error("Audio element not available");
        return;
      }

      try {
        // First pause any current playback
        audioElement.pause();

        // Keep track of the last active blob URL
        let currentBlobUrl: string | null = null;

        const tryPlayback = async (blob: Blob): Promise<void> => {
          if (!audioElement) return;

          // Revoke previous blob URL if it exists
          if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
          }
          
          currentBlobUrl = URL.createObjectURL(blob);
          audioElement.src = currentBlobUrl;

          return new Promise<void>((resolve, reject) => {
            const handleLoadedData = async () => {
              if (!audioElement) {
                reject(new Error("Audio element not available"));
                return;
              }

              audioElement.currentTime = timeOffset;

              try {
                await audioElement.play();
                setCurrentTrack(track);
                setIsPlaying(true);
                resolve();
              } catch (playError) {
                console.error("Play error:", playError);
                reject(playError);
              }
            };

            const handleError = async (e: Event) => {
              console.error("Audio loading error:", e);
              
              // If we get an error, try refreshing the blob from the server
              try {
                const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`);
                if (!response.ok) throw new Error("Failed to fetch track");
                
                const newBlob = await response.blob();
                await storeTrackBlob(track.id, newBlob);
                await tryPlayback(newBlob);
                resolve();
              } catch (refreshError) {
                console.error("Failed to refresh track:", refreshError);
                reject(refreshError);
              }
            };

            if (audioElement) {
              audioElement.addEventListener("loadeddata", handleLoadedData, { once: true });
              audioElement.addEventListener("error", handleError, { once: true });
            }
          });
        };

        // First try to get from IndexedDB
        let blob: Blob | undefined = await getOfflineBlob(track.id);

        // If offline data exists but fails to play, fetch fresh copy
        if (blob) {
          try {
            await tryPlayback(blob);
          } catch (offlineError) {
            console.error("Offline playback failed, fetching fresh copy:", offlineError);
            blob = undefined;
          }
        }

        // If no offline data or it failed, fetch from server
        if (!blob) {
          const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`);
          if (!response.ok) {
            throw new Error("Failed to fetch the track from the server.");
          }
          blob = await response.blob();
          await storeTrackBlob(track.id, blob);
          await tryPlayback(blob);
        }

        // Set up auto-refresh mechanism
        const setupAutoRefresh = () => {
          if (!audioElement) return;

          const refreshBlob = async () => {
            if (navigator.onLine) {
              try {
                const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`);
                if (!response.ok) throw new Error("Failed to fetch track");
                const newBlob = await response.blob();
                await storeTrackBlob(track.id, newBlob);
              } catch (err) {
                console.error("Failed to refresh blob:", err);
              }
            }
          };

          // Refresh on pause
          const handlePause = () => {
            refreshBlob();
          };

          // Refresh periodically while paused
          let refreshInterval: NodeJS.Timeout | null = null;
          
          const handleVisibilityChange = () => {
            if (document.hidden) {
              if (refreshInterval) clearInterval(refreshInterval);
            } else {
              refreshBlob();
              refreshInterval = setInterval(refreshBlob, 60000); // Refresh every minute when visible
            }
          };

          audioElement.addEventListener("pause", handlePause);
          document.addEventListener("visibilitychange", handleVisibilityChange);

          // Return cleanup function
          return () => {
            if (refreshInterval) clearInterval(refreshInterval);
            audioElement?.removeEventListener("pause", handlePause);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
          };
        };

        const cleanup = setupAutoRefresh();

        // Return combined cleanup function
        return () => {
          if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
          }
          if (cleanup) cleanup();
        };

      } catch (err) {
        console.error("Error playing track:", err);
        setIsPlaying(false);
        throw err;
      }
    },
    [setCurrentTrack, setIsPlaying]
  );

  useEffect(() => {
    if (!audioElement) return;
  
    const handleVisibilityChange = async () => {
      if (!document.hidden && currentTrack && !isPlaying) {
        // Check if the blob is still valid when returning to the tab
        const isValid = await validateBlob(currentTrack.id);
        
        if (!isValid && navigator.onLine) {
          // If invalid and we're online, refresh it
          try {
            await refreshTrackBlob(currentTrack.id);
            // Update audio source with new blob
            const newBlob = await getOfflineBlob(currentTrack.id);
            if (newBlob && audioElement) {
              const newUrl = URL.createObjectURL(newBlob);
              audioElement.src = newUrl;
              // Store current time before changing source
              const currentTime = audioElement.currentTime;
              audioElement.currentTime = currentTime;
              
              // Cleanup old URL after source change
              return () => URL.revokeObjectURL(newUrl);
            }
          } catch (error) {
            console.error("Failed to refresh track blob:", error);
          }
        }
      }
    };
  
    document.addEventListener("visibilitychange", handleVisibilityChange);
  
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentTrack, isPlaying]);

  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  const onVolumeChange = useCallback((v: number) => {
    if (!audioElement) return;
    setVolume(v);
    audioElement.volume = v;
    void storeSetting("volume", String(v));
  }, []);

  const loadAudioBuffer = useCallback(
    async (trackId: string): Promise<Blob | null> => {
      const offlineData = await getOfflineBlob(trackId);
      if (offlineData) return offlineData;

      try {
        const url = `${API_BASE_URL}/api/track/${trackId}.mp3`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const mp3 = await resp.blob();
        await storeTrackBlob(trackId, mp3);
        return mp3;
      } catch (error) {
        console.error("Error loading audio buffer:", error);
        return null;
      }
    },
    []
  );

  return {
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    volume,
    setVolume,
    currentTime,
    getCurrentPlaybackTime,
    pauseAudio,
    handleSeek,
    playTrackFromSource,
    onVolumeChange,
    loadAudioBuffer,
    audioElement,
    setOnTrackEndCallback,
  };
}
