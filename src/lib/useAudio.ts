import { useCallback, useRef, useState } from 'react';
import audioContext from '../lib/audioContext';
import { getOfflineBlob, storeTrackBlob, storeSetting } from '../lib/idbWrapper';

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

  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const trackDurationRef = useRef(0);
  const trackBufferRef = useRef<AudioBuffer | null>(null);

  const getCurrentPlaybackTime = useCallback(() => {
    if (!audioContext || !sourceRef.current || trackDurationRef.current === 0) return 0;
    if (!isPlaying) return pausedAtRef.current;
    const now = audioContext.currentTime;
    const elapsed = now - startTimeRef.current;
    return Math.min(elapsed, trackDurationRef.current);
  }, [isPlaying]);

  const loadAudioBuffer = useCallback(async (trackId: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null;
    const offlineData = await getOfflineBlob(trackId);
    let arrBuf: ArrayBuffer | null = null;
    if (offlineData) {
      arrBuf = await offlineData.arrayBuffer();
    } else {
      const url = `${API_BASE_URL}/api/track/${trackId}.mp3`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const mp3 = await resp.blob();
      arrBuf = await mp3.arrayBuffer();
      await storeTrackBlob(trackId, mp3);
    }
    if (!arrBuf) return null;
    return audioContext.decodeAudioData(arrBuf);
  }, []);

  const playBuffer = useCallback(async (buffer: AudioBuffer, offset = 0) => {
    if (!audioContext) return;

    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.connect(audioContext.destination);
    }

    source.connect(gainNodeRef.current);

    sourceRef.current = source;
    startTimeRef.current = audioContext.currentTime - offset;
    pausedAtRef.current = offset;
    trackDurationRef.current = buffer.duration;
    setDuration(buffer.duration);

    source.start(0, offset);
    setIsPlaying(true);
  }, []);

  const pauseAudio = useCallback(() => {
    if (!audioContext || !sourceRef.current) return;
    const ct = getCurrentPlaybackTime();
    sourceRef.current.stop();
    sourceRef.current.disconnect();
    sourceRef.current = null;
    pausedAtRef.current = ct;
    setIsPlaying(false);
  }, [getCurrentPlaybackTime]);

  const handleSeek = useCallback((time: number) => {
    if (!trackBufferRef.current) return;
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    void playBuffer(trackBufferRef.current, time);
  }, [playBuffer]);

  const playTrackFromSource = useCallback(async (track: Track, timeOffset = 0) => {
    try {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      const buffer = await loadAudioBuffer(track.id);
      if (!buffer) {
        console.error('Could not load audio buffer for track:', track);
        return;
      }

      trackBufferRef.current = buffer;
      await playBuffer(buffer, timeOffset);
    } catch (err) {
      console.error('Error playing track:', err);
    }
  }, [loadAudioBuffer, playBuffer]); // Removed loadAudioBuffer from dependencies

  const onVolumeChange = useCallback((v: number) => {
    setVolume(v);
    void storeSetting('volume', String(v));
    if (sourceRef.current && audioContext) {
      const g = sourceRef.current.context.createGain();
      g.gain.value = v;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = v;
    }
  }, []);

  return {
    // State
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    volume,
    setVolume,
  
    // Functions
    getCurrentPlaybackTime,
    playBuffer,
    pauseAudio,
    handleSeek,
    playTrackFromSource,
    onVolumeChange,
    loadAudioBuffer, // Added this
    
    // Refs
    trackBufferRef,
    sourceRef,
    gainNodeRef,
    startTimeRef,
    pausedAtRef,
    trackDurationRef,
  };
}