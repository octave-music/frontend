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

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const audioSourceRef = useRef<string | null>(null);
  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isiOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      if (!audioElement) return;
      setCurrentTime(audioElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!audioElement) return;
      setDuration(audioElement.duration);
    };

    const handleEnded = () => {
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
      setIsPlaying(false);
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", () => setIsPlaying(true));
    audioElement.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      if (!audioElement) return;
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", () => setIsPlaying(true));
      audioElement.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, []);

  const cleanup = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute('src');
      audioElement.load();
    }
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    if (audioSourceRef.current) {
      URL.revokeObjectURL(audioSourceRef.current);
      audioSourceRef.current = null;
    }
  }, []);

  const getCurrentPlaybackTime = useCallback(() => {
    return audioElement?.currentTime || 0;
  }, []);

  const loadAudioBuffer = useCallback(async (trackId: string): Promise<Blob | null> => {
    try {
      const offlineData = await getOfflineBlob(trackId);
      if (offlineData) return offlineData;

      const response = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`);
      if (!response.ok) {
        throw new Error(`Failed to fetch track ${trackId}`);
      }
      const blob = await response.blob();
      await storeTrackBlob(trackId, blob);
      return blob;
    } catch (error) {
      console.error("Error loading audio buffer:", error);
      return null;
    }
  }, []);

  const playTrackFromSource = useCallback(async (track: Track, timeOffset = 0): Promise<(() => void) | undefined> => {
    if (!audioElement) return;

    try {
      // Cleanup previous playback
      cleanup();
      
      // Important: Reset audio element state
      audioElement.removeAttribute('src');
      audioElement.load();
      
      // Create a new AbortController for this playback attempt
      const abortController = new AbortController();
      
      // For Safari/iOS, use direct streaming
      if (isSafari || isiOS) {
        try {
          const streamUrl = `${API_BASE_URL}/api/track/${track.id}.mp3`;
          
          // Test the URL first
          const response = await fetch(streamUrl, { 
            signal: abortController.signal 
          });
          
          if (!response.ok) throw new Error("Failed to fetch track");
          
          audioElement.src = streamUrl;
          audioElement.currentTime = timeOffset;
          await audioElement.play();
          setCurrentTrack(track);
          setIsPlaying(true);
          
          return () => {
            abortController.abort();
            cleanup();
          };
        } catch (error) {
          console.error("Error streaming track:", error);
        }
      }

      // For other browsers or if streaming failed, try offline blob first
      let blob = await getOfflineBlob(track.id);
      
      if (!blob) {
        // Fetch and store if not available offline
        const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`, {
          signal: abortController.signal
        });
        
        if (!response.ok) throw new Error("Failed to fetch track");
        blob = await response.blob();
        await storeTrackBlob(track.id, blob);
      }

      // Verify the blob is valid
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Invalid blob data");
      }

      // Create and set blob URL
      const blobUrl = URL.createObjectURL(blob);
      audioSourceRef.current = blobUrl;

      // Set up audio element
      return new Promise((resolve, reject) => {
        if (!audioElement) {
          reject(new Error("Audio element not available"));
          return;
        }

        const onCanPlay = async () => {
          try {
            audioElement!.currentTime = timeOffset;
            await audioElement!.play();
            setCurrentTrack(track);
            setIsPlaying(true);
            
            // Clean up this listener
            audioElement!.removeEventListener('canplay', onCanPlay);
            audioElement!.removeEventListener('error', onError);
            
            resolve(() => {
              abortController.abort();
              cleanup();
            });
          } catch (error) {
            reject(error);
          }
        };

        const onError = (e: Event) => {
          audioElement!.removeEventListener('canplay', onCanPlay);
          audioElement!.removeEventListener('error', onError);
          reject(new Error(`Audio loading failed: ${(e as ErrorEvent).message}`));
        };

        audioElement.addEventListener('canplay', onCanPlay);
        audioElement.addEventListener('error', onError);
        
        // Set the source
        audioElement.src = blobUrl;
        audioElement.load();
      });

    } catch (error) {
      console.error("Playback error:", error);
      cleanup();
      setIsPlaying(false);
      throw error;
    }
  }, [cleanup, isSafari, isiOS]);

  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  const onVolumeChange = useCallback((newVolume: number) => {
    if (!audioElement) return;
    const clampedVolume = Math.min(Math.max(newVolume, 0), 1);
    setVolume(clampedVolume);
    audioElement.volume = clampedVolume;
    void storeSetting("volume", String(clampedVolume));
  }, []);

  const setOnTrackEndCallback = useCallback((callback: () => void) => {
    onTrackEndCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTime,
    currentTrack,
    getCurrentPlaybackTime,
    playTrackFromSource,
    pauseAudio,
    handleSeek,
    onVolumeChange,
    loadAudioBuffer,
    setOnTrackEndCallback,
    audioElement,
  };
}