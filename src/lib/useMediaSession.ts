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
    silentAudio: HTMLAudioElement | null;
    playBuffer: (buffer: AudioBuffer, offset?: number) => Promise<void>;
  }
  
  export function setupMediaSession(
    currentTrack: Track | null,
    isPlaying: boolean,
    audioContext: AudioContext | null,
    handlers: MediaSessionHandlers
  ) {
    let silentAudio: HTMLAudioElement | null = null;

    if (typeof window !== 'undefined') {
        silentAudio = document.createElement('audio');
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'; // 1ms silent audio
        silentAudio.loop = true;
        document.body.appendChild(silentAudio);
      }

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
      navigator.mediaSession.setActionHandler('play', () => {
        if (!isPlaying && currentTrack) {
          const currentTime = handlers.getCurrentPlaybackTime();
          if (handlers.trackBufferRef.current) {
            handlers.playBuffer(handlers.trackBufferRef.current, currentTime);
          } else {
            void handlers.playTrackFromSource(currentTrack, currentTime);
          }
          handlers.setIsPlaying(true);
          navigator.mediaSession.playbackState = 'playing';
        }
      });
      
          
        
        navigator.mediaSession.setActionHandler('pause', () => {
            if (isPlaying) {
            handlers.pauseAudio();
            handlers.setIsPlaying(false);
            navigator.mediaSession.playbackState = 'paused';
            }
        });
  
      // In useMediaSession.ts
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (!isPlaying) return;
        handlers.skipTrack(); // This function should already handle playing the next track
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (!isPlaying) return;
        handlers.previousTrackFunc(); // This function should already handle playing the previous track
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
          const position = handlers.getCurrentPlaybackTime();
          navigator.mediaSession.setPositionState({
            duration: handlers.trackBufferRef.current.duration,
            playbackRate: 1,
            position,
          });
        }
      };
      // Update position state every second
      updatePositionState();
      const positionInterval = setInterval(updatePositionState, 250); // Update every 250ms
  
      // Return cleanup function
      return () => {
        clearInterval(positionInterval);

        if (silentAudio) {
            silentAudio.pause();
            silentAudio.remove();
          }
  
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
  