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
      try {
        if (!audioElement) {
          console.error("Audio element not available");
          return;
        }

        // First pause any current playback
        try {
          audioElement?.pause();
        } catch (pauseError) {
          console.error("Error pausing current playback:", pauseError);
        }

        // Attempt to retrieve the track's Blob from IndexedDB
        let offlineData = await getOfflineBlob(track.id);

        if (!offlineData) {
          const response = await fetch(
            `${API_BASE_URL}/api/track/${track.id}.mp3`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch the track from the server.");
          }
          offlineData = await response.blob();
          await storeTrackBlob(track.id, offlineData);
        }

        const objectUrl = URL.createObjectURL(offlineData);

        // Wait for the audio to be loaded before playing
        return new Promise<void>((resolve) => {
          if (!audioElement) {
            URL.revokeObjectURL(objectUrl);
            resolve();
            return;
          }

          audioElement.src = objectUrl;

          const handleLoadedData = async () => {
            if (!audioElement) return;

            URL.revokeObjectURL(objectUrl);
            audioElement.currentTime = timeOffset;

            try {
              await audioElement.play();
              setCurrentTrack(track);
              setIsPlaying(true);
            } catch (playError) {
              console.error("Play error:", playError);
            }
            resolve();
          };

          const handleError = (e: Event) => {
            console.error("Audio loading error:", e);
            URL.revokeObjectURL(objectUrl);
            resolve();
          };

          audioElement.addEventListener("loadeddata", handleLoadedData, {
            once: true,
          });
          audioElement.addEventListener("error", handleError, { once: true });

          audioElement.addEventListener(
            "play",
            (e) => {
              e.stopPropagation(); // Add this
            },
            true
          ); // Use capture phase

          audioElement.addEventListener(
            "playing",
            (e) => {
              e.stopPropagation(); // Add this
            },
            true
          ); // Use capture phase
        });
      } catch (err) {
        console.error("Error playing track:", err);
        setIsPlaying(false);
      }
    },
    [setCurrentTrack, setIsPlaying]
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
