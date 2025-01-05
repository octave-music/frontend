// useAudio.ts

import { useCallback, useRef, useState, useEffect } from "react";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
  validateBlob,
  refreshTrackBlob,
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager"; // Ensure this can be null
import { Track } from "../types/types";

const API_BASE_URL = "https://mbck.cloudgen.xyz";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);
  const validationIntervalRef = useRef<number | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Safely access navigator
  const isClient = typeof navigator !== "undefined";
  const isSafari =
    isClient &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isiOS =
    isClient &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Initialize audio element event listeners
  useEffect(() => {
    if (!audioElement) return;

    // Set initial values
    setVolume(audioElement.volume);
    setCurrentTime(audioElement.currentTime);
    setDuration(audioElement.duration);

    const handleTimeUpdate = () => {
      if (!audioElement) return;
      const newTime = audioElement.currentTime;
      setCurrentTime((prevTime) =>
        Math.abs(newTime - prevTime) > 0.2 ? newTime : prevTime
      );
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
      setIsPlaying(false);
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
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
        audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audioElement.removeEventListener("ended", handleEnded);
        audioElement.removeEventListener("play", handlePlay);
        audioElement.removeEventListener("pause", handlePause);
      }
    };
  }, []);

  // Handle visibility change for blob validation
  useEffect(() => {
    if (!audioElement) return;

    const handleVisibilityChange = async () => {
      if (!document.hidden && currentTrack && !isPlaying) {
        const isValid = await validateBlob(currentTrack.id);
        if (!isValid && navigator.onLine) {
          try {
            await refreshTrackBlob(currentTrack.id);
            const newBlob = await getOfflineBlob(currentTrack.id);
            if (newBlob && audioElement) {
              const newUrl = URL.createObjectURL(newBlob);
              const currentTime = audioElement.currentTime;
              audioElement.src = newUrl;
              audioElement.currentTime = currentTime;
              await audioElement.play();
              setCurrentTrack(currentTrack);
              setIsPlaying(true);
              // Revoke the old URL
              if (currentBlobUrlRef.current) {
                URL.revokeObjectURL(currentBlobUrlRef.current);
              }
              currentBlobUrlRef.current = newUrl;
            }
          } catch (error) {
            console.error(
              "Failed to refresh track blob on visibility change:",
              error
            );
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentTrack, isPlaying]);

  // Handle global audio errors
  useEffect(() => {
    if (!audioElement) return;

    const handleError = async (e: Event) => {
      console.error("Playback error:", e);

      if (currentTrack) {
        try {
          const blob = await refreshTrackBlob(currentTrack.id);
          if (blob && audioElement) {
            const url = URL.createObjectURL(blob);
            const currentTime = audioElement.currentTime;
            audioElement.src = url;
            audioElement.currentTime = currentTime;
            await audioElement.play();
            setIsPlaying(true);
            // Revoke the old URL
            if (currentBlobUrlRef.current) {
              URL.revokeObjectURL(currentBlobUrlRef.current);
            }
            currentBlobUrlRef.current = url;
            return;
          }
        } catch (error) {
          console.error("Recovery failed:", error);
        }
      }

      // Pause playback if recovery fails
      if (audioElement) {
        audioElement.pause();
      }
      setIsPlaying(false);
    };

    audioElement.addEventListener("error", handleError);

    return () => {
      if (audioElement) audioElement.removeEventListener("error", handleError);
    };
  }, [currentTrack]);

  const setOnTrackEndCallback = useCallback((callback: () => void) => {
    onTrackEndCallbackRef.current = callback;
  }, []);

  const getCurrentPlaybackTime = useCallback(() => {
    return audioElement?.currentTime || 0;
  }, []);

  const refreshBlob = useCallback(async (trackId: string): Promise<Blob | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`);
      if (!response.ok) throw new Error("Failed to fetch track");
      const newBlob = await response.blob();
      await storeTrackBlob(trackId, newBlob);
      return newBlob;
    } catch (error) {
      console.error("Failed to refresh blob:", error);
      return null;
    }
  }, []);

  const validateAndRefreshBlob = useCallback(
    async (trackId: string): Promise<Blob | null> => {
      try {
        const blob = await getOfflineBlob(trackId);
        if (!blob) return null;

        // Test if blob is actually readable
        try {
          const testUrl = URL.createObjectURL(blob);
          const testAudio = new Audio();

          await new Promise<void>((resolve, reject) => {
            if (!testAudio) {
              reject(new Error("Failed to create test audio element"));
              return;
            }
            testAudio.onloadedmetadata = () => {
              resolve();
            };
            testAudio.onerror = () => {
              reject(new Error("Blob is not playable"));
            };
            testAudio.src = testUrl;
          });

          URL.revokeObjectURL(testUrl);
          return blob;
        } catch (error) {
          console.warn("Blob validation failed, fetching fresh copy:", error);
          return await refreshBlob(trackId);
        }
      } catch (error) {
        console.error("Blob handling error:", error);
        return null;
      }
    },
    [refreshBlob]
  );

  const streamAudioForSafari = useCallback(
    async (track: Track, timeOffset = 0): Promise<() => void> => {
      if (!audioElement) throw new Error("Audio element not available");

      try {
        const streamUrl = `${API_BASE_URL}/api/track/${track.id}.mp3`;
        audioElement.src = streamUrl;
        audioElement.currentTime = timeOffset;

        await audioElement.play();
        setCurrentTrack(track);
        setIsPlaying(true);

        const checkConnection = () => {
          if (!navigator.onLine && audioElement) {
            audioElement.pause();
            setIsPlaying(false);
            if (validationIntervalRef.current) {
              clearInterval(validationIntervalRef.current);
              validationIntervalRef.current = null;
            }
          }
        };

        validationIntervalRef.current = window.setInterval(checkConnection, 5000);

        // Cleanup function
        return () => {
          if (validationIntervalRef.current) {
            clearInterval(validationIntervalRef.current);
            validationIntervalRef.current = null;
          }
          if (audioElement) {
            audioElement.pause();
            audioElement.src = "";
          }
        };
      } catch (error) {
        console.error("Safari streaming error:", error);
        throw error;
      }
    },
    []
  );

  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset = 0) => {
      if (!audioElement) {
        return Promise.reject(new Error("Audio element not available"));
      }

      // Cleanup any existing playback
      const cleanupAll = () => {
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
          validationIntervalRef.current = null;
        }
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }
      };

      try {
        // Pause and reset audio element
        audioElement.pause();
        audioElement.src = "";
        audioElement.load();
        cleanupAll();

        if (isSafari || isiOS) {
          // Handle Safari/iOS streaming
          const cleanup = await streamAudioForSafari(track, timeOffset);
          return cleanup;
        }

        // Validate or fetch blob
        let blob = await validateAndRefreshBlob(track.id);
        if (!blob) {
          const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`);
          if (!response.ok) throw new Error("Failed to fetch track");
          blob = await response.blob();
          await storeTrackBlob(track.id, blob);
        }

        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrlRef.current = blobUrl;
        audioElement.src = blobUrl;

        // Play the audio
        await audioElement.play();
        audioElement.currentTime = timeOffset;
        setCurrentTrack(track);
        setIsPlaying(true);

        // Setup periodic validation
        const validatePlayback = async () => {
          if (!isPlaying || !currentTrack || currentTrack.id !== track.id) return;

          const validBlob = await validateAndRefreshBlob(track.id);
          if (!validBlob && navigator.onLine) {
            try {
              const newBlob = await refreshBlob(track.id);
              if (newBlob && audioElement) {
                const newUrl = URL.createObjectURL(newBlob);
                const currentTime = audioElement.currentTime;
                audioElement.src = newUrl;
                audioElement.currentTime = currentTime;
                setCurrentTrack(track);
                setIsPlaying(true);
                // Revoke old URL
                if (currentBlobUrlRef.current) {
                  URL.revokeObjectURL(currentBlobUrlRef.current);
                }
                currentBlobUrlRef.current = newUrl;
              }
            } catch (error) {
              console.error("Failed to refresh track blob during validation:", error);
            }
          }
        };

        validationIntervalRef.current = window.setInterval(validatePlayback, 30000);

        // Return cleanup function
        return () => {
          cleanupAll();
        };
      } catch (err) {
        console.error("Error playing track:", err);
        cleanupAll();
        setIsPlaying(false);
        throw err;
      }
    },
    [
      isSafari,
      isiOS,
      validateAndRefreshBlob,
      refreshBlob,
      streamAudioForSafari,
      currentTrack,
      isPlaying,
    ]
  );

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
    const clampedVolume = Math.min(Math.max(v, 0), 1); // Ensure volume is between 0 and 1
    setVolume(clampedVolume);
    audioElement.volume = clampedVolume;
    void storeSetting("volume", String(clampedVolume));
  }, []);

  const loadAudioBuffer = useCallback(async (trackId: string): Promise<Blob | null> => {
    const offlineData = await getOfflineBlob(trackId);
    if (offlineData) return offlineData;

    try {
      const url = `${API_BASE_URL}/api/track/${trackId}.mp3`;
      const resp = await fetch(url);
      if (!resp.ok) {
        console.error(`Failed to fetch track with ID ${trackId}`);
        return null;
      }
      const mp3 = await resp.blob();
      await storeTrackBlob(trackId, mp3);
      return mp3;
    } catch (error) {
      console.error("Error loading audio buffer:", error);
      return null;
    }
  }, []);

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
