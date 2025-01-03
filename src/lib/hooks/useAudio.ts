/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState, useEffect } from "react";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager";
import { Track } from "../types/types";
import { toast } from "react-toastify";

const API_BASE_URL = "https://mbck.cloudgen.xyz";

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  const lastTrackRef = useRef<Track | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentBlobUrlRef = useRef<string | null>(null);
  const wasTabHidden = useRef<boolean>(false);
  const playbackAttempts = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  

  const setOnTrackEndCallback = useCallback((callback: () => void) => {
    onTrackEndCallbackRef.current = callback;
  }, []);

  const getCurrentPlaybackTime = useCallback(() => {
    return audioElement?.currentTime || 0;
  }, []);

  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  const fetchTrackData = useCallback(async (trackId: string): Promise<Blob> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`, {
        signal: controller.signal,
        headers: {
          'Range': 'bytes=0-',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch track");
      }

      const audioBlob = await response.blob();
      await storeTrackBlob(trackId, audioBlob);
      return audioBlob;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset = 0, forceFresh = false) => {
      try {
        if (!audioElement) return;

        lastTrackRef.current = track;
        
        try {
          await audioElement.pause();
          audioElement.currentTime = 0;
        } catch (pauseError) {
          console.error("Pause error:", pauseError);
        }

        cleanupBlobUrl();

        let audioBlob: Blob;
        if (forceFresh || wasTabHidden.current) {
          audioBlob = await fetchTrackData(track.id);
          wasTabHidden.current = false;
        } else {
          const cachedBlob = await getOfflineBlob(track.id);
          audioBlob = cachedBlob || await fetchTrackData(track.id);
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        currentBlobUrlRef.current = objectUrl;

        return new Promise<void>((resolve) => {
          if (!audioElement) {
            cleanupBlobUrl();
            resolve();
            return;
          }

          const handleCanPlay = async () => {
            if (!audioElement) return;

            try {
              audioElement.currentTime = timeOffset;
              lastTimeRef.current = timeOffset;

              if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
              }

              await audioElement.play();
              setCurrentTrack(track);
              setIsPlaying(true);
            } catch (playError) {
              console.error("Play error:", playError);
              if (playError instanceof DOMException && playError.name === 'NotAllowedError') {
                toast.error("Please interact with the page to enable audio playback");
              }
              setIsPlaying(false);
            }
            resolve();
          };

          const handleLoadError = (e: Event) => {
            console.error("Load error:", e);
            cleanupBlobUrl();
            resolve();
          };

          audioElement.src = objectUrl;
          audioElement.load();
          audioElement.addEventListener("canplay", handleCanPlay, { once: true });
          audioElement.addEventListener("error", handleLoadError, { once: true });
        });
      } catch (err) {
        console.error("Playback error:", err);
        setIsPlaying(false);
        toast.error("Failed to play track. Please try again.");
      }
    },
    [cleanupBlobUrl, fetchTrackData]
  );

  useEffect(() => {
    if (!audioElement) return;

    initializeAudioContext();
    setVolume(audioElement.volume);
    setCurrentTime(audioElement.currentTime);
    setDuration(audioElement.duration);

    const handleTimeUpdate = () => {
      if (!audioElement) return;
      const newTime = audioElement.currentTime;
      lastTimeRef.current = newTime;
      
      setCurrentTime((prevTime) => {
        if (Math.abs(newTime - prevTime) > 0.2) {
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

    const handlePlay = () => {
      setIsPlaying(true);
      playbackAttempts.current = 0;
    };

    const handlePause = () => setIsPlaying(false);

    const handleError = async (e: Event) => {
      console.error("Audio error:", e);
      if (playbackAttempts.current < RETRY_ATTEMPTS && lastTrackRef.current) {
        playbackAttempts.current++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        playTrackFromSource(lastTrackRef.current, lastTimeRef.current, true);
      } else {
        toast.error("Playback failed. Please try again.");
      }
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("error", handleError);

    return () => {
      if (!audioElement) return;
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("error", handleError);
    };
  }, [initializeAudioContext, playTrackFromSource]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioElement) return;

      if (document.hidden) {
        wasTabHidden.current = true;
        lastTimeRef.current = audioElement.currentTime;
        await audioElement.pause();
      } else if (lastTrackRef.current && wasTabHidden.current) {
        await playTrackFromSource(lastTrackRef.current, lastTimeRef.current, true);
      }
    };

    const handleFocus = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
    };
  }, [playTrackFromSource]);

  const pauseAudio = useCallback(async () => {
    if (!audioElement) return;
    lastTimeRef.current = audioElement.currentTime;
    await audioElement.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback(async (time: number) => {
    if (!audioElement) return;
    lastTimeRef.current = time;
    audioElement.currentTime = time;
  }, []);

  const onVolumeChange = useCallback(async (v: number) => {
    if (!audioElement) return;
    setVolume(v);
    audioElement.volume = v;
    await storeSetting("volume", String(v));
  }, []);

  const loadAudioBuffer = useCallback(async (trackId: string): Promise<Blob | null> => {
    try {
      const offlineData = await getOfflineBlob(trackId);
      if (offlineData) return offlineData;

      const blob = await fetchTrackData(trackId);
      return blob;
    } catch (error) {
      console.error("Buffer error:", error);
      return null;
    }
  }, [fetchTrackData]);

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