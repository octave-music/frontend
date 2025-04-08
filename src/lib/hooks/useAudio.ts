/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useCallback, useEffect } from "react";
import { Track } from "../types/types";
import {
  storeTrackBlob,
  getOfflineBlob,
  storeSetting,
} from "../managers/idbWrapper";

/* ------------------------------------------------------------------
   CONFIGURATION
------------------------------------------------------------------ */
// const CROSSFADE_DURATION = 2000; // in ms
// const CROSSFADE_STEPS = 20;      // how many small volume steps

function getFileExtension(quality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER") {
  switch (quality) {
    case "MAX":
      return ".flac";
    case "HIGH":
      return ".opus";
    case "DATA_SAVER":
      return ".s4.opus";
    case "NORMAL":
    default:
      return ".mp3";
  }
}

export function getTrackUrl(
  trackId: string,
  audioQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"
): string {
  return `https://api.octave.gold/api/track/${trackId}${getFileExtension(audioQuality)}`;
}

/** Ping the URL with a HEAD request to warm up the CDN. */
async function pingTrackUrl(
  trackId: string,
  audioQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"
) {
  const url = getTrackUrl(trackId, audioQuality);
  try {
    await fetch(url, { method: "HEAD", cache: "no-store" });
  } catch {
    // no-op
  }
}

/** Basic fetch with retry. */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  retryDelay = 1500
) {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, { ...options, cache: "no-store" });
      if (resp.ok) return resp;
      lastError = new Error(`HTTP ${resp.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, retryDelay));
  }
  throw lastError;
}

/**
 * Try to fetch the requested quality. If `MAX` fails, fallback to
 * "HIGH → NORMAL → DATA_SAVER." If the requestedQuality is not MAX
 * and fails, we throw an error instead of multiple fallbacks.
 */
async function fetchWithFallback(
  trackId: string,
  requestedQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER",
  signal: AbortSignal
): Promise<{ blob: Blob; usedQuality: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER" }> {
  await pingTrackUrl(trackId, requestedQuality);

  const mainUrl = getTrackUrl(trackId, requestedQuality);
  try {
    const mainResp = await fetchWithRetry(mainUrl, { signal }, 2, 1500);
    if (mainResp.ok) {
      return { blob: await mainResp.blob(), usedQuality: requestedQuality };
    }
  } catch (err) {
    // We'll fallback below only if requestedQuality === 'MAX'
  }

  // If requestedQuality != 'MAX', we do not fallback further.
  if (requestedQuality !== "MAX") {
    throw new Error(`Fetch with fallback failed for ${requestedQuality}`);
  }

  // Fallback order: HIGH -> NORMAL -> DATA_SAVER
  const fallbackOrder: Array<"HIGH" | "NORMAL" | "DATA_SAVER"> = ["HIGH", "NORMAL", "DATA_SAVER"];
  for (const q of fallbackOrder) {
    await pingTrackUrl(trackId, q);
    const url2 = getTrackUrl(trackId, q);
    try {
      const resp2 = await fetchWithRetry(url2, { signal }, 2, 1500);
      if (resp2.ok) return { blob: await resp2.blob(), usedQuality: q };
    } catch {
      // keep going
    }
  }

  throw new Error("All fallback attempts (MAX->HIGH->NORMAL->DATA_SAVER) failed");
}

/**
 * FIXED: Completely stop the old audio before attempting to play the new one
 * This prevents any overlap between audio elements.
 */
async function crossfade(
  oldAudio: HTMLAudioElement,
  newAudio: HTMLAudioElement,
  finalVolume: number
) {
  // IMPROVEMENT: Force immediate stop of old audio BEFORE new audio starts
  oldAudio.pause();
  oldAudio.currentTime = 0;
  
  // Set the new audio's initial volume
  newAudio.volume = finalVolume;
  
  // Clean up old audio element completely
  oldAudio.src = "";
  try {
    // Force garbage collection of media resources
    oldAudio.load();
  } catch (e) {
    // Ignore any errors during cleanup
  }
}

/** 
 * Global user interaction detection 
 */
let userInteractionDetected = false;

if (typeof window !== 'undefined') {
  const interactionEvents = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'];
  const handleUserInteraction = () => {
    userInteractionDetected = true;
    interactionEvents.forEach(event => 
      window.removeEventListener(event, handleUserInteraction));
  };
  interactionEvents.forEach(event => 
    window.addEventListener(event, handleUserInteraction));
}

/* ------------------------------------------------------------------
   useAudio HOOK
------------------------------------------------------------------ */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const [audioQuality, setAudioQuality] = useState<"MAX" | "HIGH" | "NORMAL" | "DATA_SAVER">("NORMAL");
  const [isDataSaver, setIsDataSaver] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);

  const [activeRef, setActiveRef] = useState<"A" | "B">("A");
  const onTrackEndCallbackRef = useRef<() => void>(() => {});
  const autoplayQueueRef = useRef<Array<() => Promise<void>>>([]);
  const processingAutoplayRef = useRef(false);

  // Track switching lock mechanism
  const trackSwitchInProgressRef = useRef(false);
  
  // Manage whether the browser blocked autoplay
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Set up user interaction detection on mount
  useEffect(() => {
    setHasUserInteracted(userInteractionDetected);

    const updateHasInteracted = () => {
      setHasUserInteracted(true);
      processAutoplayQueue();
    };

    if (!userInteractionDetected) {
      const events = ['click','touchstart','touchend','mousedown','keydown'];
      events.forEach(event => window.addEventListener(event, updateHasInteracted, { once: true }));
      return () => {
        events.forEach(event => window.removeEventListener(event, updateHasInteracted));
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create the two audio elements once
  useEffect(() => {
    if (!audioARef.current) {
      audioARef.current = new Audio();
      audioARef.current.preload = "auto";
    }
    if (!audioBRef.current) {
      audioBRef.current = new Audio();
      audioBRef.current.preload = "auto";
    }
    
    const cleanupAudio = (audio: HTMLAudioElement) => {
      if (audio) {
        audio.pause();
        audio.src = "";
        audio.load();
        audio.volume = 0;
      }
    };
    
    cleanupAudio(audioARef.current);
    cleanupAudio(audioBRef.current);
    
    return () => {
      cleanupAudio(audioARef.current!);
      cleanupAudio(audioBRef.current!);
    };
  }, []);

  const processAutoplayQueue = useCallback(async () => {
    if (processingAutoplayRef.current) return;
    
    processingAutoplayRef.current = true;
    while (autoplayQueueRef.current.length > 0) {
      const playFn = autoplayQueueRef.current.shift();
      if (playFn) {
        try {
          await playFn();
        } catch (err) {
          console.warn("[useAudio] Error processing autoplay queue:", err);
        }
      }
    }
    processingAutoplayRef.current = false;
  }, []);

  // Attempt to play audio, handling blocked scenarios
  const safePlayAudio = useCallback(async (audio: HTMLAudioElement): Promise<boolean> => {
    if (!audio) return false;
    
    // IMPROVEMENT: Make sure any pending play operation is reset
    if (audio.readyState === 0) {
      console.warn("[useAudio] Audio not ready to play yet");
      return false;
    }
    
    try {
      await audio.play();
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        console.warn("[useAudio] Autoplay blocked, waiting for user interaction");
        setAutoplayBlocked(true);
        return false;
      }
      console.error("[useAudio] Error playing audio:", err);
      return false;
    }
  }, []);

  const getActiveAudio = useCallback(() => {
    return activeRef === "A" ? audioARef.current : audioBRef.current;
  }, [activeRef]);

  const getInactiveAudio = useCallback(() => {
    return activeRef === "A" ? audioBRef.current : audioARef.current;
  }, [activeRef]);

  /** Attach ended listener only to active audio. Remove from inactive. */
  useEffect(() => {
    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();
    if (!activeAudio || !inactiveAudio) return;

    // IMPROVEMENT: Make sure the inactive audio is really stopped
    inactiveAudio.onended = null;
    inactiveAudio.pause();
    inactiveAudio.currentTime = 0;

    // attach to new
    const handleEnded = () => {
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
    };
    activeAudio.onended = handleEnded;

    return () => {
      activeAudio.onended = null;
    };
  }, [activeRef, getActiveAudio, getInactiveAudio]);

  /** The main function to load & crossfade a new track. */
  const playTrackFromSource = useCallback(
    async (
      track: Track,
      timeOffset = 0,
      autoPlay = false,
      qualityOverride?: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER",
      forceFetch = false,
      skipUserInteractionCheck = false
    ) => {
      if (!track) return;

      // IMPROVEMENT: Better track switching lock with timeout protection
      if (trackSwitchInProgressRef.current) {
        console.warn("[useAudio] Track switch already in progress; ignoring new request");
        return;
      }

      // Set a timeout to release the lock in case of error
      trackSwitchInProgressRef.current = true;
      const lockTimeout = setTimeout(() => {
        trackSwitchInProgressRef.current = false;
      }, 5000); // Force timeout after 5 seconds

      try {
        const requested = isDataSaver ? "DATA_SAVER" : (qualityOverride || audioQuality);

        const oldAudio = getActiveAudio();
        const newAudio = getInactiveAudio();
        if (!oldAudio || !newAudio) {
          return;
        }

        // IMPROVEMENT: Stop any current playback first
        oldAudio.pause();
        newAudio.pause();

        // Fetch or retrieve from IDB
        const key = `${track.id}_${requested}`;
        let offlineBlob = (await getOfflineBlob(key)) ?? null;
        if (!offlineBlob || forceFetch) {
          try {
            const ab = new AbortController();
            const { blob, usedQuality } = await fetchWithFallback(track.id, requested, ab.signal);
            offlineBlob = blob;
            await storeTrackBlob(`${track.id}_${usedQuality}`, blob);
          } catch (err) {
            console.warn("[useAudio] Could not fetch track:", err);
            return;
          }
        }

        // IMPROVEMENT: Properly clean up the new audio before setting source
        newAudio.pause();
        newAudio.src = "";
        newAudio.load();
        
        // Set the new source
        newAudio.src = URL.createObjectURL(offlineBlob);
        newAudio.volume = 0; // Start at zero volume
        newAudio.currentTime = timeOffset;
        
        // IMPROVEMENT: Wait for metadata to load before continuing
        if (newAudio.readyState === 0) {
          await new Promise<void>((resolve) => {
            const handleLoaded = () => {
              newAudio.removeEventListener('loadedmetadata', handleLoaded);
              resolve();
            };
            newAudio.addEventListener('loadedmetadata', handleLoaded, { once: true });
            
            // Fallback if metadata never loads
            setTimeout(resolve, 2000);
          });
        }

        // Switch the active reference BEFORE attempting to play
        setActiveRef((prev) => (prev === "A" ? "B" : "A"));
        
        // Always crossfade to ensure the old audio is properly stopped
        await crossfade(oldAudio, newAudio, volume);
        
        // Update track info
        setCurrentTrack(track);
        setDuration(newAudio.duration || 0);
        
        // Play if needed
        if (autoPlay) {
          const playSuccess = await safePlayAudio(newAudio);
          if (playSuccess) {
            setIsPlaying(true);
          } else if (hasUserInteracted || skipUserInteractionCheck || userInteractionDetected) {
            // Queue for later play
            autoplayQueueRef.current.push(async () => {
              const success = await safePlayAudio(newAudio);
              if (success) setIsPlaying(true);
            });
            processAutoplayQueue();
          }
        }
      } catch (error) {
        console.error("[useAudio] Error in playTrackFromSource:", error);
      } finally {
        clearTimeout(lockTimeout);
        trackSwitchInProgressRef.current = false;
      }
    },
    [
      audioQuality,
      isDataSaver,
      volume,
      getActiveAudio,
      getInactiveAudio,
      safePlayAudio,
      hasUserInteracted,
      processAutoplayQueue
    ]
  );

  /** Resume playback of the active audio. */
  const resumeAudio = useCallback(async () => {
    // IMPROVEMENT: Don't resume if track switch is in progress
    if (trackSwitchInProgressRef.current) {
      console.warn("[useAudio] Track switch in progress; ignoring resume request");
      return;
    }
    
    const audio = getActiveAudio();
    if (!audio) return;
    
    const playSuccess = await safePlayAudio(audio);
    if (playSuccess) {
      setIsPlaying(true);
    } else if (hasUserInteracted || userInteractionDetected) {
      autoplayQueueRef.current.push(async () => {
        const success = await safePlayAudio(audio);
        if (success) setIsPlaying(true);
      });
      processAutoplayQueue();
    }
  }, [getActiveAudio, safePlayAudio, hasUserInteracted, processAutoplayQueue]);

  /** Pause whichever audio is active. */
  const pauseAudio = useCallback(() => {
    // IMPROVEMENT: Also pause the inactive audio to be safe
    const activeAudio = getActiveAudio();
    const inactiveAudio = getInactiveAudio();
    
    if (activeAudio) {
      activeAudio.pause();
    }
    
    if (inactiveAudio) {
      inactiveAudio.pause();
    }
    
    setIsPlaying(false);
  }, [getActiveAudio, getInactiveAudio]);

  /** Toggle play/pause. */
  const togglePlayPause = useCallback(() => {
    // IMPROVEMENT: Don't toggle if track switch is in progress
    if (trackSwitchInProgressRef.current) {
      console.warn("[useAudio] Track switch in progress; ignoring toggle request");
      return;
    }
    
    if (isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        userInteractionDetected = true;
      }
    }
  }, [isPlaying, pauseAudio, resumeAudio, hasUserInteracted]);

  /** Stop everything and reset. */
  const stop = useCallback(() => {
    if (audioARef.current) {
      audioARef.current.pause();
      audioARef.current.src = "";
      audioARef.current.load();
    }
    if (audioBRef.current) {
      audioBRef.current.pause();
      audioBRef.current.src = "";
      audioBRef.current.load();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  /** Seek the active track. */
  const handleSeek = useCallback((time: number) => {
    // IMPROVEMENT: Don't seek if track switch is in progress
    if (trackSwitchInProgressRef.current) {
      console.warn("[useAudio] Track switch in progress; ignoring seek request");
      return;
    }
    
    const audio = getActiveAudio();
    if (audio) {
      audio.currentTime = time;
    }
  }, [getActiveAudio]);

  /** Parent can set a stable callback for "ended" events. */
  const setOnTrackEndCallback = useCallback((cb: () => void) => {
    onTrackEndCallbackRef.current = cb;
  }, []);

  /** Volume slider. */
  const onVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    const audio = getActiveAudio();
    if (audio) {
      audio.volume = clamped;
    }
    void storeSetting("volume", String(clamped));
  }, [getActiveAudio]);

  /** Return currentTime of the active audio. */
  const getCurrentPlaybackTime = useCallback(() => {
    const a = getActiveAudio();
    return a ? a.currentTime : 0;
  }, [getActiveAudio]);

  /** For offline or downloading. */
  const loadAudioBuffer = useCallback(async (trackId: string) => {
    const finalQ = isDataSaver ? "DATA_SAVER" : audioQuality;
    const key = `${trackId}_${finalQ}`;
    const existing = await getOfflineBlob(key);
    if (existing) return existing;
    try {
      const ab = new AbortController();
      const { blob } = await fetchWithFallback(trackId, finalQ, ab.signal);
      await storeTrackBlob(key, blob);
      return blob;
    } catch (err) {
      console.error("[useAudio] loadAudioBuffer error:", err);
      return null;
    }
  }, [audioQuality, isDataSaver]);

  // Toggling data saver
  const toggleDataSaver = useCallback(async (on: boolean) => {
    setIsDataSaver(on);
    await storeSetting("dataSaver", String(on));
    if (on) {
      setAudioQuality("DATA_SAVER");
    }
  }, []);

  const changeAudioQuality = useCallback(async (newQ: "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER") => {
    if (isDataSaver && newQ !== "DATA_SAVER") {
      console.warn("[useAudio] DataSaver is ON. Must be DATA_SAVER or disable it first.");
      return;
    }
    setAudioQuality(newQ);
    await storeSetting("audioQuality", newQ);
  }, [isDataSaver]);

  /** If we want "repeat one" => .loop = true on the active element. */
  const setLoop = useCallback((enable: boolean) => {
    const a = getActiveAudio();
    if (a) a.loop = enable;
  }, [getActiveAudio]);

  /** Force a user interaction flag to true */
  const registerUserInteraction = useCallback(() => {
    setHasUserInteracted(true);
    userInteractionDetected = true;
    processAutoplayQueue();
  }, [processAutoplayQueue]);

  // Function to manually resume if autoplay was blocked
  const resumeAutoplay = useCallback(async () => {
    setAutoplayBlocked(false);
    const audio = getActiveAudio();
    if (audio) {
      try {
        await audio.play();
        setIsPlaying(!audio.paused);
      } catch (err) {
        console.error("[useAudio] resumeAutoplay error:", err);
      }
    }
  }, [getActiveAudio]);

  return {
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTrack,
    audioQuality,
    setAudioQuality,
    isDataSaver,
    setIsDataSaver,
    hasUserInteracted,

    // The main crossfade method:
    playTrackFromSource,

    pauseAudio,
    resumeAudio,
    togglePlayPause,
    stop,
    handleSeek,
    onVolumeChange,
    getCurrentPlaybackTime,
    loadAudioBuffer,
    toggleDataSaver,
    changeAudioQuality,
    setLoop,
    getActiveAudio,
    registerUserInteraction,

    setOnTrackEndCallback,

    // Let parents show a UI to handle blocked case
    autoplayBlocked,
    resumeAutoplay
  };
}