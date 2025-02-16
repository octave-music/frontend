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
 * MAX => .flac, HIGH => .opus, NORMAL => .mp3, DATA_SAVER => .s4.opus
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
 * Ping a track URL (HEAD request) to warm up the server or caching layer.
 */
async function pingTrackUrl(trackId: string, audioQuality: string): Promise<void> {
  const url = getTrackUrl(trackId, audioQuality);
  try {
    await fetch(url, { method: "HEAD", cache: "no-store" });
    console.log(`[pingTrackUrl] Ping succeeded for ${audioQuality} => ${url}`);
  } catch (err) {
    console.warn(`[pingTrackUrl] Ping failed for ${audioQuality} => ${url}`, err);
  }
}

/**
 * Helper: Fetch with retry logic.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  retryDelay = 3000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`[fetchWithRetry] Starting attempt ${attempt}/${retries} for ${url}`);
    if (options.signal && options.signal.aborted) {
      throw new Error("Aborted");
    }
    try {
      const response = await fetch(url, { ...options, cache: "no-store" });
      if (response.ok) {
        console.log(`[fetchWithRetry] Attempt ${attempt} succeeded for ${url}.`);
        return response;
      } else {
        console.warn(
          `[fetchWithRetry] Attempt ${attempt} for ${url} returned status ${response.status}.`
        );
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, retryDelay));
          continue;
        }
        throw new Error(
          `Failed to fetch ${url} after ${retries} attempts: status ${response.status}`
        );
      }
    } catch (err) {
      console.warn(`[fetchWithRetry] Attempt ${attempt} for ${url} threw an error:`, err);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, retryDelay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to fetch after retries (unexpected fall-through)");
}

/**
 * Fetch the track for a requested quality.
 * For quality MAX, fallback order is HIGH -> NORMAL -> DATA_SAVER if MAX fails.
 */
async function fetchWithFallback(
  trackId: string,
  requestedQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER",
  abortSignal: AbortSignal
): Promise<{ blob: Blob; usedQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER" }> {
  console.log("[fetchWithFallback] Attempting quality:", requestedQuality);
  const mainUrl = getTrackUrl(trackId, requestedQuality);

  // 1) Ping the requested quality first
  try {
    await pingTrackUrl(trackId, requestedQuality);
  } catch (pingError) {
    console.warn("[fetchWithFallback] Ping error (ignored):", pingError);
  }

  // 2) Real fetch
  let mainResp: Response;
  try {
    mainResp = await fetchWithRetry(mainUrl, { signal: abortSignal });
  } catch (err) {
    console.warn("[fetchWithFallback] Main fetch error:", err);
    mainResp = { ok: false, status: 0 } as Response;
  }

  if (mainResp.ok) {
    console.log(`[fetchWithFallback] Fetched ${requestedQuality} successfully.`);
    return { blob: await mainResp.blob(), usedQuality: requestedQuality };
  }
  console.warn(
    `[fetchWithFallback] Main fetch for ${requestedQuality} failed with status ${mainResp.status}.`
  );

  // If requested was MAX, do fallback chain: HIGH -> NORMAL -> DATA_SAVER
  if (requestedQuality === "MAX") {
    const fallbackOrder: Array<"HIGH" | "NORMAL" | "DATA_SAVER"> = [
      "HIGH",
      "NORMAL",
      "DATA_SAVER",
    ];
    for (const quality of fallbackOrder) {
      try {
        await pingTrackUrl(trackId, quality);
      } catch (pingError) {
        console.warn(`[fetchWithFallback] Ping for fallback ${quality} error:`, pingError);
      }

      try {
        const url = getTrackUrl(trackId, quality);
        const resp = await fetchWithRetry(url, { signal: abortSignal });
        if (resp.ok) {
          console.log(`[fetchWithFallback] Fallback succeeded with ${quality}.`);
          return { blob: await resp.blob(), usedQuality: quality };
        }
      } catch (err) {
        console.warn(`[fetchWithFallback] Fallback for ${quality} failed:`, err);
        continue;
      }
    }
    throw new Error("All fallback attempts failed for MAX -> HIGH -> NORMAL -> DATA_SAVER");
  }

  // Otherwise, fail if not MAX
  throw new Error(`Failed to fetch track for ${requestedQuality} after 3 retries`);
}

/**
 * The main audio hook.
 *
 * By default, it uses manual 'ended' logic. If you want a simple single‐track loop,
 * we can set audioElement.loop = true for that mode and let the browser handle it.
 */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  // Use NORMAL (mp3) unless user sets otherwise
  const [audioQuality, setAudioQuality] =
    useState<"MAX" | "HIGH" | "NORMAL" | "DATA_SAVER">("NORMAL");

  const [isDataSaver, setIsDataSaver] = useState(false);

  // You can optionally store the "repeatMode" in here if needed,
  // or just let the parent pass an onTrackEnd callback
  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------
  // Setup audioElement event listeners
  // ---------------------------------------------
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => setCurrentTime(audioElement?.currentTime || 0);
    const handleLoadedMetadata = () => setDuration(audioElement?.duration || 0);

    // This event is triggered when playback ends, but if audioElement.loop = true,
    // it typically won't fire. So only triggers for normal or repeat-all modes.
    const handleEnded = () => {
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
      // Do NOT force setIsPlaying(false); parent logic might want to skip to next track, etc.
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

  // ---------------------------------------------
  // Stop playback
  // ---------------------------------------------
  const stop = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    audioElement.removeAttribute("src");
    audioElement.load();
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  /**
   * Wait for audio to load enough data for playback.
   */
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
      audio.load();
    });

  /**
   * Play a track, optionally from a time offset, with autoPlay.
   * If user requests HIGH or MAX, we do a "NORMAL first" approach for quick start,
   * then swap to high-quality once it's fetched.
   */
  const playTrackFromSource = useCallback(
    async (
      track: Track,
      timeOffset = 0,
      autoPlay = false,
      qualityOverride?: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER",
      forceFetch: boolean = false,
      hasUserInteracted = false
    ) => {
      if (!audioElement) {
        console.warn("[useAudio] No audioElement? cannot play");
        return;
      }

      if (!hasUserInteracted && autoPlay) {
        console.warn("User has not interacted yet. Autoplay likely blocked.");
      }

      const requested: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER" =
        isDataSaver ? "DATA_SAVER" : qualityOverride || audioQuality;

      // For HIGH or MAX, do "mp3-first" approach
      if (requested !== "NORMAL") {
        // 1) Ensure we have NORMAL
        const normalKey = `${track.id}_NORMAL`;
        let mp3Blob: Blob | null = (await getOfflineBlob(normalKey)) ?? null;

        if (!mp3Blob) {
          try {
            const result = await fetchWithFallback(
              track.id,
              "NORMAL",
              new AbortController().signal
            );
            mp3Blob = result.blob;
            await storeTrackBlob(normalKey, mp3Blob);
          } catch (error) {
            console.error("[useAudio] NORMAL fetch failed:", error);
            return;
          }
        }

        // 2) Start immediate playback with mp3
        {
          const prevUrl = audioElement.src;
          const mp3Url = URL.createObjectURL(mp3Blob);
          audioElement.src = mp3Url;
          if (prevUrl.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrl);
          }
          setCurrentTrack(track);
          try {
            await waitForLoadedData(audioElement);
          } catch (loadError) {
            console.error("[useAudio] Error during mp3 load:", loadError);
          }
          audioElement.currentTime = timeOffset;
          if (autoPlay) {
            try {
              await audioElement.play();
              setIsPlaying(true);
            } catch (playErr) {
              console.error("[useAudio] Play error with NORMAL:", playErr);
            }
          }
        }

        // 3) Check if user’s requested is in IDB
        const requestedKey = `${track.id}_${requested}`;
        let highQualityBlob = await getOfflineBlob(requestedKey);
        if (highQualityBlob) {
          console.log(`[useAudio] Found ${requested} offline; switching seamlessly.`);
          const prevUrl2 = audioElement.src;
          const highQualityUrl = URL.createObjectURL(highQualityBlob);
          audioElement.src = highQualityUrl;
          if (prevUrl2.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrl2);
          }
          audioElement.currentTime = timeOffset;
          if (!audioElement.paused) {
            await audioElement.play().catch(console.error);
          }
          return;
        }

        // 4) Fetch requested
        try {
          const result = await fetchWithFallback(
            track.id,
            requested,
            new AbortController().signal
          );
          highQualityBlob = result.blob;
          const storeKey = `${track.id}_${result.usedQuality}`;
          await storeTrackBlob(storeKey, highQualityBlob);

          // Switch seamlessly
          const currentPos = audioElement.currentTime;
          const prevUrl2 = audioElement.src;
          const highQualityUrl = URL.createObjectURL(highQualityBlob);
          audioElement.src = highQualityUrl;
          if (prevUrl2.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrl2);
          }
          audioElement.currentTime = currentPos;
          if (!audioElement.paused) {
            await audioElement.play().catch(console.error);
          }
          console.log(`[useAudio] Switched to ${result.usedQuality} quality seamlessly.`);
        } catch (error) {
          console.error(
            `[useAudio] Requested quality (${requested}) fetch failed:`,
            error
          );
        }
        return;
      }

      // Case 2: requested == NORMAL
      const key = `${track.id}_NORMAL`;
      let blob: Blob | null = null;

      if (!forceFetch) {
        blob = (await getOfflineBlob(key)) ?? null;
      }

      if (!blob) {
        try {
          const result = await fetchWithFallback(
            track.id,
            "NORMAL",
            new AbortController().signal
          );
          blob = result.blob;
          await storeTrackBlob(key, blob);
        } catch (err) {
          console.error("[useAudio] Failed to fetch NORMAL quality:", err);
          return;
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      audioElement.src = blobUrl;
      setCurrentTrack(track);

      try {
        await waitForLoadedData(audioElement);
      } catch (err) {
        console.error(err);
      }
      audioElement.currentTime = timeOffset;

      if (autoPlay && hasUserInteracted) {
        try {
          await audioElement.play();
          setIsPlaying(true);
        } catch (err) {
          console.error("Playback error:", err);
        }
      }
    },
    [audioQuality, isDataSaver]
  );

  // ---------------------------------------------
  // pauseAudio
  // ---------------------------------------------
  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  // ---------------------------------------------
  // handleSeek
  // ---------------------------------------------
  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  // ---------------------------------------------
  // onVolumeChange
  // ---------------------------------------------
  const onVolumeChange = useCallback((newVolume: number) => {
    if (!audioElement) return;
    const clamped = Math.min(Math.max(newVolume, 0), 1);
    audioElement.volume = clamped;
    setVolume(clamped);
    storeSetting("volume", String(clamped)).catch(console.error);
  }, []);

  // ---------------------------------------------
  // setOnTrackEndCallback
  // ---------------------------------------------
  const setOnTrackEndCallback = useCallback((cb: () => void) => {
    onTrackEndCallbackRef.current = cb;
  }, []);

  // ---------------------------------------------
  // getCurrentPlaybackTime
  // ---------------------------------------------
  const getCurrentPlaybackTime = useCallback(() => {
    if (!audioElement) return 0;
    return audioElement.currentTime;
  }, []);

  // ---------------------------------------------
  // loadAudioBuffer
  // For “Download for offline”.
  // ---------------------------------------------
  const loadAudioBuffer = useCallback(
    async (trackId: string): Promise<Blob | null> => {
      if (!navigator.onLine) {
        console.warn("[useAudio] Can't fetch track while offline");
        return null;
      }
      try {
        const requested = isDataSaver ? "DATA_SAVER" : audioQuality;
        const key = `${trackId}_${requested}`;
        const existing = await getOfflineBlob(key);
        if (existing) {
          console.log("[useAudio.loadAudioBuffer] Reusing offline =>", key);
          return existing;
        }
        await pingTrackUrl(trackId, requested).catch(() =>
          console.warn("[useAudio.loadAudioBuffer] Ping error ignored")
        );

        const result = await fetchWithFallback(
          trackId,
          requested,
          new AbortController().signal
        );
        if (result.usedQuality !== audioQuality && !isDataSaver) {
          console.log("[useAudio] fallback changed =>", result.usedQuality);
          setAudioQuality(result.usedQuality);
        }
        const finalKey = `${trackId}_${result.usedQuality}`;
        await storeTrackBlob(finalKey, result.blob);
        return result.blob;
      } catch (err) {
        console.error("[useAudio] loadAudioBuffer() error:", err);
        return null;
      }
    },
    [audioQuality, isDataSaver]
  );

  // ---------------------------------------------
  // toggleDataSaver
  // ---------------------------------------------
  const toggleDataSaver = useCallback(async (on: boolean) => {
    setIsDataSaver(on);
    await storeSetting("dataSaver", String(on));
    if (on) {
      setAudioQuality("DATA_SAVER");
    }
  }, []);

  // ---------------------------------------------
  // changeAudioQuality
  // ---------------------------------------------
  const changeAudioQuality = useCallback(
    async (newQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER") => {
      console.log("[useAudio] changeAudioQuality =>", newQuality);
      if (!audioElement) {
        console.warn("[useAudio] no audioElement => cannot change quality");
        return;
      }
      // If dataSaver is ON, block switch away from DATA_SAVER
      if (isDataSaver && newQuality !== "DATA_SAVER") {
        console.warn("[useAudio] dataSaver ON => ignoring =>", newQuality);
        return;
      }
      setAudioQuality(newQuality);
      await storeSetting("audioQuality", newQuality);
    },
    [isDataSaver]
  );

  /**
   * For single‐track loop, you can externally call “setLoop(true)” if the app’s repeatMode is "one"
   * This toggles the real HTMLAudioElement.loop property to true or false.
   */
  const setLoop = useCallback((enable: boolean) => {
    if (!audioElement) return;
    audioElement.loop = enable;
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTime,
    currentTrack,
    audioQuality,
    isDataSaver,
    playTrackFromSource,
    pauseAudio,
    stop,
    handleSeek,
    onVolumeChange,
    getCurrentPlaybackTime,
    loadAudioBuffer,
    setOnTrackEndCallback,
    audioElement,
    toggleDataSaver,
    changeAudioQuality,
    setAudioQuality,
    setIsDataSaver,
    setLoop, // <-- new helper to turn on/off the native loop property
  };
}
