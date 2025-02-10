import { Track } from "../types/types";

interface MediaSessionHandlers {
  getCurrentPlaybackTime: () => number;
  handleSeek: (time: number) => void;
  playTrackFromSource: (track: Track, startTime?: number) => Promise<void>;
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

    // Modified handler for "nexttrack" to mimic UI behavior:
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const audio = handlers.audioRef.current;
      if (!audio) return;
      // If currentTime is not near the end (threshold of 5 sec), jump near the end first.
      if (audio.currentTime < (audio.duration || 0) - 5) {
        audio.currentTime = (audio.duration || 0) - 1;
        setPositionStateIfValid();
      } else {
        handlers.skipTrack();
      }
    });

    // Modified handler for "previoustrack" to mimic UI behavior:
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const audio = handlers.audioRef.current;
      if (!audio) return;
      // If currentTime is more than 5 sec, reset to start first.
      if (audio.currentTime > 5) {
        audio.currentTime = 0;
        setPositionStateIfValid();
      } else {
        handlers.previousTrackFunc();
      }
    });

    // Added improved handler for seekbackward.
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const audio = handlers.audioRef.current;
      if (!audio) return;
      const offset = details?.seekOffset || 10;
      audio.currentTime = Math.max(audio.currentTime - offset, 0);
      setPositionStateIfValid();
    });

    // Added improved handler for seekforward.
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const audio = handlers.audioRef.current;
      if (!audio) return;
      const offset = details?.seekOffset || 10;
      audio.currentTime = Math.min(audio.currentTime + offset, audio.duration || 0);
      setPositionStateIfValid();
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null && handlers.audioRef.current) {
        const audio = handlers.audioRef.current;
        const clampedSeekTime = Math.min(details.seekTime, audio.duration || 0);
        if (Math.abs(audio.currentTime - clampedSeekTime) > 0.1) {
          handlers.handleSeek(clampedSeekTime);
        }

        // Only force playback if we aren't manually paused.
        if (!audio.paused) {
          void audio.play();
        }

        setPositionStateIfValid();
      }
    });

    const updatePositionState = () => {
      setPositionStateIfValid();
    };

    const positionInterval = setInterval(updatePositionState, 250);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && handlers.audioRef.current) {
        const actualState = handlers.audioRef.current.paused ? "paused" : "playing";
        if (navigator.mediaSession.playbackState !== actualState) {
          navigator.mediaSession.playbackState = actualState;
        }
        setPositionStateIfValid();
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
