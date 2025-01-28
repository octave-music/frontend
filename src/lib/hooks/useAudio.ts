/* eslint-disable @typescript-eslint/no-explicit-any */
// useAudio.ts
import { useCallback, useRef, useState, useEffect } from "react";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager";
import { Track } from "../types/types";
import { AudioStreamer } from "../utils/audioStreaming";

const API_BASE_URL = "https://api.octave.gold";

/**
 * A simpler audio hook that:
 * 1. Never forces playback if user has paused.
 * 2. Checks if the track is already loaded before re-fetching.
 * 3. Avoids auto-restarts or re-seeks unless explicitly asked by the user.
 */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  // iOS or Safari detection for direct streaming
  const isSafari =
    typeof window !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isiOS =
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Attach main audio listeners
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement!.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audioElement!.duration);
    };
    const handleEnded = () => {
      // When a track ends, call the callback if available
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
      setIsPlaying(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      if (!audioElement) return;
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, []);

  /**
   * Hard stop all audio:
   * - Abort any pending fetch
   * - Clear the src
   * - Pause
   */
  const stop = useCallback(() => {
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
      currentAbortControllerRef.current = null;
    }
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  /**
   * Load & optionally play the track from timeOffset.
   * If track is the same as currentTrack, we re-check to avoid re-fetching.
   * This DOES NOT forcibly play if user has paused or if 'autoPlay' is false.
   */
  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset = 0, autoPlay = false): Promise<void> => {
      if (!audioElement) return;
      const audio = audioElement;
  
      // Track the current attempt's resources
      let currentStreamer: AudioStreamer | null = null;
      let currentObjectUrl: string | null = null;
  
      // Cleanup helper
      const cleanup = () => {
        if (currentStreamer) {
          currentStreamer.destroy();
          currentStreamer = null;
        }
        if (currentObjectUrl !== null) {
          // Delay URL revocation to ensure playback has switched
          setTimeout(() => {
            if (currentObjectUrl !== null) {
              URL.revokeObjectURL(currentObjectUrl);
            }
          }, 1000);
          currentObjectUrl = null;
        }
      };
  
      try {
        // If it's the same track, just handle seeking and playing
        if (currentTrack && currentTrack.id === track.id) {
          if (Math.abs(audio.currentTime - timeOffset) > 0.05) {
            audio.currentTime = timeOffset;
          }
          if (autoPlay && audio.paused) {
            await audio.play();
            setIsPlaying(true);
          }
          return;
        }
  
        // Reset state for new track
        audio.pause();
        
        // Don't reset currentTime here to avoid race conditions
        setIsPlaying(false);
  
        let playbackSuccess = false;
  
        // For Safari/iOS, use direct streaming
        if (isSafari || isiOS) {
          try {
            const streamUrl = `${API_BASE_URL}/api/track/${track.id}.mp3`;
            audio.src = streamUrl;
            playbackSuccess = true;
          } catch (error) {
            console.error('Safari direct streaming failed:', error);
          }
        } else {
          // Try offline blob first
          try {
            const blob = await getOfflineBlob(track.id);
            if (blob) {
              currentObjectUrl = URL.createObjectURL(blob);
              audio.src = currentObjectUrl;
              playbackSuccess = true;
            }
          } catch (error) {
            console.error('Offline blob playback failed:', error);
          }
  
          // If offline blob failed, try MSE streaming
          if (!playbackSuccess) {
            try {
              cleanup(); // Clean up any previous resources
              
              currentStreamer = new AudioStreamer(audio, progress => {
                console.log(`Loading: ${progress.progress.toFixed(1)}%`);
              });
  
              await currentStreamer.streamAudio(`${API_BASE_URL}/api/track/${track.id}.mp3`);
              playbackSuccess = true;
            } catch (error) {
              console.error('MSE streaming failed:', error);
              cleanup();
            }
          }
  
          // If both offline and MSE failed, fallback to direct streaming
          if (!playbackSuccess) {
            try {
              cleanup(); // Clean up any previous resources
              console.log('Falling back to direct streaming...');
              const streamUrl = `${API_BASE_URL}/api/track/${track.id}.mp3`;
              audio.src = streamUrl;
              playbackSuccess = true;
            } catch (error) {
              console.error('Direct streaming fallback failed:', error);
            }
          }
        }
  
        if (!playbackSuccess) {
          throw new Error('All playback methods failed');
        }
  
        setCurrentTrack(track);
  
        // Wait for audio to be ready
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
          }, 10000);
  
          const loadedHandler = () => {
            clearTimeout(timeoutId);
            audio.removeEventListener('loadeddata', loadedHandler);
            audio.removeEventListener('error', errorHandler);
            resolve();
          };
  
          const errorHandler = (e: ErrorEvent) => {
            clearTimeout(timeoutId);
            audio.removeEventListener('loadeddata', loadedHandler);
            audio.removeEventListener('error', errorHandler);
            reject(e.error || new Error('Audio loading failed'));
          };
  
          audio.addEventListener('loadeddata', loadedHandler);
          audio.addEventListener('error', errorHandler);
        });
  
        // Now that loading is confirmed successful, set the time offset
        if (timeOffset > 0) {
          audio.currentTime = timeOffset;
        }
  
        if (autoPlay) {
          await audio.play();
          setIsPlaying(true);
        }
  
      } catch (err) {
        console.error("Playback error:", err);
        cleanup();
        audio.pause();
        setIsPlaying(false);
        throw err;
      }
  
      // Set up cleanup for when audio source changes
      const handleEmptied = () => {
        cleanup();
        audio.removeEventListener('emptied', handleEmptied);
      };
      audio.addEventListener('emptied', handleEmptied, { once: true });
    },
    [currentTrack, isSafari, isiOS, setIsPlaying]
  );
  
  /**
   * Pause without discarding the current track or blob
   */
  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  /**
   * Manually seek to a position
   */
  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  /**
   * Change volume from 0..1
   */
  const onVolumeChange = useCallback((newVolume: number) => {
    if (!audioElement) return;
    const clamped = Math.min(Math.max(newVolume, 0), 1);
    audioElement.volume = clamped;
    setVolume(clamped);
    void storeSetting("volume", String(clamped));
  }, []);

  /**
   * Callback for track end
   */
  const setOnTrackEndCallback = useCallback((cb: () => void) => {
    onTrackEndCallbackRef.current = cb;
  }, []);

  /**
   * If you need the current playback time for a progress bar
   */
  const getCurrentPlaybackTime = useCallback(() => {
    if (!audioElement) return 0;
    return audioElement.currentTime;
  }, []);

  /**
   * Pre-fetch or store track data for offline
   */
  const loadAudioBuffer = useCallback(async (trackId: string): Promise<Blob | null> => {
    try {
      const existing = await getOfflineBlob(trackId);
      if (existing) return existing;

      const resp = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`);
      if (!resp.ok) {
        throw new Error("Failed to fetch track for loadAudioBuffer");
      }
      const newBlob = await resp.blob();
      await storeTrackBlob(trackId, newBlob);
      return newBlob;
    } catch (err) {
      console.error("Error loading audio buffer:", err);
      return null;
    }
  }, []);

  return {
    // Exposed states
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTime,
    currentTrack,

    // Exposed methods
    playTrackFromSource,
    pauseAudio,
    stop,
    handleSeek,
    onVolumeChange,
    getCurrentPlaybackTime,
    loadAudioBuffer,
    setOnTrackEndCallback,
    audioElement,
  };
}
