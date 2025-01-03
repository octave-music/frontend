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
  const lastTrackRef = useRef<Track | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentBlobUrlRef = useRef<string | null>(null);
  const wasTabHidden = useRef<boolean>(false);

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
      lastTimeRef.current = newTime; // Keep track of the last known time
      
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Add event listeners
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

  // Function to fetch fresh track data
  const fetchTrackData = useCallback(async (trackId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`);
    if (!response.ok) {
      throw new Error("Failed to fetch the track from the server.");
    }
    const audioBlob = await response.blob();
    await storeTrackBlob(trackId, audioBlob); // Cache for future use
    return audioBlob;
  }, []);

  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset = 0, forceFresh = false) => {
      try {
        if (!audioElement) {
          console.error("Audio element not available");
          return;
        }

        lastTrackRef.current = track;

        try {
          audioElement.pause();
        } catch (pauseError) {
          console.error("Error pausing current playback:", pauseError);
        }

        cleanupBlobUrl();

        let audioBlob: Blob;
        
        // If forceFresh is true or we're resuming after tab was hidden, 
        // fetch new data regardless of cache
        if (forceFresh || wasTabHidden.current) {
          audioBlob = await fetchTrackData(track.id);
          wasTabHidden.current = false; // Reset the flag
        } else {
          // Try cache first
          const cachedBlob = await getOfflineBlob(track.id);
          if (cachedBlob) {
            audioBlob = cachedBlob;
          } else {
            audioBlob = await fetchTrackData(track.id);
          }
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        currentBlobUrlRef.current = objectUrl;

        return new Promise<void>((resolve) => {
          if (!audioElement) {
            cleanupBlobUrl();
            resolve();
            return;
          }

          audioElement.src = objectUrl;

          const handleLoadedData = async () => {
            if (!audioElement) return;
            
            audioElement.currentTime = timeOffset;
            lastTimeRef.current = timeOffset;

            try {
              await audioElement.play();
              setCurrentTrack(track);
              setIsPlaying(true);
            } catch (playError) {
              console.error("Play error:", playError);
              setCurrentTrack(track);
            }
            resolve();
          };

          const handleError = (e: Event) => {
            console.error("Audio loading error:", e);
            cleanupBlobUrl();
            resolve();
          };

          audioElement.addEventListener("loadeddata", handleLoadedData, { once: true });
          audioElement.addEventListener("error", handleError, { once: true });
        });
      } catch (err) {
        console.error("Error playing track:", err);
        setIsPlaying(false);
      }
    },
    [cleanupBlobUrl, fetchTrackData, setCurrentTrack, setIsPlaying]
  );

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!audioElement) return;

      if (document.hidden) {
        // Tab is being hidden
        wasTabHidden.current = true;
      } else if (lastTrackRef.current && !isPlaying) {
        // Tab is becoming visible and we have a track to resume
        const timeToResume = lastTimeRef.current;
        // Force fresh data fetch when resuming
        await playTrackFromSource(lastTrackRef.current, timeToResume, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [playTrackFromSource, isPlaying]);


  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    lastTimeRef.current = audioElement.currentTime; // Store the time when pausing
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    lastTimeRef.current = time;
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