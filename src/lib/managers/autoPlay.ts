/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';

interface AutoplayOptions {
  storageType?: 'session' | 'local';
  storageKey?: string;
  debugMode?: boolean;
}

interface AutoplayPermissionReturn {
  hasAutoplayPermission: boolean;
  isAudioContextStarted: boolean;
  triggerPermission: () => Promise<void>;
}

const useAutoplayPermission = (options: AutoplayOptions = {}): AutoplayPermissionReturn => {
  const {
    storageType = 'session',
    storageKey = 'hasUserInteracted',
    debugMode = false
  } = options;

  const [hasAutoplayPermission, setHasAutoplayPermission] = useState(false);
  const [isAudioContextStarted, setIsAudioContextStarted] = useState(false);

  // Use useMemo to prevent recreating AudioContext on every render
  const audioContext = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    if (typeof AudioContext !== 'undefined') {
      return new AudioContext();
    }
    // Handle webkit prefix for Safari
    if (typeof (window as any).webkitAudioContext !== 'undefined') {
      return new (window as any).webkitAudioContext();
    }
    return null;
  }, []);

  useEffect(() => {
    // Check for existing permission
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const existingPermission = storage.getItem(storageKey);

    if (existingPermission) {
      setHasAutoplayPermission(true);
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      setIsAudioContextStarted(true);
    }

    const handleInteraction = async (event: Event) => {
      if (debugMode) {
        console.log('User interaction detected:', event.type);
      }

      // Set permission state
      setHasAutoplayPermission(true);
      storage.setItem(storageKey, 'true');

      // Handle audio context
      if (audioContext && audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          setIsAudioContextStarted(true);
          if (debugMode) {
            console.log('AudioContext resumed successfully');
          }
        } catch (error) {
          console.error('Failed to resume AudioContext:', error);
        }
      }
    };

    // List of events to listen for
    const interactionEvents = [
      'click',
      'touchstart',
      'touchend',
      'mousedown',
      'keydown',
      'scroll'
    ] as const;

    // Add event listeners
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, handleInteraction, { once: true });
    });

    // Cleanup
    return () => {
      interactionEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleInteraction);
      });
    };
  }, [audioContext, storageType, storageKey, debugMode]);

  const triggerPermission = async (): Promise<void> => {
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    setHasAutoplayPermission(true);
    storage.setItem(storageKey, 'true');

    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        setIsAudioContextStarted(true);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  };

  return {
    hasAutoplayPermission,
    isAudioContextStarted,
    triggerPermission
  };
};

export default useAutoplayPermission;