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
currentTrack: Track | null, isPlaying: boolean, audioContext: AudioContext | null, handlers: MediaSessionHandlers  ) {
    // Ensure browser environment
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) {
        console.log('No browser environment or mediaSession not available.');
        return () => {};
      }

  
    try {
      // Update Media Session metadata
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
  
      // Update playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  
      // Set up MediaSession action handlers
      navigator.mediaSession.setActionHandler('play', async () => {
        console.log('MediaSession play triggered');
        if (!isPlaying && currentTrack) {
          await handlers.playTrackFromSource(currentTrack, handlers.getCurrentPlaybackTime());
          handlers.setIsPlaying(true);
          navigator.mediaSession.playbackState = 'playing';
        }
      });
  
      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('MediaSession pause triggered');
        if (isPlaying) {
          handlers.pauseAudio();
          handlers.setIsPlaying(false);
          navigator.mediaSession.playbackState = 'paused';
        }
      });
  
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('MediaSession previous track triggered');
        handlers.previousTrackFunc();
      });
  
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('MediaSession next track triggered');
        handlers.skipTrack();
      });
  
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null && handlers.trackBufferRef.current) {
          console.log(`MediaSession seekto triggered: ${details.seekTime}`);
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
          const newTime = Math.min(
            handlers.getCurrentPlaybackTime() + 10,
            handlers.trackBufferRef.current.duration
          );
          console.log(`MediaSession seekforward triggered: New time is ${newTime}`);
          handlers.handleSeek(newTime);
        }
      });
  
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        const newTime = Math.max(handlers.getCurrentPlaybackTime() - 10, 0);
        console.log(`MediaSession seekbackward triggered: New time is ${newTime}`);
        handlers.handleSeek(newTime);
      });
  
      // Periodically update position state
      const updatePositionState = () => {
        if (handlers.trackBufferRef.current) {
          navigator.mediaSession.setPositionState({
            duration: handlers.trackBufferRef.current.duration,
            playbackRate: 1,
            position: handlers.getCurrentPlaybackTime(),
          });
        }
      };
  
      // Update position state every second
      updatePositionState();
      const positionInterval = setInterval(updatePositionState, 1000);
  
      // Return cleanup function
      return () => {
        clearInterval(positionInterval);
  
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
            console.warn(`Failed to clear handler for ${action}:`, e);
          }
        });
      };
    } catch (error) {
      console.error("MediaSession API encountered an error:", error);
      return () => {};
    }
  }
  