/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  getOfflineBlob,
  storeTrackBlob,
  storeSetting
} from "../managers/idbWrapper";
import audioElement from "../managers/audioManager";
import { Track } from "../types/types";

/* ─────────────────────────── URLs ──────────────────────────────── */
export function getTrackUrl(id: string, q: string): string {
  switch (q) {
    case "MAX":        return `https://deezer-worker.justvinixy.workers.dev/flac/?track=${id}`;
    case "HIGH":       return `https://deezer-worker.justvinixy.workers.dev/lossless/?track=${id}`;
    case "NORMAL":     return `https://deezer-worker.justvinixy.workers.dev/320/?track=${id}`;
    case "DATA_SAVER": return `https://deezer-worker.justvinixy.workers.dev/128/?track=${id}`;
    default:           return `https://deezer-worker.justvinixy.workers.dev/320/?track=${id}`;
  }
}
function getFallbackUrl(id: string): string {
  return `https://api.octave.gold/api/track/${id}.mp3`;
}

/* ───────── Worker failure budget ──────────────────────────────── */
const FAILURE_BUDGET = 5;
let   workerFailures = 0;
const workerAllowed  = () => workerFailures < FAILURE_BUDGET;
const bumpFailure    = () => { workerFailures++; };
const resetFailures  = () => { workerFailures = 0; };

/* ───────── retry util (single GET, no HEAD) ───────────────────── */
async function getWithRetry(
  url: string,
  signal: AbortSignal,
  retries = 3
): Promise<Response> {
  let last: any;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { cache: "no-store", signal });
      if (r.ok) return r;
      last = new Error(`status ${r.status}`);
    } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, 1200));
  }
  throw last;
}

/* ───────── quick MSE util ─────────────────────────────────────── */
async function streamViaMSE(
  audio : HTMLAudioElement,
  mime  : string,
  blob  : Blob,
  resume: number,
  wasPlaying: boolean
) {
  if (!window.MediaSource || !MediaSource.isTypeSupported(mime))
    throw new Error("MSE unsupported");

  const ms = new MediaSource();
  audio.src = URL.createObjectURL(ms);
  await new Promise<void>(r => ms.addEventListener("sourceopen", () => r(), { once:true }));

  const sb = ms.addSourceBuffer(mime);
  const reader = blob.stream().getReader();

  for (let first = true;;) {
    const { value, done } = await reader.read();
    if (done) break;
    await new Promise<void>(r => {
      sb.addEventListener("updateend", () => r(), { once:true });
      sb.appendBuffer(value);
    });
    if (first) {
      audio.currentTime = resume;
      if (wasPlaying) await audio.play().catch(()=>{});
      first = false;
    }
  }
  await new Promise<void>(r => {
    sb.addEventListener("updateend", () => r(), { once:true });
    sb.appendBuffer(new Uint8Array());
  });
  ms.endOfStream();
}

/* ─────────── Hook ─────────────────────────────────────────────── */
export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration,  setDuration]  = useState(0);
  const [volume,    setVolume]    = useState(1);

  const [audioQuality, setAudioQuality] =
    useState<"MAX"|"HIGH"|"NORMAL"|"DATA_SAVER">("NORMAL");
  const [isDataSaver,  setIsDataSaver]  = useState(false);

  const onTrackEndRef = useRef<() => void>();
  const abortRef      = useRef<AbortController|null>(null);

  /* element listeners */
  useEffect(() => {
    if (!audioElement) return;
    const el = audioElement;
    const mm = () => setDuration(el.duration || 0);
    const e  = () => onTrackEndRef.current?.();
    const p  = () => setIsPlaying(true);
    const q  = () => setIsPlaying(false);
    el.addEventListener("loadedmetadata", mm);
    el.addEventListener("ended",          e);
    el.addEventListener("play",           p);
    el.addEventListener("pause",          q);
    return () => {
      el.removeEventListener("loadedmetadata", mm);
      el.removeEventListener("ended",          e);
      el.removeEventListener("play",           p);
      el.removeEventListener("pause",          q);
    };
  }, []);

  /* utils */
  const getCurrentPlaybackTime = useCallback(
    () => audioElement?.currentTime ?? 0,
    []
  );
  const handleSeek = useCallback((t:number)=>{
    if (audioElement) audioElement.currentTime = t;
  },[]);
  const onVolumeChange = useCallback((v:number)=>{
    v = Math.min(Math.max(v,0),1);
    if (audioElement) audioElement.volume = v;
    setVolume(v);
    storeSetting("volume", String(v)).catch(()=>{});
  },[]);
  const setLoop = useCallback((on:boolean)=>{
    if (audioElement) audioElement.loop = on;
  },[]);

  /* core loader */
  const playTrackFromSource = useCallback(
async (
  track: Track,
  startAt = 0,
  autoPlay = true,
  qualityOverride?: "MAX"|"HIGH"|"NORMAL"|"DATA_SAVER",
  forceFetch = false,
  userGesture = true
) => {
  if (!audioElement) return;

  // Cancel any previous fetch operations
  if (abortRef.current) {
    abortRef.current.abort();
    abortRef.current = null;
  }
  
  // Create a new abort controller with proper error handling
  const ac = new AbortController();
  abortRef.current = ac;

  // Add a check to see if we're aborted early
  const checkAborted = () => {
    if (ac.signal.aborted) {
      throw new Error("Operation cancelled");
    }
  };

  const wanted: "MAX"|"HIGH"|"NORMAL"|"DATA_SAVER" =
    isDataSaver ? "DATA_SAVER" : (qualityOverride || audioQuality);

  try {
    /* ---- LOW quality first ------------------------------------ */
    checkAborted();
    const lowKey = `${track.id}_DATA_SAVER`;
    let lowBlob = !forceFetch ? await getOfflineBlob(lowKey) : null;

    if (!lowBlob) {
      const url = workerAllowed()
        ? getTrackUrl(track.id, "DATA_SAVER")
        : getFallbackUrl(track.id);
      try {
        checkAborted();
        const r = await getWithRetry(url, ac.signal);
        resetFailures();
        lowBlob = await r.blob();
      } catch (err) {
        // Make sure it's not an abort error before bumping failure
        if (!ac.signal.aborted) {
          bumpFailure();
          checkAborted();
          const r = await getWithRetry(getFallbackUrl(track.id), ac.signal);
          lowBlob = await r.blob();
        } else {
          throw err; // Re-throw abort errors
        }
      }
      
      if (!ac.signal.aborted) {
        storeTrackBlob(lowKey, lowBlob).catch(()=>{});
      }
    }

    // Another abort check before playing
    checkAborted();

    /* play low quality */
    const prev = audioElement.src;
    audioElement.src = URL.createObjectURL(lowBlob);
    if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
    audioElement.currentTime = startAt;
    if (autoPlay && userGesture) await audioElement.play().catch(()=>{});

    if (wanted === "DATA_SAVER") return;

    /* ---- background upgrade ----------------------------------- */
    (async () => {
      try {
        const hiKey = `${track.id}_${wanted}`;
        let hiBlob = !forceFetch ? await getOfflineBlob(hiKey) : null;

        if (!hiBlob) {
          /* ── try Deezer-Worker once (with small retry loop) ── */
          const url = workerAllowed()
            ? getTrackUrl(track.id, wanted)
            : null;                       // worker disabled => skip upgrade

          if (!url) return;               // stick with 128 kb/s

          try {
            // Check if we've been aborted before making network requests
            if (ac.signal.aborted) return;
            
            const r = await getWithRetry(url, ac.signal, 3); // same util, 3 attempts
            resetFailures();
            hiBlob = await r.blob();
            
            // Check if we've been aborted before storing
            if (ac.signal.aborted) return;
            
            storeTrackBlob(hiKey, hiBlob).catch(() => {});
          } catch (err) {
            // Only bump failures if it's not an abort
            if (!ac.signal.aborted) {
              bumpFailure();                // count the failure but DO NOT fallback
              console.warn(`no ${wanted} available from Worker – staying on 128`, err);
            }
            return;                       // quit upgrade silently
          }
        }

        if (ac.signal.aborted) return;

        /* ── switch (MSE first, plain swap fallback) ─────────────────── */
        const mime =
          wanted === "MAX"  ? "audio/flac" :
          wanted === "HIGH" ? 'audio/ogg; codecs="opus"' :
                              "audio/mpeg";

        // Make sure we're still playing the same track before swapping
        // This is the key part - confirm we haven't navigated away
        if (audioElement.src && audioElement.src.includes(track.id)) {
          const wasPlaying = !audioElement.paused;
          const resumeAt   = audioElement.currentTime;

          try {
            await streamViaMSE(audioElement, mime, hiBlob, resumeAt, wasPlaying);
          } catch (err) {
            // Check again that we're still on the same track
            if (!ac.signal.aborted && audioElement.src && audioElement.src.includes(track.id)) {
              const old = audioElement.src;
              audioElement.src = URL.createObjectURL(hiBlob);
              audioElement.currentTime = resumeAt;
              if (wasPlaying) await audioElement.play().catch(() => {});
              if (old.startsWith("blob:")) URL.revokeObjectURL(old);
            }
          }
        }
      } catch (err) {
        if (!ac.signal.aborted) console.warn("upgrade failed:", err);
      }
    })();
  } catch (err) {
    // Only log non-abort errors
    if (!ac.signal.aborted) {
      console.error("Error in playTrackFromSource:", err);
    }
  }
}, [audioQuality, isDataSaver]);

  /* pause / stop */
  const pauseAudio = useCallback(()=>{
    if (audioElement) audioElement.pause();
  },[]);
  const stop = useCallback(()=>{
    abortRef.current?.abort();
    if (!audioElement) return;
    audioElement.pause();
    audioElement.removeAttribute("src");
    audioElement.load();
  },[]);

  /* offline downloader */
  const loadAudioBuffer = useCallback(async(id:string)=>{
    const key = `${id}_${audioQuality}`;
    const cached = await getOfflineBlob(key);
    if (cached) return cached;
    const url = workerAllowed()
      ? getTrackUrl(id, audioQuality)
      : getFallbackUrl(id);
    const blob = await (await fetch(url)).blob();
    await storeTrackBlob(key, blob);
    return blob;
  },[audioQuality]);

  /* flags */
  const toggleDataSaver = useCallback(async(on:boolean)=>{
    setIsDataSaver(on);
    await storeSetting("dataSaver", String(on));
    if (on) setAudioQuality("DATA_SAVER");
  },[]);
  const changeAudioQuality = useCallback(async(q:"MAX"|"HIGH"|"NORMAL"|"DATA_SAVER")=>{
    if (isDataSaver && q!=="DATA_SAVER") return;
    setAudioQuality(q);
    await storeSetting("audioQuality", q);
  },[isDataSaver]);

  /* public API (unchanged) */
  return {
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    currentTime: getCurrentPlaybackTime(),
    currentTrack: null as Track | null,
    audioQuality,
    isDataSaver,
    playTrackFromSource,
    pauseAudio,
    stop,
    handleSeek,
    onVolumeChange,
    getCurrentPlaybackTime,
    loadAudioBuffer,
    setOnTrackEndCallback: (cb:()=>void)=>{ onTrackEndRef.current = cb; },
    audioElement,
    toggleDataSaver,
    changeAudioQuality,
    setAudioQuality,
    setIsDataSaver,
    setLoop
  };
}
