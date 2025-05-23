// src/lib/hooks/useAppSettings.ts
import { useState, useCallback, useEffect } from 'react';
import { AudioQuality, RepeatMode } from '@/components/players/Desktop/types'; 
import { storeSetting as storeSettingIDB, getSetting as getSettingIDB } from '@/lib/managers/idbWrapper';
import { useAudio } from '@/lib/hooks/useAudio';

export function useAppSettings() {
  const { 
    volume: audioHookVolume, 
    setVolume: setAudioVolumeHook, 
    setLoop: setAudioLoopHook,
    audioQuality: audioHookQuality,
    changeAudioQuality: coreChangeAudioQualityHook,
    isDataSaver: audioHookIsDataSaver
  } = useAudio();

  const [volume, setVolumeState] = useState(audioHookVolume);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>("off");
  const [shuffleOn, setShuffleOnState] = useState(false);
  const [audioQuality, setAudioQualityState] = useState<AudioQuality>(audioHookQuality);
  const [isDataSaver, setIsDataSaverState] = useState(audioHookIsDataSaver);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    setAudioVolumeHook(clampedVolume);
    void storeSettingIDB("volume", clampedVolume.toString());
  }, [setAudioVolumeHook]);

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode);
    setAudioLoopHook(mode === "one");
    void storeSettingIDB("repeatMode", mode);
  }, [setAudioLoopHook]);

  const toggleShuffle = useCallback(() => {
    setShuffleOnState(prev => {
        const next = !prev;
        void storeSettingIDB("shuffleOn", JSON.stringify(next));
        return next;
    });
  }, []);

  const setShuffle = useCallback((isOn: boolean) => {
    setShuffleOnState(isOn);
    void storeSettingIDB("shuffleOn", JSON.stringify(isOn));
  }, []);

  const changeAudioQualitySetting = useCallback(async (quality: AudioQuality) => {
    await coreChangeAudioQualityHook(quality);
    // The useEffects below will sync audioQualityState and isDataSaverState
    // with the updated values from the useAudio hook.
    void storeSettingIDB("audioQuality", quality);
  }, [coreChangeAudioQualityHook]);

  // Effect to sync local state with useAudio hook state if it changes externally
  useEffect(() => {
    // Only update if the hook's value is different to avoid potential loops
    // if setVolumeState itself triggered an update in useAudio that then came back here.
    // Though for simple state, this is usually fine.
    if (volume !== audioHookVolume) {
        setVolumeState(audioHookVolume);
    }
  }, [audioHookVolume, volume]);

  useEffect(() => {
    if (audioQuality !== audioHookQuality) {
        setAudioQualityState(audioHookQuality);
    }
  }, [audioHookQuality, audioQuality]);

  useEffect(() => {
    if (isDataSaver !== audioHookIsDataSaver) {
        setIsDataSaverState(audioHookIsDataSaver);
    }
  }, [audioHookIsDataSaver, isDataSaver]);

  // Load settings from IDB on mount
  useEffect(() => {
    async function loadSettings() {
      const [volSetting, repSetting, shufSetting, qualSetting] = await Promise.all([
        getSettingIDB("volume"),
        getSettingIDB("repeatMode"),
        getSettingIDB("shuffleOn"),
        getSettingIDB("audioQuality"),
      ]);
      
      if (volSetting !== null) setVolume(parseFloat(volSetting));
      if (repSetting !== null) setRepeatMode(repSetting as RepeatMode);
      if (shufSetting !== null) setShuffle(JSON.parse(shufSetting));
      // Ensure changeAudioQualitySetting is called only if qualSetting is valid and different
      if (qualSetting !== null && qualSetting !== audioQuality) { // Check against current state from useAudio
        await changeAudioQualitySetting(qualSetting as AudioQuality);
      }
    }
    loadSettings().catch(console.error);
  }, [setVolume, setRepeatMode, setShuffle, changeAudioQualitySetting, audioQuality]); // Added audioQuality to deps

  return {
    volume,
    setVolume,
    repeatMode,
    setRepeatMode,
    shuffleOn,
    toggleShuffle,
    setShuffle,
    audioQuality,
    changeAudioQualitySetting,
    isDataSaver,
  };
}