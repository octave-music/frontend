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

  const waitForLoadedData = (audio: HTMLAudioElement): Promise<void> =>
    new Promise((resolve, reject) => {
      const loadedHandler = () => {
        audio.removeEventListener("canplaythrough", loadedHandler);
        audio.removeEventListener("error", errorHandler);
        resolve();
      };
      const errorHandler = () => {
        audio.removeEventListener("canplaythrough", loadedHandler);
        audio.removeEventListener("error", errorHandler);
        reject(new Error("Audio loading failed"));
      };
      audio.addEventListener("canplaythrough", loadedHandler);
      audio.addEventListener("error", errorHandler);
      // In case load() hasn’t been called yet:
      audio.load();
    });

  // ----------------------------------------
  // playTrackFromSource
  // ----------------------------------------
  const playTrackFromSource = useCallback(
    async (
      track: Track,
      timeOffset = 0,
      autoPlay = false,
      qualityOverride?: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"
    ) => {
      if (!audioElement) {
        console.warn("[useAudio] No audioElement? cannot play");
        return;
      }
  
      // If data saver is on, override quality:
      let requested = isDataSaver ? "DATA_SAVER" : (qualityOverride || audioQuality);
  
      // SPECIAL LOGIC: If our desired quality is HIGH (opus) but the track isn’t stored yet,
      // we first fetch the mp3 version (NORMAL) for immediate playback.
      if (requested === "HIGH") {
        // Build the offline key for NORMAL (mp3)
        const normalKey = track.id + "_" + "NORMAL";
        let initialBlob: Blob | undefined = await getOfflineBlob(normalKey);
        if (!initialBlob) {
          try {
            // Quickly fetch mp3 (NORMAL) version for fast playback.
            const { blob, usedQuality } = await fetchWithFallback(
              track.id,
              "NORMAL",
              new AbortController().signal
            );
            console.log("[useAudio] Fetched NORMAL quality with usedQuality:", usedQuality);
            initialBlob = blob;
            // Store it under the NORMAL key for future use.
            await storeTrackBlob(normalKey, blob);
          } catch (error) {
            console.error("[useAudio] Normal fetch failed, falling back to requested HIGH", error);
            // If NORMAL fetch fails, fall back to the normal HIGH flow.
            requested = "HIGH";
          }
        }
        if (initialBlob) {
          // Use the mp3 blob for immediate playback.
          const prevUrl = audioElement!.src;
          const blobUrl = URL.createObjectURL(initialBlob);
          audioElement!.src = blobUrl;
          if (prevUrl.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrl);
          }
          setCurrentTrack(track);
          // Wait for the data to be loaded.
          try {
            await waitForLoadedData(audioElement!);
          } catch (e) {
            console.error("[useAudio] Error during initial mp3 load:", e);
          }
          // Seek to the provided offset.
          audioElement!.currentTime = timeOffset;
          if (autoPlay) {
            try {
              await audioElement!.play();
              setIsPlaying(true);
            } catch (playErr) {
              console.error("[useAudio] Play error with mp3:", playErr);
            }
          }
          // Now, concurrently, fetch the desired HIGH quality version (opus).
          const highAbortController = new AbortController();
          try {
            const { blob: highBlob, usedQuality } = await fetchWithFallback(
              track.id,
              "HIGH",
              highAbortController.signal
            );
            console.log("[useAudio] Fetched HIGH quality with usedQuality:", usedQuality);
            // Store the high-quality blob under its key.
            const highKey = track.id + "_" + "HIGH";
            await storeTrackBlob(highKey, highBlob);
            // Before switching, check if the same track is still playing.
            if (currentTrack?.id === track.id) {
              // Save current playback position.
              const currentPos = audioElement!.currentTime;
              // Switch to the high-quality blob.
              const prevUrl2 = audioElement!.src;
              const newUrl = URL.createObjectURL(highBlob);
              audioElement!.src = newUrl;
              // Log the previous URL to use the variable.
              console.log("[useAudio] Previous URL was:", prevUrl2);
              // Restore playback position.
              audioElement!.currentTime = currentPos;
              // Resume playback if it was already playing.
              if (!audioElement!.paused) {
                await audioElement!.play();
              }
              console.log("[useAudio] Switched to HIGH quality (opus) seamlessly.");
            }
          } catch (error) {
            console.error("[useAudio] High quality fetch failed:", error);
          }
          return; // Special branch complete.
        }
      }
  
      // ELSE: For non-HIGH cases or if above logic did not apply, run your existing logic:
      if (currentAbortControllerRef.current) {
        currentAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      currentAbortControllerRef.current = abortController;
      try {
        const offlineKey = track.id + "_" + requested;
        const existing = await getOfflineBlob(offlineKey);
        if (existing) {
          console.log("[useAudio] Found offlineKey =>", offlineKey, "Reusing offline blob");
          const prevUrl = audioElement!.src;
          const url = URL.createObjectURL(existing);
          audioElement!.src = url;
          if (prevUrl.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrl);
          }
          setCurrentTrack(track);
        } else {
          const { blob, usedQuality } = await fetchWithFallback(
            track.id,
            requested,
            abortController.signal
          );
          console.log("[useAudio] fetchWithFallback => requested:", requested, " usedQuality:", usedQuality);
          if (usedQuality !== audioQuality && !isDataSaver) {
            console.log("[useAudio] Actually fell back from", audioQuality, "to", usedQuality);
            setAudioQuality(usedQuality);
          }
          const finalKey = track.id + "_" + usedQuality;
          await storeTrackBlob(finalKey, blob);
          const blobUrl = URL.createObjectURL(blob);
          audioElement!.src = blobUrl;
          setCurrentTrack(track);
        }
  
        await new Promise<void>((resolve, reject) => {
          const loadedHandler = () => {
            if (!audioElement) return;
            audioElement!.removeEventListener("canplaythrough", loadedHandler);
            audioElement!.removeEventListener("error", errorHandler);
            resolve();
          };
          const errorHandler = () => {
            if (!audioElement) return;
            audioElement!.removeEventListener("canplaythrough", loadedHandler);
            audioElement!.removeEventListener("error", errorHandler);
            reject(new Error("Audio loading failed"));
          };
          audioElement!.addEventListener("canplaythrough", loadedHandler);
          audioElement!.addEventListener("error", errorHandler);
          audioElement!.load();
        });
  
        audioElement!.currentTime = timeOffset;
        if (autoPlay && !abortController.signal.aborted) {
          const playPromise = audioElement!.play();
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
        audioElement!.pause();
        audioElement!.removeAttribute("src");
        audioElement!.load();
        setIsPlaying(false);
      } finally {
        if (currentAbortControllerRef.current === abortController) {
          currentAbortControllerRef.current = null;
        }
      }
    },
    [audioQuality, currentTrack, isDataSaver]
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
  
      if (isDataSaver && newQuality !== "DATA_SAVER") {
        console.warn("[useAudio] dataSaver ON => ignoring =>", newQuality);
        return;
      }
  
      // Update state and persist
      setAudioQuality(newQuality);
      await storeSetting("audioQuality", newQuality);
  
      if (currentTrack) {
        const oldTime = audioElement.currentTime || 0;
        const wasPlaying = !audioElement.paused;
        console.log("[useAudio] Attempting reload with quality", newQuality, "oldTime", oldTime);
        // Pass newQuality explicitly:
        await playTrackFromSource(currentTrack, oldTime, wasPlaying, newQuality);
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
