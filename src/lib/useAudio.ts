import { useCallback, useRef, useState, useEffect } from 'react';
import { storeTrackBlob, getOfflineBlob, storeSetting } from '../lib/idbWrapper';
import audioElement from '../lib/audioManager';

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

const API_BASE_URL = 'https://mbck.cloudgen.xyz';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  
  const onTrackEndCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Set initial values
    setVolume(audioElement.volume);
    setCurrentTime(audioElement.currentTime);
    setDuration(audioElement.duration);

    const handleTimeUpdate = () => {
      if (audioElement){
        setCurrentTime(audioElement.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioElement){
        setDuration(audioElement.duration);
      }
    };

    const handleEnded = () => {
      if (onTrackEndCallbackRef.current) {
        onTrackEndCallbackRef.current();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Add event listeners
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);

    // Cleanup
    return () => {
      if (!audioElement) return;
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
    };
  }, []);

  const setOnTrackEndCallback = useCallback((callback: () => void) => {
    onTrackEndCallbackRef.current = callback;
  }, []);

  const getCurrentPlaybackTime = useCallback(() => {
    return audioElement?.currentTime || 0;
  }, []);

  const playTrackFromSource = useCallback(async (track: Track, timeOffset = 0) => {
    try {
      if (!audioElement) return;

      // Check offline storage first
      const offlineData = await getOfflineBlob(track.id);
      
      if (offlineData) {
        const objectUrl = URL.createObjectURL(offlineData);
        audioElement.src = objectUrl;
        // Clean up the object URL after it's loaded
        audioElement.onloadeddata = () => {
          URL.revokeObjectURL(objectUrl);
        };
      } else {
        audioElement.src = `${API_BASE_URL}/api/track/${track.id}.mp3`;
      }

      audioElement.currentTime = timeOffset;
      await audioElement.play();
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing track:', err);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (!audioElement) return;
    audioElement.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (!audioElement) return;
    audioElement.currentTime = time;
  }, []);

  const onVolumeChange = useCallback((v: number) => {
    if (!audioElement) return;
    setVolume(v);
    audioElement.volume = v;
    void storeSetting('volume', String(v));
  }, []);

  const loadAudioBuffer = useCallback(async (trackId: string): Promise<Blob | null> => {
    const offlineData = await getOfflineBlob(trackId);
    if (offlineData) return offlineData;

    try {
      const url = `${API_BASE_URL}/api/track/${trackId}.mp3`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const mp3 = await resp.blob();
      await storeTrackBlob(trackId, mp3);
      return mp3;
    } catch (error) {
      console.error('Error loading audio buffer:', error);
      return null;
    }
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    volume,
    setVolume,
    currentTime,
    getCurrentPlaybackTime,
    pauseAudio,
    handleSeek,
    playTrackFromSource,
    onVolumeChange,
    loadAudioBuffer,
    audioElement,
    setOnTrackEndCallback,
  };
}