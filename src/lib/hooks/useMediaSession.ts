import { Track } from "../types/types";

interface MediaSessionHandlers {
  getCurrentPlaybackTime: () => number;
  handleSeek: (time: number) => void;
  playTrackFromSource: (track: Track, startTime?: number) => Promise<(() => void) | undefined>;
  pauseAudio: () => void;
  previousTrackFunc: () => void;
  skipTrack: () => void;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}
export function setupMediaSession(
  currentTrack: Track | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers
) {
  if (
    typeof window === "undefined" ||
    !("mediaSession" in navigator) ||
    !currentTrack ||
    !handlers.audioRef.current
  ) {
    return () => {};
  }

  const setPositionStateIfValid = () => {
    if (
      handlers.audioRef.current &&
      handlers.audioRef.current.duration &&
      handlers.audioRef.current.currentTime <=
        handlers.audioRef.current.duration
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: handlers.audioRef.current.duration,
          playbackRate: handlers.audioRef.current.playbackRate,
          position: handlers.audioRef.current.currentTime,
        });
      } catch (e) {
        console.warn("Failed to set position state:", e);
      }
    }
  };

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.name,
      album: currentTrack.album.title,
      artwork: [
        {
          src: currentTrack.album.cover_small,
          sizes: "56x56",
          type: "image/jpeg",
        },
        {
          src: currentTrack.album.cover_medium,
          sizes: "128x128",
          type: "image/jpeg",
        },
        {
          src: currentTrack.album.cover_big,
          sizes: "256x256",
          type: "image/jpeg",
        },
        {
          src: currentTrack.album.cover_xl,
          sizes: "512x512",
          type: "image/jpeg",
        },
      ],
    });

    if (navigator.mediaSession.metadata) {
      // @ts-expect-error - This is a non-standard property that might work in some browsers
      navigator.mediaSession.metadata.applicationName = "Octave Streaming";
    }

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    navigator.mediaSession.setActionHandler("play", () => {
      if (!isPlaying && currentTrack && handlers.audioRef.current) {
        void handlers.audioRef.current.play();
        handlers.setIsPlaying(true);
        navigator.mediaSession.playbackState = "playing";
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (isPlaying && handlers.audioRef.current) {
        handlers.audioRef.current.pause();
        handlers.setIsPlaying(false);
        navigator.mediaSession.playbackState = "paused";
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", handlers.skipTrack);
    navigator.mediaSession.setActionHandler(
      "previoustrack",
      handlers.previousTrackFunc
    );

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null && handlers.audioRef.current) {
        const clampedSeekTime = Math.min(
          details.seekTime,
          handlers.audioRef.current.duration || 0
        );

        // Only seek if the target time is different from the current time
        if (
          Math.abs(handlers.audioRef.current.currentTime - clampedSeekTime) >
          0.1
        ) {
          handlers.handleSeek(clampedSeekTime);
        }
        void handlers.audioRef.current.play(); // Ensure playback continues
        setPositionStateIfValid();
      }
    });

    const updatePositionState = () => {
      setPositionStateIfValid();
    };

    const positionInterval = setInterval(updatePositionState, 250);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && handlers.audioRef.current) {
        // Only update playback state if there's a mismatch
        const actualState = handlers.audioRef.current.paused
          ? "paused"
          : "playing";
        if (navigator.mediaSession.playbackState !== actualState) {
          navigator.mediaSession.playbackState = actualState;
        }
        setPositionStateIfValid(); // Update position state only
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(positionInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      const actions: MediaSessionAction[] = [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekto",
        "seekforward",
        "seekbackward",
      ];

      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          console.warn(`Failed to clear handler for ${action}:`, e);
        }
      });
    };
  } catch (error) {
    console.error("MediaSession API encountered an error:", error);
    return () => {};
  }
}
