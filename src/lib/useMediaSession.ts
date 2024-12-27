interface Track {
    id: string;
    title: string;
    artist: { name: string };
    album: {
      title: string;
      cover_medium: string;
      cover_small: string;
      cover_big: string;
      cover_xl: string;
    };
  }
  
  interface MediaSessionHandlers {
    getCurrentPlaybackTime: () => number;
    handleSeek: (time: number) => void;
    playTrackFromSource: (track: Track, startTime?: number) => Promise<void>;
    pauseAudio: () => void;
    previousTrackFunc: () => void;
    skipTrack: () => void;
    setIsPlaying: (playing: boolean) => void;
    trackBufferRef: React.MutableRefObject<AudioBuffer | null>;
  }
  
  export function setupMediaSession(
    currentTrack: Track | null,
    isPlaying: boolean,
    audioContext: AudioContext | null,
    handlers: MediaSessionHandlers
  ) {
    // Check if we're in the browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return () => {};
    }
  
    // Check for MediaSession support
    if (!('mediaSession' in navigator)) {
      console.warn("MediaSession API not supported in this browser.");
      return () => {};
    }
  
    // Check for required data
    if (!currentTrack || !audioContext) {
      return () => {};
    }
  
    try {
      // Update Media Session Metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist.name,
        album: currentTrack.album.title,
        artwork: [
          { src: currentTrack.album.cover_small, sizes: '56x56', type: 'image/jpeg' },
          { src: currentTrack.album.cover_medium, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.album.cover_big, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.album.cover_xl, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
  
      // Update Playback State
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  
      // Action Handlers
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying && currentTrack) {
          void handlers.playTrackFromSource(currentTrack, handlers.getCurrentPlaybackTime());
          handlers.setIsPlaying(true);
        }
      });
  
      navigator.mediaSession.setActionHandler('pause', () => {
        if (isPlaying) {
          handlers.pauseAudio();
          handlers.setIsPlaying(false);
        }
      });
  
      navigator.mediaSession.setActionHandler('previoustrack', handlers.previousTrackFunc);
      navigator.mediaSession.setActionHandler('nexttrack', handlers.skipTrack);
  
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && handlers.trackBufferRef.current) {
          handlers.handleSeek(details.seekTime);
          navigator.mediaSession.setPositionState({
            duration: handlers.trackBufferRef.current.duration,
            playbackRate: 1,
            position: details.seekTime,
          });
        }
      });
  
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (handlers.trackBufferRef.current) {
          const newTime = Math.min(handlers.getCurrentPlaybackTime() + 10, handlers.trackBufferRef.current.duration);
          handlers.handleSeek(newTime);
        }
      });
  
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const newTime = Math.max(handlers.getCurrentPlaybackTime() - 10, 0);
        handlers.handleSeek(newTime);
      });
  
      // Update Position State Periodically
      const updatePositionState = () => {
        if (handlers.trackBufferRef.current) {
          navigator.mediaSession.setPositionState({
            duration: handlers.trackBufferRef.current.duration,
            playbackRate: 1,
            position: handlers.getCurrentPlaybackTime(),
          });
        }
      };
  
      // Initial Position State Update
      updatePositionState();
      const positionUpdateInterval = setInterval(updatePositionState, 1000);
  
      // Return cleanup function
      return () => {
        clearInterval(positionUpdateInterval);
        
        const actions: MediaSessionAction[] = [
          'play',
          'pause',
          'previoustrack',
          'nexttrack',
          'seekto',
          'seekforward',
          'seekbackward',
        ];
        
        actions.forEach((action) => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (e) {
            console.warn(`Failed to clear ${action} handler:`, e);
          }
        });
      };
    } catch (error) {
      console.error("Media Session API error:", error);
      return () => {};
    }
  }