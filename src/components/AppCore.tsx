// src/components/AppCore.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent, SetStateAction } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Core Hooks
import { useAudio } from "@/lib/hooks/useAudio";
import { useAppQueue } from "@/lib/hooks/useAppQueue";
import { useAppPlaylists } from "@/lib/hooks/useAppPlaylist"; // Corrected
import { useAppSearch } from "@/lib/hooks/useAppSearch";
import { useAppLyrics } from "@/lib/hooks/useAppLyrics";
import { useAppSettings } from "@/lib/hooks/useAppSettings";
import { useAppUI, AppView } from "@/lib/hooks/useAppUI";
import { useAppDownloads } from "@/lib/hooks/useAppDownloads";

// UI Components
import MobileLayout from "./layout/Mobile/MobileLayout";
import DesktopLayout from "./layout/Desktop/DesktopLayout";
import MobilePlayer from "./players/Mobile/mobilePlayer";
import DesktopPlayer from "./players/Desktop/DesktopPlayer";

// Modal Components
import { OnboardingModal } from "./modals/OnboardingModal";
import { ContextMenu } from "./modals/ContextMenu";
import { SpotifyImportModal } from "./modals/SpotifyImportModal";
import { AddToPlaylistModal } from "./modals/AddToPlaylistModal";
import { DeletePlaylistConfirmationModal } from "./modals/DeletePlaylistConfirmationModal";
import { CreatePlaylistModal } from "./modals/CreatePlaylistModal";

// Utilities, API, Managers
import { setupMediaSession } from "@/lib/hooks/useMediaSession";
import { 
    storeSetting as storeSettingIDB, 
    getSetting as getSettingIDB, 
    getAllPlaylists as getAllPlaylistsIDB,
    storeRecommendedTracks as storeRecommendedTracksIDB, 
    getRecommendedTracks as getRecommendedTracksIDB, 
    getRecentlyPlayed as getRecentlyPlayedIDB,
    storePlaylist as storeSinglePlaylistIDB 
} from "@/lib/managers/idbWrapper";
import { getTopArtists } from "@/lib/api/lastfm"; // Stable import
import { API_BASE_URL } from '@/lib/config';
import { sanitizeTrackUtil, dedupeTracksByIdUtil } from "@/lib/utils/trackUtils";

// Types
import { Track, Playlist, Lyric, ContextMenuOption, Artist, BeforeInstallPromptEvent, Position } from "@/lib/types/types";

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

export function AppCore() {
  const [mounted, setMounted] = useState(false);
  const [listenCount, setListenCount] = useState(0); 
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false); // Guard for initial recommendation fetch

  // --- Initialize Core Hooks ---
  const audioHook = useAudio();
  const {
    isPlaying, setIsPlaying: coreSetIsPlaying, 
    duration, getCurrentPlaybackTime, pauseAudio,
    handleSeek: audioHandleSeek, playTrackFromSource, 
    audioElement: audioElementFromHook, 
    setVolume: coreSetVolumeForAudioElement, 
    setAudioQuality: coreSetAudioQualityForHook,
    setOnTrackEndCallback,
    setLoop: audioSetLoop,
    // Add 'volume' and 'audioQuality' if they are part of useAudio's return and needed for comparison
    volume: audioHookVolumeState, 
    audioQuality: audioHookQualityState,
  } = audioHook;

  const appSettings = useAppSettings();
  const {
    volume, setVolume, repeatMode, setRepeatMode, shuffleOn, toggleShuffle, setShuffle,
    audioQuality, changeAudioQualitySetting, isDataSaver,
  } = appSettings;

  useEffect(() => {
    if (audioHookVolumeState !== volume) coreSetVolumeForAudioElement(volume);
  }, [volume, audioHookVolumeState, coreSetVolumeForAudioElement]);

  useEffect(() => {
    if (audioHookQualityState !== audioQuality) coreSetAudioQualityForHook(audioQuality);
  }, [audioQuality, audioHookQualityState, coreSetAudioQualityForHook]);

  const appQueue = useAppQueue();
  const {
    queue, setQueue: setAppQueueState, previousTracks, setPreviousTracks: setAppPreviousTracksState, 
    currentTrack, setCurrentTrack: setAppCurrentTrackState,
    playTrack: appPlayTrack, 
    skipTrack: appInternalSkipTrack, 
    previousTrack: appInternalPreviousTrack,
    addToQueue: appAddToQueue, 
    removeFromQueue: appInternalRemoveFromQueue, 
    onQueueItemClick: appOnQueueItemClick, 
    clearQueue: appClearQueue,
  } = appQueue;

  const appPlaylists = useAppPlaylists();
  const {
    playlists, setPlaylists: setAppPlaylistsState, currentPlaylist, setCurrentPlaylist: setAppCurrentPlaylist,
    addTrackToExistingPlaylist, createNewPlaylist, deletePlaylist: appDeletePlaylist, togglePinPlaylist,
    addTrackToCurrentPlaylist,
    showCreatePlaylistModal, setShowCreatePlaylistModal, newPlaylistName, setNewPlaylistName,
    newPlaylistImage, setNewPlaylistImage, selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist,
    showAddToPlaylistModal, setShowAddToPlaylistModal, trackToAdd, targetPlaylistName, setTargetPlaylistName,
    openAddToPlaylistModalWithTrack,
  } = appPlaylists;

  const appSearch = useAppSearch();
  const {
    searchQuery, setSearchQuery, searchResults, setSearchResults, 
    isSearching, handleMainSearch: appHandleMainSearch, 
    recentSearches, addRecentSearch, clearRecentSearches, searchType, setSearchType,
    playlistSearchQuery, setPlaylistSearchQuery, playlistSearchResults, setPlaylistSearchResults,
    isPlaylistSearching, handlePlaylistContextSearch,
  } = appSearch;

  const appLyrics = useAppLyrics();
  const {
    lyrics, currentLyricIndex, lyricsLoading, fetchLyrics, updateCurrentLyricIndex,
    showLyricsView, toggleLyricsView,
  } = appLyrics;

  const appUI = useAppUI();
  const {
    view, setView: setAppView, isPlayerOpen, setIsPlayerOpen: setAppIsPlayerOpen, 
    sidebarCollapsed, setSidebarCollapsed: setAppSidebarCollapsed,
    isSearchDrawerOpen, setIsSearchDrawerOpen: setAppIsSearchDrawerOpen, greeting,
    showSettingsMenu, setShowSettingsMenu: setAppShowSettingsMenu, 
    showPwaModal, setShowPwaModal: setAppShowPwaModal,
    showContextMenu, openContextMenu, closeContextMenu, contextMenuPosition, contextMenuOptions,
    showOnboarding, setShowOnboarding: setAppShowOnboarding,
    showDeleteConfirmation, confirmDeletePlaylist: uiConfirmDelete, cancelDeletePlaylist, playlistToDelete,
    showSpotifyToDeezerModal, setShowSpotifyToDeezerModal: setAppShowSpotifyToDeezerModal,
  } = appUI;
  
  const appDownloads = useAppDownloads();
  const {
      isDownloading, downloadProgress, downloadSingleTrack, downloadEntirePlaylist
  } = appDownloads;

  // --- UI Setters (useCallback wrapped) ---
  const uiSetView = useCallback((v: string | AppView) => setAppView(v as AppView), [setAppView]);
  const uiSetCurrentPlaylist = useCallback((p: Playlist | null) => setAppCurrentPlaylist(p), [setAppCurrentPlaylist]);
  const uiSetCurrentTrackForLayout = useCallback((t: Track) => setAppCurrentTrackState(t), [setAppCurrentTrackState]);
  const uiSetIsPlayingForLayout = useCallback((playing: boolean) => coreSetIsPlaying(playing), [coreSetIsPlaying]);
  const uiSetShowCreatePlaylist = useCallback((show: boolean) => setShowCreatePlaylistModal(show), [setShowCreatePlaylistModal]);
  const uiSetShowPwaModal = useCallback((show: boolean) => setAppShowPwaModal(show), [setAppShowPwaModal]);
  const uiSetShowSettingsMenu = useCallback((show: boolean | ((prev: boolean) => boolean)) => setAppShowSettingsMenu(show), [setAppShowSettingsMenu]);
  const uiSetShowSpotifyToDeezerModal = useCallback((show: boolean) => setAppShowSpotifyToDeezerModal(show), [setAppShowSpotifyToDeezerModal]);
  const uiSetIsPlayerOpen = useCallback((open: boolean) => setAppIsPlayerOpen(open), [setAppIsPlayerOpen]);
  const uiSetSidebarCollapsed = useCallback((collapsed: boolean) => setAppSidebarCollapsed(collapsed), [setAppSidebarCollapsed]);
  const uiSetIsSearchDrawerOpen = useCallback((open: boolean) => setAppIsSearchDrawerOpen(open), [setAppIsSearchDrawerOpen]);

  const handleSkipTrackForPlayer = useCallback(() => { appInternalSkipTrack(); }, [appInternalSkipTrack]);
  const handlePreviousTrackForPlayer = useCallback(() => { appInternalPreviousTrack(); }, [appInternalPreviousTrack]);

  const isTrackLiked = useCallback((track: Track): boolean => {
    const liked = playlists.find((p) => p.name === "Liked Songs");
    return !!liked && liked.tracks.some((t) => t.id === sanitizeTrackUtil(track).id);
  }, [playlists]);

  const handleToggleLike = useCallback((trackToLike?: Track) => {
    const track = trackToLike || currentTrack;
    if (!track) return;
    const sanitizedTrack = sanitizeTrackUtil(track);
    const likedPlaylist = playlists.find((p) => p.name === "Liked Songs");
    if (!likedPlaylist) { console.error("'Liked Songs' playlist not found."); return; }
    const isAlreadyLiked = likedPlaylist.tracks.some((t) => t.id === sanitizedTrack.id);
    const updatedLikedTracks = isAlreadyLiked
      ? likedPlaylist.tracks.filter((t) => t.id !== sanitizedTrack.id)
      : [...likedPlaylist.tracks, sanitizedTrack];
    const updatedLikedPlaylist = { ...likedPlaylist, tracks: updatedLikedTracks };
    setAppPlaylistsState(prev => prev.map(p => p.name === "Liked Songs" ? updatedLikedPlaylist : p));
    toast.success(isAlreadyLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
  }, [currentTrack, playlists, setAppPlaylistsState]);

  const appTogglePlay = useCallback(async () => {
    if (!currentTrack || !audioElementFromHook) return;
    if (isPlaying) {
        audioElementFromHook.pause();
        // coreSetIsPlaying will be called by useAudio's event listener
    } else {
        try {
            await audioElementFromHook.play();
            // coreSetIsPlaying will be called by useAudio's event listener
        } catch (error) {
            console.error("Error playing audio:", error);
            coreSetIsPlaying(false); // Explicitly set if play fails
        }
    }
  }, [currentTrack, isPlaying, audioElementFromHook, coreSetIsPlaying]);

  const handleTrackEnd = useCallback(async (): Promise<void> => {
    if (!currentTrack || !audioElementFromHook) return;
    switch (repeatMode) {
      case "one":
        audioElementFromHook.currentTime = 0;
        await audioElementFromHook.play().catch(console.error);
        coreSetIsPlaying(true);
        return;
      case "all":
        appInternalSkipTrack();
        break;
      case "off": default:
        appInternalSkipTrack();
        // Check if the queue became effectively empty for the current context
        const newCurrentTrackAfterSkip = appQueue.currentTrack; // Get potentially updated currentTrack
        if (!newCurrentTrackAfterSkip || (queue.length <= 1 && newCurrentTrackAfterSkip && queue[0]?.id === newCurrentTrackAfterSkip.id)) {
            coreSetIsPlaying(false);
        }
        break;
    }
  }, [currentTrack, repeatMode, appInternalSkipTrack, coreSetIsPlaying, audioElementFromHook, queue, appQueue.currentTrack]);

  useEffect(() => {
    setOnTrackEndCallback(handleTrackEnd);
  }, [handleTrackEnd, setOnTrackEndCallback]);
  
  useEffect(() => {
    audioSetLoop(repeatMode === "one");
  }, [repeatMode, audioSetLoop]);

  const handleFullSearch = useCallback((query: string) => {
    appHandleMainSearch(query);
    if (view !== 'search' && typeof window !== 'undefined' && window.innerWidth < 768) {
        setAppView('search');
    }
  }, [appHandleMainSearch, view, setAppView]);

  const handlePlaylistTrackAddition = useCallback(async (track: Track) => {
    if (currentPlaylist) {
        addTrackToCurrentPlaylist(track);
        setPlaylistSearchQuery("");
        setPlaylistSearchResults([]);
    } else {
        toast.error("No active playlist to add the track to.");
    }
  }, [currentPlaylist, addTrackToCurrentPlaylist, setPlaylistSearchQuery, setPlaylistSearchResults]);

  const handleOpenPlaylist = useCallback((playlist: Playlist) => {
    setAppCurrentPlaylist(playlist);
    setAppView("playlist");
  }, [setAppCurrentPlaylist, setAppView]);

  const generateContextMenuOptions = useCallback((item: Track | Playlist): ContextMenuOption[] => {
    let options: ContextMenuOption[] = [];
    if ("id" in item) {
        const track = item as Track;
        options = [
            { label: "Add to Queue", action: () => appAddToQueue(track) },
            { label: "Add to Playlist...", action: () => openAddToPlaylistModalWithTrack(track) },
            { label: isTrackLiked(track) ? "Unlike" : "Like", action: () => handleToggleLike(track)},
        ];
    } else {
        const playlist = item as Playlist;
        options = [
            { label: "Play All Next", action: () => {
                const tracksToAdd = playlist.tracks.filter(t => !queue.some(qt => qt.id === t.id));
                if (tracksToAdd.length > 0) appAddToQueue(tracksToAdd);
                toast.info(`Added "${playlist.name}" to play next.`);
            }},
            { label: playlist.pinned ? "Unpin Playlist" : "Pin Playlist", action: () => togglePinPlaylist(playlist.name) },
            { label: "Download Playlist", action: () => downloadEntirePlaylist(playlist) },
            ...(playlist.name !== "Liked Songs" ? [{ label: "Delete Playlist", action: () => uiConfirmDelete(playlist.name), danger: true }] : []),
        ];
    }
    return options;
  }, [appAddToQueue, openAddToPlaylistModalWithTrack, isTrackLiked, handleToggleLike, togglePinPlaylist, downloadEntirePlaylist, uiConfirmDelete, queue]);

  const handleGenericContextMenu = useCallback((event: ReactMouseEvent<HTMLButtonElement | HTMLDivElement>, item: Track | Playlist) => {
    event.preventDefault(); event.stopPropagation();
    const options = generateContextMenuOptions(item);
    openContextMenu(options, { x: event.clientX, y: event.clientY });
  }, [generateContextMenuOptions, openContextMenu]);
  
  const handleDeleteConfirmedPlaylist = useCallback(async () => {
    if (playlistToDelete) await appDeletePlaylist(playlistToDelete);
    cancelDeletePlaylist();
  }, [playlistToDelete, appDeletePlaylist, cancelDeletePlaylist]);

  const handleActualAddToPlaylist = useCallback(async () => {
    if (trackToAdd && targetPlaylistName) {
      await addTrackToExistingPlaylist(trackToAdd, targetPlaylistName);
    }
  }, [trackToAdd, targetPlaylistName, addTrackToExistingPlaylist]);

  const handleCreateActualPlaylist = useCallback(async (name: string, image?: string | null, tracksForNew?: Track[]) => {
      const createdPlaylist = await createNewPlaylist(name, image, tracksForNew || selectedTracksForNewPlaylist);
      return createdPlaylist;
  }, [createNewPlaylist, selectedTracksForNewPlaylist]);

  const handleOnboardingProcessComplete = useCallback(() => {
    storeSettingIDB("onboardingDone", "true");
    setAppShowOnboarding(false);
    setAppView("home");
  }, [setAppShowOnboarding, setAppView]);

  const handleArtistSelectionProcessComplete = useCallback(async (selectedArtists: Artist[]) => {
    setAppShowOnboarding(false);
    if (selectedArtists.length === 0) { handleOnboardingProcessComplete(); return; }
    try {
        await storeSettingIDB("favoriteArtists", JSON.stringify(selectedArtists));
        toast.info("Fetching recommendations...");
        const fetchPromises = selectedArtists.map(async (artist) => {
            if (artist && typeof artist.name === 'string') {
                const resp = await fetch(`${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(artist.name)}&limit=5`);
                if (!resp.ok) return [];
                const data = await resp.json();
                return Array.isArray(data.results) ? data.results.slice(0, 5) : [];
            }
            return [];
        });
        const artistTracksArrays: Track[][] = (await Promise.all(fetchPromises)).filter(arr => arr && arr.length > 0);
        const deduped = dedupeTracksByIdUtil(artistTracksArrays.flat().map(sanitizeTrackUtil));
        
        const localRecs = deduped.sort(() => 0.5 - Math.random());
        setRecommendedTracksState(localRecs); 
        await storeRecommendedTracksIDB(localRecs);
        setJumpBackIn(localRecs.slice(0,4));

        if (deduped.length > 0) {
            setAppQueueState(deduped);
            appPlayTrack(deduped[0], true);
        }
        handleOnboardingProcessComplete();
    } catch (err) {
        console.error("Artist selection error:", err);
        toast.error("Could not fetch recommendations.");
        handleOnboardingProcessComplete();
    }
  }, [setAppShowOnboarding, setAppQueueState, appPlayTrack, handleOnboardingProcessComplete]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const evts: Array<keyof DocumentEventMap> = ['mousedown', 'keydown', 'touchstart'];
    const listener = () => { setHasUserInteracted(true); evts.forEach(e => document.removeEventListener(e, listener)); };
    evts.forEach(e => document.addEventListener(e, listener));
    return () => evts.forEach(e => document.removeEventListener(e, listener));
  }, []);

  useEffect(() => {
    if (isPlaying && lyrics.length > 0 && audioElementFromHook) {
      const interval = setInterval(() => {
        if(audioElementFromHook) updateCurrentLyricIndex(audioElementFromHook.currentTime, duration);
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isPlaying, lyrics, duration, updateCurrentLyricIndex, audioElementFromHook]);
  
  useEffect(() => {
    if (currentTrack && showLyricsView) fetchLyrics(currentTrack);
    else if (!showLyricsView) fetchLyrics(null);
  }, [currentTrack, showLyricsView, fetchLyrics]);

  useEffect(() => {
    if (!currentTrack) return; 
    const cleanup = setupMediaSession(currentTrack, isPlaying, {
        getCurrentPlaybackTime: () => audioElementFromHook?.currentTime || 0,
        handleSeek: audioHandleSeek, playTrackFromSource, pauseAudio,
        previousTrackFunc: appInternalPreviousTrack, skipTrack: appInternalSkipTrack,
        setIsPlaying: coreSetIsPlaying, 
        audioRef: { current: audioElementFromHook }, 
    });
    return cleanup;
  }, [currentTrack, isPlaying, audioHandleSeek, playTrackFromSource, pauseAudio, appInternalPreviousTrack, appInternalSkipTrack, coreSetIsPlaying, audioElementFromHook]);

  const [jumpBackIn, setJumpBackIn] = useState<Track[]>([]);
  const [recommendedTracksState, setRecommendedTracksState] = useState<Track[]>([]);

  useEffect(() => {
    async function initialDataLoadAndRecommendations() {
        const onboardFlag = await getSettingIDB("onboardingDone");
        if (!onboardFlag) {
            setAppShowOnboarding(true);
            return; // Stop further execution if onboarding is needed
        }

        // Load recently played first
        const recentlyPlayed = await getRecentlyPlayedIDB();
        setJumpBackIn(recentlyPlayed ? dedupeTracksByIdUtil(recentlyPlayed.map(sanitizeTrackUtil)) : []);
        
        // Then load stored recommendations
        const storedRecTracks = await getRecommendedTracksIDB();
        const currentQueue = appQueue.queue; // Snapshot current queue from hook
        const currentPlayingTrack = appQueue.currentTrack; // Snapshot current track from hook

        if (storedRecTracks && storedRecTracks.length > 0) {
            const dedupedRecs = dedupeTracksByIdUtil(storedRecTracks.map(sanitizeTrackUtil));
            setRecommendedTracksState(dedupedRecs);
            if (currentQueue.length === 0 && !currentPlayingTrack) {
                console.log("Initial Load: Setting queue from stored recommendations.");
                setAppQueueState(dedupedRecs); // Set queue from stored recs if empty
            }
        } else { // No stored recommendations, and onboarding is done, so fetch new ones.
            console.log("Initial Load: No stored recommendations, fetching new ones...");
            try {
                const topArtistsData = await getTopArtists(3); // Expects Artist[] or similar
                const artistNamesToFetch = Array.isArray(topArtistsData) 
                    ? topArtistsData.map(a => (typeof a === 'object' && a && typeof a.name === 'string') ? a.name : null).filter(Boolean) as string[]
                    : [];

                if (artistNamesToFetch.length > 0) {
                    const artistDetailsPromises = artistNamesToFetch.map(async (artistName) => {
                        const resp = await fetch(`${API_BASE_URL}/api/search/artists?query=${encodeURIComponent(artistName)}`);
                        if (!resp.ok) return null;
                        const data = await resp.json();
                        return data?.results?.[0] as Artist | null;
                    });
                    const artistObjs = (await Promise.all(artistDetailsPromises)).filter(Boolean) as Artist[];

                    const tracksByArtistPromises = artistObjs.map(async (artist) => {
                        if (artist && typeof artist.name === 'string') {
                            const resp = await fetch(`${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(artist.name)}&limit=3`);
                            if (!resp.ok) return [];
                            const data = await resp.json();
                            return (Array.isArray(data.results) ? data.results : []) as Track[];
                        }
                        return [];
                    });
                    const tracksByArtist = (await Promise.all(tracksByArtistPromises)).flat();

                    if (tracksByArtist.length > 0) {
                        const finalRecs = dedupeTracksByIdUtil(tracksByArtist.map(sanitizeTrackUtil).sort(() => 0.5 - Math.random()));
                        setRecommendedTracksState(finalRecs);
                        await storeRecommendedTracksIDB(finalRecs);
                        if (currentQueue.length === 0 && !currentPlayingTrack) {
                            console.log("Initial Load: Setting queue from newly fetched recommendations.");
                            setAppQueueState(finalRecs);
                        }
                    } else {
                        console.log("Initial Load: No tracks found for fetched top artists.");
                    }
                } else {
                     console.log("Initial Load: No top artists found to fetch recommendations.");
                }
            } catch (e) { console.error("Failed initial recommendations fetch:", e); }
        }
    }

    if (mounted && !showOnboarding && !initialLoadAttempted) {
        setInitialLoadAttempted(true); // Mark as attempted BEFORE starting async operations
        initialDataLoadAndRecommendations().catch(console.error);
    }
  // Dependencies:
  // - mounted: run after mount
  // - showOnboarding: run only if onboarding is not active
  // - initialLoadAttempted: run only once
  // - setAppShowOnboarding, setAppQueueState: stable setters from hooks
  // - appQueue.queue.length, appQueue.currentTrack: to check if queue needs populating.
  //   To make this more stable, pass appQueue.queue and appQueue.currentTrack directly.
  //   However, the initialLoadAttempted flag is the primary guard against re-runs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, showOnboarding, initialLoadAttempted, setAppShowOnboarding, appQueue.setQueue, appQueue.currentTrack, appQueue.queue.length, getTopArtists]);


  const [uiSeekPosition, setUiSeekPosition] = useState(0);
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isPlaying) {
        intervalId = setInterval(() => setUiSeekPosition(getCurrentPlaybackTime()), 500);
    } else {
        // Update one last time when paused, then clear interval if it exists
        setUiSeekPosition(getCurrentPlaybackTime());
        if (intervalId) clearInterval(intervalId);
    }
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, getCurrentPlaybackTime]);

  const handleRemoveFromQueueByTrackObject = (track: Track) => {
    const idx = queue.findIndex(t => t.id === track.id);
    if (idx !== -1) appInternalRemoveFromQueue(idx);
  };
  
  const handleSetRecentSearchesForLayout = (searches: string[]) => {
      if (searches.length === 0) clearRecentSearches();
      else searches.forEach(s => addRecentSearch(s));
  };

  if (showOnboarding) {
    return <OnboardingModal show={showOnboarding} onComplete={handleOnboardingProcessComplete} onArtistSelectionComplete={handleArtistSelectionProcessComplete} />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      
      <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden">
        <MobileLayout
            greeting={greeting}
            showSettingsMenu={showSettingsMenu} setShowSettingsMenu={uiSetShowSettingsMenu}
            showPwaModal={showPwaModal} setShowPwaModal={uiSetShowPwaModal}
            storeSetting={storeSettingIDB}
            view={view} setView={uiSetView}
            currentPlaylist={currentPlaylist} setCurrentPlaylist={uiSetCurrentPlaylist}
            setQueue={setAppQueueState} setCurrentTrack={uiSetCurrentTrackForLayout} setIsPlaying={uiSetIsPlayingForLayout}
            shuffleQueue={toggleShuffle} 
            downloadPlaylist={downloadEntirePlaylist} isDownloading={isDownloading} downloadProgress={downloadProgress}
            playlistSearchQuery={playlistSearchQuery} setPlaylistSearchQuery={setPlaylistSearchQuery}
            playlistSearchResults={playlistSearchResults} handlePlaylistSearch={handlePlaylistContextSearch}
            addTrackToPlaylist={addTrackToCurrentPlaylist}
            playTrack={appPlayTrack}
            queue={queue} previousTracks={previousTracks}
            removeFromQueue={handleRemoveFromQueueByTrackObject} 
            toggleLike={handleToggleLike} isTrackLiked={isTrackLiked}
            showLyrics={showLyricsView} toggleLyricsView={toggleLyricsView}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} handleSearch={handleFullSearch}
            audioQuality={audioQuality} setAudioQuality={changeAudioQualitySetting} changeAudioQuality={changeAudioQualitySetting}
            isPlayerOpen={isPlayerOpen} mounted={mounted}
            lyrics={lyrics} currentLyricIndex={currentLyricIndex}
            repeatMode={repeatMode} setRepeatMode={setRepeatMode}
            seekPosition={uiSeekPosition} duration={duration} listenCount={listenCount}
            searchType={searchType} setIsSearchOpen={uiSetIsSearchDrawerOpen}
            recentSearches={recentSearches} setRecentSearches={handleSetRecentSearchesForLayout}
            setPlaylistSearchResults={setPlaylistSearchResults}
            setShowCreatePlaylist={uiSetShowCreatePlaylist}
            sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={uiSetSidebarCollapsed}
            addToQueue={appAddToQueue} openAddToPlaylistModal={openAddToPlaylistModalWithTrack}
            handleContextMenu={handleGenericContextMenu}
            playlists={playlists} setPlaylists={setAppPlaylistsState}
            storePlaylist={storeSinglePlaylistIDB} 
            deletePlaylistByName={appDeletePlaylist} 
            jumpBackIn={jumpBackIn} recommendedTracks={recommendedTracksState}
            toggleLikeMobile={handleToggleLike} 
            setIsPlayerOpen={uiSetIsPlayerOpen}
            // Context menu props removed as per earlier discussion for layouts
            setContextMenuPosition={() => {}} 
            setContextMenuOptions={() => {}}  
            setShowContextMenu={closeContextMenu}
            isSearchOpen={isSearchDrawerOpen}
            setSearchType={setSearchType}
            openPlaylist={handleOpenPlaylist}
            currentTrack={currentTrack} isPlaying={isPlaying}
            volume={volume} onVolumeChange={setVolume}
            togglePlay={appTogglePlay} 
            skipTrack={handleSkipTrackForPlayer} 
            previousTrackFunc={handlePreviousTrackForPlayer} 
            handleSeek={audioHandleSeek} shuffleOn={shuffleOn}
        />

        <DesktopLayout
            greeting={greeting} mounted={mounted} view={view} setView={uiSetView}
            sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={uiSetSidebarCollapsed}
            showPwaModal={showPwaModal} setShowPwaModal={uiSetShowPwaModal}
            showUserMenu={showSettingsMenu} setShowUserMenu={uiSetShowSettingsMenu}
            contextMenuOptions={contextMenuOptions} // Pass this if CustomContextMenu in DesktopLayout uses it
            setShowSpotifyToDeezerModal={uiSetShowSpotifyToDeezerModal}
            playlists={playlists} setPlaylists={setAppPlaylistsState}
            openPlaylist={handleOpenPlaylist} currentPlaylist={currentPlaylist}
            storePlaylist={storeSinglePlaylistIDB} 
            deletePlaylistByName={appDeletePlaylist} 
            setShowCreatePlaylist={uiSetShowCreatePlaylist}
            handleUnpinPlaylist={(p: Playlist) => togglePinPlaylist(p.name)}
            playlistSearchQuery={playlistSearchQuery} setPlaylistSearchQuery={setPlaylistSearchQuery}
            handlePlaylistSearch={handlePlaylistContextSearch} playlistSearchResults={playlistSearchResults}
            setPlaylistSearchResults={setPlaylistSearchResults} addTrackToPlaylist={addTrackToCurrentPlaylist}
            setQueue={setAppQueueState} setCurrentTrack={uiSetCurrentTrackForLayout} setIsPlaying={uiSetIsPlayingForLayout}
            playTrack={appPlayTrack} addToQueue={appAddToQueue} shuffleQueue={toggleShuffle}
            toggleLike={handleToggleLike} isTrackLiked={isTrackLiked}
            downloadPlaylist={downloadEntirePlaylist} isDownloading={isDownloading} downloadProgress={downloadProgress}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchType={searchType} setSearchType={setSearchType}
            handleSearch={handleFullSearch} fetchSearchResults={appHandleMainSearch} 
            searchResults={searchResults} recentSearches={recentSearches} setRecentSearches={handleSetRecentSearchesForLayout}
            showQueue={false} queue={queue} previousTracks={previousTracks}
            onQueueItemClick={(track, index) => appOnQueueItemClick(track, index, 'queue')}
            volume={volume} onVolumeChange={setVolume}
            audioQuality={audioQuality} setAudioQuality={changeAudioQualitySetting}
            storeSetting={storeSettingIDB}
            jumpBackIn={jumpBackIn} recommendedTracks={recommendedTracksState}
            showContextMenu={showContextMenu} setShowContextMenu={closeContextMenu}
            contextMenuPosition={contextMenuPosition}
            // Context menu props removed as per earlier discussion for layouts
            setContextMenuPosition={() => {}} 
            setContextMenuOptions={() => {}}  
            handleContextMenu={handleGenericContextMenu}
            openAddToPlaylistModal={openAddToPlaylistModalWithTrack}
        />

        {mounted && currentTrack && (
          <>
            <div className="md:hidden">
              <MobilePlayer
                currentTrack={currentTrack}
                currentTrackIndex={queue.findIndex((t) => t.id === currentTrack?.id) ?? -1}
                isPlaying={isPlaying}
                audioQuality={audioQuality} isDataSaver={isDataSaver}
                changeAudioQuality={changeAudioQualitySetting}
                removeFromQueue={(idx) => appInternalRemoveFromQueue(idx)} 
                lyricsLoading={lyricsLoading} downloadTrack={downloadSingleTrack}
                setQueue={setAppQueueState}
                togglePlay={appTogglePlay} 
                skipTrack={handleSkipTrackForPlayer} 
                previousTrack={handlePreviousTrackForPlayer} 
                seekPosition={uiSeekPosition} duration={duration} listenCount={listenCount}
                handleSeek={audioHandleSeek}
                isLiked={isTrackLiked(currentTrack)}
                repeatMode={repeatMode} setRepeatMode={setRepeatMode}
                toggleLike={handleToggleLike} 
                lyrics={lyrics} currentLyricIndex={currentLyricIndex}
                queue={queue} previousTracks={previousTracks}
                shuffleOn={shuffleOn} shuffleQueue={toggleShuffle} 
                showLyrics={showLyricsView} toggleLyricsView={toggleLyricsView}
                onQueueItemClick={(track, index) => appOnQueueItemClick(track, index, 'queue')}
                setIsPlayerOpen={uiSetIsPlayerOpen}
              />
            </div>
            <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-50">
              <DesktopPlayer
                currentTrack={currentTrack}
                isPlaying={isPlaying} lyricsLoading={lyricsLoading}
                audioQuality={audioQuality} isDataSaver={isDataSaver}
                changeAudioQuality={changeAudioQualitySetting}
                previousTracks={previousTracks} setQueue={setAppQueueState}
                togglePlay={appTogglePlay} 
                skipTrack={handleSkipTrackForPlayer} 
                previousTrack={handlePreviousTrackForPlayer} 
                seekPosition={uiSeekPosition} duration={duration} handleSeek={audioHandleSeek}
                isLiked={isTrackLiked(currentTrack)}
                repeatMode={repeatMode} setRepeatMode={setRepeatMode}
                toggleLike={() => handleToggleLike(currentTrack)} 
                lyrics={lyrics} currentLyricIndex={currentLyricIndex}
                showLyrics={showLyricsView} toggleLyricsView={toggleLyricsView}
                shuffleOn={shuffleOn} shuffleQueue={toggleShuffle} 
                queue={queue} currentTrackIndex={queue.findIndex((x) => x.id === currentTrack!.id) ?? -1}
                removeFromQueue={(idx) => appInternalRemoveFromQueue(idx)} 
                onQueueItemClick={(track, index) => appOnQueueItemClick(track, index, 'queue')}
                volume={volume} onVolumeChange={setVolume}
                listenCount={listenCount} downloadTrack={downloadSingleTrack}
              />
            </footer>
          </>
        )}
        {!currentTrack && mounted && (
            <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-neutral-900 border-t border-neutral-800 text-neutral-400 h-[88px] flex items-center justify-center text-sm">
                    Select a song to play.
                </div>
            </footer>
        )}
      </div>

      <ContextMenu show={showContextMenu} position={contextMenuPosition} options={contextMenuOptions} onClose={closeContextMenu} />
      <SpotifyImportModal show={showSpotifyToDeezerModal} onClose={() => setAppShowSpotifyToDeezerModal(false)}
        onPlaylistImported={async () => {
            const updatedPls = await getAllPlaylistsIDB();
            setAppPlaylistsState(updatedPls.map(p => ({...p, tracks: p.tracks.map(sanitizeTrackUtil)})));
            toast.success("Playlist imported successfully!");
            setAppShowSpotifyToDeezerModal(false);
        }}
      />
      <AddToPlaylistModal
        show={showAddToPlaylistModal} trackToAdd={trackToAdd}
        playlists={playlists.filter(p => p.name !== "Liked Songs")}
        onClose={() => { setShowAddToPlaylistModal(false); setTargetPlaylistName(null);}}
        onAddToSelectedPlaylist={handleActualAddToPlaylist}
      />
      <DeletePlaylistConfirmationModal
        show={showDeleteConfirmation} playlistName={playlistToDelete}
        onClose={cancelDeletePlaylist} onConfirmDelete={handleDeleteConfirmedPlaylist}
      />
      <CreatePlaylistModal
        show={showCreatePlaylistModal}
        onClose={() => {
            setShowCreatePlaylistModal(false);
            setNewPlaylistName(""); setNewPlaylistImage(null); setSelectedTracksForNewPlaylist([]);
        }}
        onCreatePlaylist={handleCreateActualPlaylist}
      />
    </>
  );
}