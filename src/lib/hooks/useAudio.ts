/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState, useEffect } from "react";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager";
import { Track } from "../types/types";

/**
 * Determine file extension from chosen quality.
 * MAX => .flac
 * HIGH => .opus
 * NORMAL => .mp3
 * DATA_SAVER => .s4.opus
 */
function getTrackUrl(trackId: string, audioQuality: string): string {
  let ext = ".mp3";
  switch (audioQuality) {
    case "MAX":
      ext = ".flac";
      break;
    case "HIGH":
      ext = ".opus";
      break;
    case "DATA_SAVER":
      ext = ".s4.opus";
      break;
    case "NORMAL":
    default:
      ext = ".mp3";
      break;
  }
  return `https://api.octave.gold/api/track/${trackId}${ext}`;
}

/**
 * Attempt to fetch the track for `requestedQuality`.
 * If 404 for .flac, we fallback to .opus => .mp3 => .s4.opus (in that order).
 */
async function fetchWithFallback(
  trackId: string,
  requestedQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER",
  abortSignal: AbortSignal
): Promise<{ blob: Blob; usedQuality: "MAX"|"HIGH"|"NORMAL"|"DATA_SAVER" }> {
  console.log("[fetchWithFallback] Attempt =>", requestedQuality);

  // 1) Try the main requested URL:
  const mainUrl = getTrackUrl(trackId, requestedQuality);
  const mainResp = await fetch(mainUrl, { signal: abortSignal });
  if (mainResp.ok) {
    console.log(`[fetchWithFallback] Fetched => ${requestedQuality} (status ${mainResp.status})`);
    return { blob: await mainResp.blob(), usedQuality: requestedQuality };
  }

  console.warn("[fetchWithFallback] main fetch failed => status:", mainResp.status);

  // 2) For "MAX" only, we fallback to "HIGH" => "NORMAL" => "DATA_SAVER":
  if (requestedQuality === "MAX") {
    // HIGH
    const fallbackHigh = await fetch(getTrackUrl(trackId, "HIGH"), { signal: abortSignal });
    if (fallbackHigh.ok) {
      console.log("[fetchWithFallback] Fallback => HIGH");
      return { blob: await fallbackHigh.blob(), usedQuality: "HIGH" };
    }
    // NORMAL
    const fallbackNorm = await fetch(getTrackUrl(trackId, "NORMAL"), { signal: abortSignal });
    if (fallbackNorm.ok) {
      console.log("[fetchWithFallback] Fallback => NORMAL");
      return { blob: await fallbackNorm.blob(), usedQuality: "NORMAL" };
    }
    // DATA_SAVER
    const fallbackDS = await fetch(getTrackUrl(trackId, "DATA_SAVER"), { signal: abortSignal });
    if (fallbackDS.ok) {
      console.log("[fetchWithFallback] Fallback => DATA_SAVER");
      return { blob: await fallbackDS.blob(), usedQuality: "DATA_SAVER" };
    }
    throw new Error("All fallback attempts failed for MAX -> HIGH -> NORMAL -> DATA_SAVER");
  }

  throw new Error(`Failed to fetch track for ${requestedQuality}`);
}

/**
 * The main audio hook that reuses offline blobs if found,
 * else fetches from the server (with fallback).
 */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // user’s chosen audio quality & data saver toggle:
  const [audioQuality, setAudioQuality] =
    useState<"MAX"|"HIGH"|"NORMAL"|"DATA_SAVER">("HIGH");
  const [isDataSaver, setIsDataSaver] = useState(false);

  // onTrackEnd callback:
  const onTrackEndCallbackRef = useRef<(() => void)|null>(null);
  const currentAbortControllerRef = useRef<AbortController|null>(null);

  // ----------------------------------------
  // Setup audioElement event listeners
  // ----------------------------------------
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement?.currentTime || 0);
    };
    const handleLoadedMetadata = () => {
      setDuration(audioElement?.duration || 0);
    };
    const handleEnded = () => {
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

  // ----------------------------------------
  // Stop + Abort
  // ----------------------------------------
  const stop = useCallback(() => {
    if (!audioElement) return;
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
      currentAbortControllerRef.current = null;
    }
    audioElement.pause();
    audioElement.removeAttribute("src");
    audioElement.load();

    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  // ----------------------------------------
  // playTrackFromSource
  // ----------------------------------------
  const playTrackFromSource = useCallback(
    async (track: Track, timeOffset=0, autoPlay=false) => {
      if (!audioElement) {
        console.warn("[useAudio] No audioElement? cannot play");
        return;
      }

      // If data saver => override
      const requested = isDataSaver ? "DATA_SAVER" : audioQuality;
      console.log("[useAudio] playTrackFromSource => track:", track.title, "Quality:", requested);

      // abort any in-flight
      if (currentAbortControllerRef.current) {
        currentAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      currentAbortControllerRef.current = abortController;

      try {
        // 1) Check if we already have that quality offline:
        const offlineKey = track.id + "_" + requested;
        const existing = await getOfflineBlob(offlineKey);
        if (existing) {
          console.log("[useAudio] Found offlineKey =>", offlineKey, "Reusing offline blob");
          const prevUrl = audioElement.src;
          const url = URL.createObjectURL(existing);
          audioElement.src = url;
          if (prevUrl.startsWith('blob:')) {
            URL.revokeObjectURL(prevUrl);
          }
          setCurrentTrack(track);
        } else {
          // 2) If not offline, fetch from server (with fallback)
          const { blob, usedQuality } = await fetchWithFallback(track.id, requested, abortController.signal);
          console.log("[useAudio] fetchWithFallback => requested:", requested, " usedQuality:", usedQuality);

          // If fallback changed the final usedQuality => update our state
          if (usedQuality !== audioQuality && !isDataSaver) {
            console.log("[useAudio] Actually fell back from", audioQuality, "to", usedQuality);
            setAudioQuality(usedQuality);
          }

          const finalKey = track.id + "_" + usedQuality;
          await storeTrackBlob(finalKey, blob);

          const blobUrl = URL.createObjectURL(blob);
          audioElement.src = blobUrl;
          setCurrentTrack(track);
        }

        // Wait for "loadeddata" so we can catch errors
        await new Promise<void>((resolve, reject) => {
          const loadedHandler = () => {
            if (!audioElement) return;
            audioElement.removeEventListener("canplaythrough", loadedHandler);
            audioElement.removeEventListener("error", errorHandler);
            resolve();
          };
          const errorHandler = () => {
            if (!audioElement) return;
            audioElement.removeEventListener("canplaythrough", loadedHandler);
            audioElement.removeEventListener("error", errorHandler);
            reject(new Error("Audio loading failed"));
          };
          if (!audioElement) return;
          audioElement.addEventListener("canplaythrough", loadedHandler);
          audioElement.addEventListener("error", errorHandler);
          audioElement.load();
        });

        // Seek
        audioElement.currentTime = timeOffset;

        // autoPlay
        if (autoPlay && !abortController.signal.aborted) {
          const playPromise = audioElement.play();
          if (playPromise) {
            await playPromise.catch((err) => {
              if (err.name !== "AbortError") {
                console.error("[useAudio] play() error after load:", err);
              }
            });
            if (!abortController.signal.aborted) {
              setIsPlaying(true);
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("[useAudio] Playback aborted");
          return;
        }
        console.error("[useAudio] Playback error:", err);
        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();
        setIsPlaying(false);
      } finally {
        if (currentAbortControllerRef.current === abortController) {
          currentAbortControllerRef.current = null;
        }
      }
    },
    [audioQuality, isDataSaver]
  );

  // ----------------------------------------
  // pauseAudio
  // ----------------------------------------
  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  // ----------------------------------------
  // handleSeek
  // ----------------------------------------
  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  // ----------------------------------------
  // onVolumeChange
  // ----------------------------------------
  const onVolumeChange = useCallback((newVolume: number) => {
    if (!audioElement) return;
    const clamped = Math.min(Math.max(newVolume, 0), 1);
    audioElement.volume = clamped;
    setVolume(clamped);
    storeSetting("volume", String(clamped)).catch(console.error);
  }, []);

  // ----------------------------------------
  // setOnTrackEndCallback
  // ----------------------------------------
  const setOnTrackEndCallback = useCallback((cb: () => void) => {
    onTrackEndCallbackRef.current = cb;
  }, []);

  // ----------------------------------------
  // getCurrentPlaybackTime
  // ----------------------------------------
  const getCurrentPlaybackTime = useCallback(() => {
    if (!audioElement) return 0;
    return audioElement.currentTime;
  }, []);

  // ----------------------------------------
  // loadAudioBuffer (for “Download for offline”)
  // same logic: if we have it => skip, else fetch
  // ----------------------------------------
  const loadAudioBuffer = useCallback(
    async (trackId: string): Promise<Blob | null> => {
      if (!navigator.onLine) {
        console.warn("[useAudio] Can't fetch track while offline");
        return null;
      }
      try {
        const requested = isDataSaver ? "DATA_SAVER" : audioQuality;
        const key = trackId + "_" + requested;
        const existing = await getOfflineBlob(key);
        if (existing) {
          console.log("[useAudio.loadAudioBuffer] Reusing offline =>", key);
          return existing;
        }

        // Not in IDB => fetch from server
        const { blob, usedQuality } = await fetchWithFallback(
          trackId,
          requested,
          new AbortController().signal
        );
        if (usedQuality !== audioQuality && !isDataSaver) {
          console.log("[useAudio] fallback changed =>", usedQuality);
          setAudioQuality(usedQuality);
        }
        const finalKey = trackId + "_" + usedQuality;
        await storeTrackBlob(finalKey, blob);
        return blob;
      } catch (err) {
        console.error("[useAudio] loadAudioBuffer() error:", err);
        return null;
      }
    },
    [audioQuality, isDataSaver]
  );

  // ----------------------------------------
  // toggleDataSaver
  // ----------------------------------------
  const toggleDataSaver = useCallback(async (on: boolean) => {
    setIsDataSaver(on);
    await storeSetting("dataSaver", String(on));
    if (on) {
      // forcibly override
      setAudioQuality("DATA_SAVER");
    }
  }, []);

  // ----------------------------------------
  // changeAudioQuality
  // ----------------------------------------
  const changeAudioQuality = useCallback(
    async (newQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER") => {
      console.log("[useAudio] changeAudioQuality CALLED =>", newQuality);
      if (!audioElement) {
        console.warn("[useAudio] no audioElement => cannot change quality");
        return;
      }

      // If data saver is ON => ignore changes that aren't data-saver
      if (isDataSaver && newQuality !== "DATA_SAVER") {
        console.warn("[useAudio] dataSaver ON => ignoring =>", newQuality);
        return;
      }

      // Update local state
      setAudioQuality(newQuality);
      await storeSetting("audioQuality", newQuality);

      if (currentTrack) {
        // We'll reload the same track at the same time offset
        const oldTime = audioElement.currentTime || 0;
        const wasPlaying = !audioElement.paused;
        console.log("[useAudio] Attempting reload =>", newQuality, " oldTime =>", oldTime);

        await playTrackFromSource(currentTrack, oldTime, wasPlaying);
      }
    },
    [currentTrack, isDataSaver, playTrackFromSource]
  );

  return {
    // State
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTime,
    currentTrack,
    audioQuality,
    isDataSaver,

    // Methods
    playTrackFromSource,
    pauseAudio,
    stop,
    handleSeek,
    onVolumeChange,
    getCurrentPlaybackTime,
    loadAudioBuffer,
    setOnTrackEndCallback,
    audioElement,

    // Toggles
    toggleDataSaver,
    changeAudioQuality,
    setAudioQuality,
    setIsDataSaver,
  };
}
