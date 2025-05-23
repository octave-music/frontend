// src/hooks/useAppQueue.ts
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
// Corrected relative paths for a file within src/lib/hooks
import { Track } from '../types/types';
import { useAudio } from '../hooks/useAudio';
import { sanitizeTrackUtil, dedupeTracksByIdUtil } from '../utils/trackUtils';
import { storeQueue as storeQueueIDB, clearQueue as clearQueueIDB, getQueue as getQueueIDB } from '../managers/idbWrapper';
import { storeSetting as storeSettingIDB, getSetting as getSettingIDB } from '../managers/idbWrapper';

export interface UseAppQueueProps {
  initialQueue?: Track[];
  initialPreviousTracks?: Track[];
  initialCurrentTrack?: Track | null;
}

export function useAppQueue(props?: UseAppQueueProps) {
  const { playTrackFromSource, setIsPlaying: setAudioIsPlaying } = useAudio();

  const [queue, setQueueState] = useState<Track[]>(props?.initialQueue || []);
  const [previousTracks, setPreviousTracksState] = useState<Track[]>(props?.initialPreviousTracks || []);
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(props?.initialCurrentTrack || null);

  const setQueue = useCallback((updater: React.SetStateAction<Track[]>) => {
    setQueueState(prevQueue => {
      const newQueue = typeof updater === 'function' ? updater(prevQueue) : updater;
      const dedupedAndSanitized = dedupeTracksByIdUtil(newQueue.map(sanitizeTrackUtil));
      
      // If the resulting queue is empty, clear it in IDB. Otherwise, store it.
      if (dedupedAndSanitized.length > 0) {
        void storeQueueIDB(dedupedAndSanitized);
      } else {
        void clearQueueIDB(); // Ensure clearQueueIDB is called when queue becomes empty
      }
      return dedupedAndSanitized;
    });
  }, []); // clearQueueIDB is a stable function, not needed in deps if imported directly

  const setPreviousTracks = useCallback((updater: React.SetStateAction<Track[]>) => {
    setPreviousTracksState(prevTracks => {
        const newTracks = typeof updater === 'function' ? updater(prevTracks) : updater;
        const deduped = dedupeTracksByIdUtil(newTracks.map(sanitizeTrackUtil));
        void storeSettingIDB("previousTracks", JSON.stringify(deduped));
        return deduped;
    });
  }, []);

  const setCurrentTrack = useCallback((track: Track | null) => {
    const sanitized = track ? sanitizeTrackUtil(track) : null;
    setCurrentTrackState(sanitized);
    if (sanitized) {
        void storeSettingIDB("currentTrack", JSON.stringify(sanitized));
    } else {
        // When current track is cleared, also clear it from IDB
        void storeSettingIDB("currentTrack", ""); // Or handle deletion if your IDB wrapper supports it
    }
  }, []);


  const playTrack = useCallback(
    (rawTrack: Track, autoPlay = true, newQueueContext?: Track[]) => {
      const track = sanitizeTrackUtil(rawTrack);

      if (newQueueContext) {
        const sanitizedNewQueue = dedupeTracksByIdUtil(newQueueContext.map(t => sanitizeTrackUtil(t)));
        const trackInNewQueueIndex = sanitizedNewQueue.findIndex(t => t.id === track.id);
        
        let finalQueueForContext: Track[];
        if (trackInNewQueueIndex !== -1) {
            // Track is already in the new context, reorder to front if necessary
            const reordered = [track, ...sanitizedNewQueue.filter(t => t.id !== track.id)];
            finalQueueForContext = dedupeTracksByIdUtil(reordered); // Ensure deduping after reorder
        } else { 
            finalQueueForContext = dedupeTracksByIdUtil([track, ...sanitizedNewQueue]);
        }
        setQueue(finalQueueForContext);
        setPreviousTracks(currentTrack ? [sanitizeTrackUtil(currentTrack)] : []);
      } else { 
        setQueue((prev) => {
          if (prev[0]?.id === track.id && prev.length > 0) return prev; // Already at front
          const without = prev.filter((t) => t.id !== track.id);
          return [track, ...without]; 
        });
        // Only add to previousTracks if currentTrack exists and is different from the new track
        if (currentTrack && currentTrack.id !== track.id) {
            setPreviousTracks((prev) => [sanitizeTrackUtil(currentTrack), ...prev]);
        } else if (!currentTrack) {
            // If no current track, previousTracks remains unchanged unless starting fresh
        }
      }

      setCurrentTrack(track);
      void playTrackFromSource(track, 0, autoPlay);
      setAudioIsPlaying(autoPlay);
    },
    [currentTrack, playTrackFromSource, setAudioIsPlaying, setQueue, setPreviousTracks, setCurrentTrack]
  );

  const skipTrack = useCallback(() => {
    if (!currentTrack) { // No current track to skip from
        toast.info("No track playing to skip.");
        return false;
    }
    if (queue.length === 0 || (queue.length === 1 && queue[0].id === currentTrack.id)) {
      // If queue is empty or only contains the current track (which means it was the last playable)
      toast.info("No next track available.");
      // Potentially stop playback or handle repeat logic here if it's the end of everything
      // For now, we assume handleTrackEnd in AppCore will manage repeat/stop
      return false;
    }

    setPreviousTracks((prev) => [sanitizeTrackUtil(currentTrack), ...prev]);
    
    // Determine the actual next track in the queue (currentTrack might not be queue[0] if played directly)
    const currentTrackQueueIndex = queue.findIndex(t => t.id === currentTrack.id);
    let nextPlayableQueueSlice = queue;

    if (currentTrackQueueIndex !== -1 && currentTrackQueueIndex < queue.length -1) {
        nextPlayableQueueSlice = queue.slice(currentTrackQueueIndex + 1);
    } else if (currentTrackQueueIndex === -1 && queue.length > 0) { // Current track not in queue, play from start of queue
        nextPlayableQueueSlice = queue;
    } else { // At the end of queue or current track not found and queue is empty
        toast.info("End of queue.");
        // Parent (AppCore) will handle repeat logic via handleTrackEnd callback from useAudio
        return false;
    }
    
    if (nextPlayableQueueSlice.length === 0) {
        toast.info("No more tracks in queue.");
        // Let handleTrackEnd manage this scenario (e.g. repeat all might restart queue)
        return false;
    }

    const nextTrack = sanitizeTrackUtil(nextPlayableQueueSlice[0]);
    setCurrentTrack(nextTrack);
    // The queue itself is not modified here by just skipping; playing the next track will reorder it if necessary.
    // Or, if you want skip to always remove current from queue and play next:
    // setQueue(prevQ => prevQ.filter(t => t.id !== currentTrack.id)); // This removes current
    // Then play nextTrack. For now, just playing next from existing queue order.

    void playTrackFromSource(nextTrack, 0, true);
    setAudioIsPlaying(true);
    return true;
  }, [currentTrack, queue, playTrackFromSource, setAudioIsPlaying, setPreviousTracks, setCurrentTrack]);

  const previousTrack = useCallback(() => {
    if (previousTracks.length === 0) {
      toast.info("No previous track in history.");
      return false;
    }
    const trackToPlay = sanitizeTrackUtil(previousTracks[0]);
    const remainingPrevious = previousTracks.slice(1);

    setPreviousTracks(remainingPrevious);
    if (currentTrack) {
      setQueue((q) => [sanitizeTrackUtil(currentTrack), ...q]); // Add current to front of queue
    }
    setCurrentTrack(trackToPlay);
    void playTrackFromSource(trackToPlay, 0, true);
    setAudioIsPlaying(true);
    return true;
  }, [previousTracks, currentTrack, playTrackFromSource, setAudioIsPlaying, setQueue, setPreviousTracks, setCurrentTrack]);

  const addToQueue = useCallback((tracksToAdd: Track | Track[]) => {
    const newTracks = (Array.isArray(tracksToAdd) ? tracksToAdd : [tracksToAdd]).map(sanitizeTrackUtil);
    setQueue(prev => [...prev, ...newTracks]);
    const message = Array.isArray(tracksToAdd) && tracksToAdd.length > 1 ? `${newTracks.length} tracks added` : `'${newTracks[0].title}' added`;
    toast.success(`${message} to queue!`);
  }, [setQueue]);

  const removeFromQueue = useCallback((indexToRemove: number) => {
    setQueue(prev => prev.filter((_, i) => i !== indexToRemove));
  }, [setQueue]);

  const onQueueItemClick = useCallback((trackToPlay: Track, indexInList: number, listType?: 'queue' | 'previous') => {
      // listType argument might not be needed if indexInList can be negative for previousTracks
      const sanitizedTrackToPlay = sanitizeTrackUtil(trackToPlay);
      
      // Add current track to previousTracks before switching
      if (currentTrack && currentTrack.id !== sanitizedTrackToPlay.id) {
          setPreviousTracks(prevP => [sanitizeTrackUtil(currentTrack), ...dedupeTracksByIdUtil(prevP.filter(t => t.id !== sanitizedTrackToPlay.id))]);
      }

      // Rebuild queue with clicked track at the front, removing other instances of it
      const newQueue = [sanitizedTrackToPlay, ...queue.filter(t => t.id !== sanitizedTrackToPlay.id)];
      setQueue(newQueue);
      
      // If clicked from previousTracks, remove it from there
      if (listType === 'previous' || (indexInList < 0 && listType === undefined)) { // Heuristic for previous track click
          setPreviousTracks(prevP => prevP.filter(t => t.id !== sanitizedTrackToPlay.id));
      }
      
      setCurrentTrack(sanitizedTrackToPlay);
      void playTrackFromSource(sanitizedTrackToPlay, 0, true);
      setAudioIsPlaying(true);
  }, [queue, currentTrack, playTrackFromSource, setAudioIsPlaying, setQueue, setPreviousTracks, setCurrentTrack]);

  const clearQueue = useCallback(() => {
    setQueue([]); // This will trigger the logic in setQueue to call clearQueueIDB
    toast.info("Queue cleared.");
  }, [setQueue]);

  // Effect to load initial queue and previous tracks from IDB
  useEffect(() => {
    async function loadInitialQueueData() {
        const [savedQueue, savedPreviousRaw, savedCurrentRaw] = await Promise.all([
            getQueueIDB(),
            getSettingIDB("previousTracks"),
            getSettingIDB("currentTrack"),
        ]);

        if (savedQueue && savedQueue.length > 0) {
            setQueueState(dedupeTracksByIdUtil(savedQueue.map(sanitizeTrackUtil)));
        }
        if (savedPreviousRaw) {
            try {
                const parsedPrevious = JSON.parse(savedPreviousRaw);
                if(Array.isArray(parsedPrevious)) {
                    setPreviousTracksState(dedupeTracksByIdUtil(parsedPrevious.map(sanitizeTrackUtil)));
                }
            } catch (e) { console.error("Failed to parse previous tracks from IDB", e); }
        }
        if (savedCurrentRaw) {
             try {
                const parsedCurrent = JSON.parse(savedCurrentRaw);
                if(parsedCurrent && typeof parsedCurrent === 'object') { // Basic check
                    setCurrentTrackState(sanitizeTrackUtil(parsedCurrent as Track));
                }
            } catch (e) { console.error("Failed to parse current track from IDB", e); }
        }
    }
    loadInitialQueueData();
  }, []); // Run once on mount, no dependencies needed here for initial load

  return {
    queue,
    setQueue,
    previousTracks,
    setPreviousTracks,
    currentTrack,
    setCurrentTrack,
    playTrack,
    skipTrack,
    previousTrack,
    addToQueue,
    removeFromQueue,
    onQueueItemClick,
    clearQueue,
  };
}