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

const API_BASE_URL = "https://mbck.cloudgen.xyz";

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
    async (
      track: Track,
      timeOffset = 0,
      autoPlay = false
    ): Promise<void> => {
      if (!audioElement) return;

      // If the same track is already set, skip re-fetch unless user wants re-seek
      if (currentTrack && currentTrack.id === track.id) {
        // If user wants to re-seek from the beginning or a certain offset:
        if (Math.abs(audioElement.currentTime - timeOffset) > 0.05) {
          audioElement.currentTime = timeOffset;
        }
        // If user explicitly asked to auto-play and it's currently paused, play it
        if (autoPlay && audioElement.paused) {
          await audioElement.play().catch((err) =>
            console.error("play() error:", err)
          );
          setIsPlaying(true);
        }
        return;
      }

      // Different track => full stop and re-load
      stop();

      const abortController = new AbortController();
      currentAbortControllerRef.current = abortController;

      try {
        // iOS or Safari => direct streaming
        if (isSafari || isiOS) {
          const streamUrl = `${API_BASE_URL}/api/track/${track.id}.mp3`;
          const headResp = await fetch(streamUrl, {
            method: "HEAD",
            signal: abortController.signal,
          });
          if (!headResp.ok) {
            throw new Error(`Safari direct stream check failed for ${track.id}`);
          }
          audioElement.src = streamUrl;
        } else {
          // Non-Safari => check offline
          let blob = await getOfflineBlob(track.id);
          if (!blob) {
            const resp = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`, {
              signal: abortController.signal,
            });
            if (!resp.ok) {
              throw new Error("Failed to fetch track data");
            }
            blob = await resp.blob();
            await storeTrackBlob(track.id, blob);
          }
          if (!blob || blob.size === 0) {
            throw new Error("Empty blob for track");
          }
          const blobUrl = URL.createObjectURL(blob);
          audioElement.src = blobUrl;
        }

        audioElement.load();
        audioElement.currentTime = timeOffset;

        if (autoPlay) {
          await audioElement.play().catch((err) =>
            console.error("play() error after load:", err)
          );
          setIsPlaying(true);
        }
        setCurrentTrack(track);
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Normal if user switched quickly
        } else {
          console.error("Playback error:", err);
          stop();
        }
      } finally {
        if (currentAbortControllerRef.current === abortController) {
          currentAbortControllerRef.current = null;
        }
      }
    },
    [currentTrack, stop, isSafari, isiOS]
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
