// src/hooks/useAppDownloads.ts
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import { Track, Playlist } from '@/lib/types/types';
import { useAudio } from '@/lib/hooks/useAudio'; // For loadAudioBuffer
import { storeTrackBlob as storeTrackBlobIDB, storePlaylist as storePlaylistIDB } from '@/lib/managers/idbWrapper';
import { sanitizeTrackUtil } from '@/lib/utils/trackUtils';


export function useAppDownloads() {
  const { loadAudioBuffer } = useAudio();
  const [isDownloading, setIsDownloadingState] = useState(false);
  const [downloadProgress, setDownloadProgressState] = useState(0);

  const downloadSingleTrack = useCallback(async (track: Track) => {
    if (!track || !track.id) {
        toast.error("Invalid track data for download.");
        return;
    }
    const sanitizedTrack = sanitizeTrackUtil(track); // Sanitize before use
    setIsDownloadingState(true); // Indicate global download activity
    setDownloadProgressState(0); // Reset progress for single track

    try {
      toast.info(`Starting download for ${sanitizedTrack.title}...`);
      const blob = await loadAudioBuffer(sanitizedTrack.id.toString()); // Ensure ID is string if loadAudioBuffer expects it
      if (!blob) {
        toast.error(`Failed to fetch audio for ${sanitizedTrack.title}.`);
        setIsDownloadingState(false);
        return;
      }

      await storeTrackBlobIDB(sanitizedTrack.id.toString(), blob);
      saveAs(blob, `${sanitizedTrack.title} - ${sanitizedTrack.artist.name}.mp3`); // Or appropriate extension
      toast.success(`Downloaded: ${sanitizedTrack.title}`);
      setDownloadProgressState(100); // Mark as complete for single track
    } catch (error) {
      console.error("Error downloading track:", error);
      toast.error(`Download failed for ${sanitizedTrack.title}.`);
    } finally {
      // Delay resetting isDownloading if multiple single downloads can happen
      // For now, reset it, assuming one download at a time or parent manages global state better
      setTimeout(() => { // Give toast time to show
          setIsDownloadingState(false);
          setDownloadProgressState(0);
      }, 1500);
    }
  }, [loadAudioBuffer]);

  const downloadEntirePlaylist = useCallback(async (playlist: Playlist) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
        toast.info("Playlist is empty or invalid.");
        return;
    }
    setIsDownloadingState(true);
    setDownloadProgressState(0);
    const totalTracks = playlist.tracks.length;
    let completedTracks = 0;

    toast.info(`Starting download for playlist: ${playlist.name}`);

    for (const rawTrack of playlist.tracks) {
        const track = sanitizeTrackUtil(rawTrack);
        try {
            const blob = await loadAudioBuffer(track.id.toString());
            if (blob) {
                await storeTrackBlobIDB(track.id.toString(), blob);
                // saveAs is typically not called for each track in playlist download,
                // as it would prompt multiple saves. The goal is offline availability in-app.
            } else {
                toast.warn(`Could not fetch audio for ${track.title} in ${playlist.name}. Skipping.`);
            }
        } catch (error) {
            console.error(`Error downloading track ${track.title}:`, error);
            toast.warn(`Failed to download ${track.title} in ${playlist.name}. Skipping.`);
        }
        completedTracks++;
        setDownloadProgressState(Math.round((completedTracks / totalTracks) * 100));
    }

    // Mark playlist as downloaded in IDB
    const updatedPlaylist = { ...playlist, downloaded: true, tracks: playlist.tracks.map(sanitizeTrackUtil) };
    await storePlaylistIDB(updatedPlaylist);
    
    toast.success(`Playlist "${playlist.name}" downloaded for offline use.`);
    setIsDownloadingState(false);
    // setDownloadProgressState(0); // Or keep at 100 until next download
  }, [loadAudioBuffer]);

  return {
    isDownloading,
    downloadProgress,
    downloadSingleTrack,
    downloadEntirePlaylist,
  };
}