/* ------------------------------------------------------------------
   useMediaSession.ts – v3
   -------------------------------------------------------------
   ✔  “Next / Previous” behave like native remotes:
      • single click on a headset / notification button
        → **ALWAYS** skips to next / previous track
      • no more awkward “double-tap needed” bug
   ✔  keeps smart-rewind ( ⏮ after 5 s == restart ) in the UI
   ✔  still updates position state every 250 ms
   ✔  defensive error-handling & clean teardown
------------------------------------------------------------------ */

import { Track } from "../types/types";

interface MediaSessionHandlers {
  getCurrentPlaybackTime: () => number;
  handleSeek: (time: number) => void;
  playTrackFromSource: (track: Track, start?: number) => Promise<void>;
  pauseAudio: () => void;
  previousTrackFunc: () => void;
  skipTrack: () => void;
  setIsPlaying: (p: boolean) => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

/** Initialise / refresh MediaSession; returns a disposer. */
export function setupMediaSession(
  currentTrack: Track | null,
  isPlaying: boolean,
  h: MediaSessionHandlers,
) {
  /* ───────── guards ───────── */
  if (
    typeof window === "undefined" ||
    !("mediaSession" in navigator) ||
    !currentTrack ||
    !h.audioRef.current
  )
    return () => {};

  /* ───────── local helpers ───────── */
  const setPositionStateIfValid = () => {
    const a = h.audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration === 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: a.duration,
        playbackRate: a.playbackRate,
        position: Math.min(a.currentTime, a.duration),
      });
    } catch {
      /* some browsers (e.g. Firefox) don’t support it – safely ignore */
    }
  };

  /* ───────── metadata ───────── */
  navigator.mediaSession.metadata = new MediaMetadata({
    title:  currentTrack.title,
    artist: currentTrack.artist.name,
    album:  currentTrack.album.title,
    artwork: [
      { src: currentTrack.album.cover_small,  sizes: "56x56",  type: "image/jpeg" },
      { src: currentTrack.album.cover_medium, sizes: "128x128", type: "image/jpeg" },
      { src: currentTrack.album.cover_big,    sizes: "256x256", type: "image/jpeg" },
      { src: currentTrack.album.cover_xl,     sizes: "512x512", type: "image/jpeg" },
    ],
  });

  // (non-standard) app name – nice in Android’s output switcher
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  navigator.mediaSession.metadata.applicationName = "Octave Streaming";

  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

  /* ───────── action handlers ───────── */

  // play / pause are straightforward
  navigator.mediaSession.setActionHandler("play", async () => {
    if (h.audioRef.current?.paused) {
      await h.audioRef.current.play().catch(() => {/* swallow */});
      h.setIsPlaying(true);
      navigator.mediaSession.playbackState = "playing";
    }
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    if (!h.audioRef.current?.paused) {
      h.audioRef.current!.pause();
      h.setIsPlaying(false);
      navigator.mediaSession.playbackState = "paused";
    }
  });

  /* ===  MAIN CHANGE  ===================================================
     head-set / car-display “next ◄► previous” should *always* skip,
     never depend on currentTime-heuristics (that’s a UI concern).
  ===================================================================== */
  navigator.mediaSession.setActionHandler("nexttrack", () => h.skipTrack());
  navigator.mediaSession.setActionHandler("previoustrack", () => h.previousTrackFunc());

  // 10-second seek steps (or custom offset supplied by the browser)
  navigator.mediaSession.setActionHandler("seekbackward", ({ seekOffset }) => {
    const a = h.audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(a.currentTime - (seekOffset ?? 10), 0);
    setPositionStateIfValid();
  });
  navigator.mediaSession.setActionHandler("seekforward", ({ seekOffset }) => {
    const a = h.audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(a.currentTime + (seekOffset ?? 10), a.duration || Infinity);
    setPositionStateIfValid();
  });

  // precise seek
  navigator.mediaSession.setActionHandler("seekto", ({ seekTime, fastSeek }) => {
    const a = h.audioRef.current;
    if (!a || seekTime == null) return;
    if (fastSeek && "fastSeek" in a) {
      a.fastSeek(seekTime);
    } else {
      a.currentTime = Math.min(Math.max(seekTime, 0), a.duration || 0);
    }
    setPositionStateIfValid();
  });

  /* ───────── keep positionState fresh (Chrome’s scrubber) ───────── */
  const interval = setInterval(setPositionStateIfValid, 250);

  /* keep state in sync when tab regains focus (iOS Safari quirk) */
  const visHandler = () => {
    navigator.mediaSession.playbackState = h.audioRef.current?.paused
      ? "paused"
      : "playing";
    setPositionStateIfValid();
  };
  document.addEventListener("visibilitychange", visHandler);

  /* ───────── teardown ───────── */
  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", visHandler);
    (
      [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekto",
        "seekforward",
        "seekbackward",
      ] as MediaSessionAction[]
    ).forEach((action) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {/* ignore – some browsers throw */ }
    });
  };
}
