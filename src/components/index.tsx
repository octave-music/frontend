/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * ------------------------------------------------------------
 *  FILE: index.tsx
 *  DESCRIPTION:
 *  This file serves as the main entry point for the SpotifyClone
 *  component. It unifies the Mobile Layout and Desktop Layout
 *  for the entire application:
 *
 *  - Handles initialization, state management, and event logic
 *  - Contains Onboarding, Search, Playlist, Context Menu, Player,
 *    and PWA Install Modals
 *  - Separates MOBILE LAYOUT and DESKTOP LAYOUT to improve clarity
 *  - Strict TypeScript typing, ESLint, and Prettier compatible
 *
 *  NOTE: Type definitions for Tracks, Playlists, etc. are imported
 *  from ../lib/types/types or declared locally for strict typing.
 * ------------------------------------------------------------
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  MouseEvent,
  useMemo,
  SetStateAction,
} from "react";
import debounce from "lodash/debounce";
import ReactDOM from "react-dom";
// ----- HOOKS & LIBRARIES -----
import { useAudio } from "@/lib/hooks/useAudio";
import { setupMediaSession } from "@/lib/hooks/useMediaSession";
import {
  storeQueue,
  clearQueue,
  storePlaylist,
  getAllPlaylists,
  deletePlaylistByName,
  storeRecentlyPlayed,
  getRecentlyPlayed,
  getListenCounts,
  storeSetting,
  getSetting,
  getQueue,
  storeRecommendedTracks,
  storeTrackBlob,
  getRecommendedTracks,
} from "../lib/managers/idbWrapper";
import { handleFetchLyrics } from "@/lib/api/lyrics";
import audioElement from "@/lib/managers/audioManager";

// ----- COMPONENTS -----
import MobilePlayer from "./players/mobilePlayer";
import DesktopPlayer from "./players/DesktopPlayer";
import Onboarding from "./onboarding/Onboarding";
import MobileLayout from "./layout/MobileLayout"; // Ensure you import MobilePlayer
import DesktopLayout from "./layout/DesktopLayout";
import OtherModals from "./layout/Other";

// ----- UTILITIES & HELPERS -----
import { saveAs } from "file-saver";

// ----- TYPES -----
import {
  Track,
  Playlist,
  Lyric,
  ContextMenuOption,
  Position,
  Artist,
  BeforeInstallPromptEvent,
} from "@/lib/types/types";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Extend the global Window interface to store PWA prompt event
 * used for "Add to Home Screen" or PWA installs.
 */
declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

// ----- CONSTANTS -----
const API_BASE_URL = "https://mbck.cloudgen.xyz";

// Utility Functions
async function setupDiscordRPC(trackTitle: string, artistName: string) {
  console.log("[Discord RPC] Setting presence:", { trackTitle, artistName });
}

/**
 * Checks if the user is on a data-saver connection (slow or metered).
 */
function isDataSaverMode(): boolean {
  const nav = navigator as Navigator & { connection?: any };
  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType === "2g") return true;
  return false;
}

/**
 * Returns a greeting message depending on the current hour of the day.
 */
function getDynamicGreeting(): string {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 5 && currentHour < 12) return "Good Morning!";
  if (currentHour >= 12 && currentHour < 17) return "Good Afternoon!";
  if (currentHour >= 17 && currentHour < 21) return "Good Evening!";
  return "Good Night!";
}

const TIME_THRESHOLD = 0.05;
const THROTTLE_DELAY = 200;

import { motion } from "framer-motion";
import { Portal } from "@radix-ui/react-portal";
/**
 * The main entry component for our entire app, handling both
 * Mobile and Desktop experiences. Includes:
 * - Onboarding
 * - Playlist management
 * - Searching, playback, queue, context menu, etc.
 */
export function SpotifyClone() {
  // Mounted Ref Top Declaration
  const isMounted = useRef(false);

  // Audio hook usage: typed for strictness
  const {
    isPlaying,
    setIsPlaying,
    duration,
    volume,
    setVolume,
    getCurrentPlaybackTime,
    pauseAudio,
    handleSeek,
    playTrackFromSource,
    onVolumeChange,
    loadAudioBuffer,
    setOnTrackEndCallback,
  } = useAudio();

  // ---------------------------------------------------------------------------
  //                                STATE
  // ---------------------------------------------------------------------------

  // View & UI State
  const [view, setView] = useState<
    "home" | "search" | "playlist" | "settings" | "library"
  >("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState(getDynamicGreeting());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Playlist & Track Management
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [previousTracks, setPreviousTracks] = useState<Track[]>([]);
  const [jumpBackIn, setJumpBackIn] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);

  // Search & Results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchType, setSearchType] = useState("tracks");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Track[]>(
    []
  );

  // Playback Controls
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [seekPosition, setSeekPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioQuality, setAudioQuality] = useState<
    "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"
  >("HIGH");
  const [listenCount, setListenCount] = useState(0);

  // Context Menu & Modals
  const [showQueue, setShowQueue] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [contextMenuOptions, setContextMenuOptions] = useState<
    ContextMenuOption[]
  >([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSpotifyToDeezerModal, setShowSpotifyToDeezerModal] =
    useState(false);

  // Playlist Creation
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<
    string | null
  >(null);
  const [showSearchInPlaylistCreation, setShowSearchInPlaylistCreation] =
    useState(false);
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] =
    useState<Track[]>([]);

  // Downloads & Progress
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Lyrics
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showArtistSelection, setShowArtistSelection] = useState(false);

  // ---------------------------------------------------------------------------
  //                           HANDLERS & UTIL FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Confirms the user wants to delete a playlist. We store the selected
   * playlist in 'selectedPlaylist' to finalize the action in a modal.
   */
  const confirmDeletePlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowDeleteConfirmation(true);
  }, []);

  /**
   * Completes the delete action for a selected playlist after user confirmation.
   */
  const deleteConfirmedPlaylist = useCallback(() => {
    if (selectedPlaylist) {
      void deletePlaylistByName(selectedPlaylist.name).then(
        (updatedPlaylists) => {
          setPlaylists(updatedPlaylists);
          setSelectedPlaylist(null);
          setShowDeleteConfirmation(false);
        }
      );
    }
  }, [selectedPlaylist]);

  /**
   * Searches for tracks (specifically for adding to a playlist) given a query.
   * Results are stored in 'playlistSearchResults'.
   */
  const handlePlaylistSearch = useCallback(async (query: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data && data.results) {
        setPlaylistSearchResults(data.results as Track[]);
      }
    } catch (error) {
      console.error("Playlist search error:", error);
    }
  }, []);

  /**
   * Adds a track to the currently opened playlist in state if it's not already present.
   */
  const addTrackToPlaylist = useCallback(
    async (track: Track) => {
      if (!currentPlaylist) return;

      // Check if the track is already in the playlist
      const isAlreadyIn = currentPlaylist.tracks.some((t) => t.id === track.id);
      if (isAlreadyIn) {
        toast.warning("This track is already in the playlist.");
        return;
      }

      // Add the track to the playlist
      const updatedPlaylist: Playlist = {
        ...currentPlaylist,
        tracks: [...currentPlaylist.tracks, track],
      };

      // Update state
      setCurrentPlaylist(updatedPlaylist);
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((pl) =>
          pl.name === updatedPlaylist.name ? updatedPlaylist : pl
        )
      );

      // Store the updated playlist in IndexedDB
      await storePlaylist(updatedPlaylist);

      // Optionally, reset the search
      setPlaylistSearchQuery("");
      setPlaylistSearchResults([]);
    },
    [currentPlaylist]
  );

  /**
   * Debounced fetch for search results. Triggered after a slight delay
   * so we don't spam the search endpoint on every keystroke.
   */
  const fetchSearchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          const resp = await fetch(
            `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(
              query
            )}`
          );
          const data = await resp.json();
          if (data && data.results) {
            setSearchResults(data.results as Track[]);
          }
        } catch (error) {
          console.log("Search error:", error);
        }
      }, 300),
    []
  );

  /**
   * Fetches lyrics for a given track using an external lyrics API,
   * storing them locally in 'lyrics' state.
   */
  const fetchLyrics = useCallback(async (track: Track) => {
    try {
      const fetchedLyrics = await handleFetchLyrics(track);
      setLyrics(fetchedLyrics);
    } catch (err) {
      console.log("Lyrics error:", err);
      setLyrics([]);
    }
  }, []);

  /**
   * Sets up the main playback functionality by placing the new track
   * at the top of the queue and starting playback.
   */
  const playTrack = useCallback(
    (track: Track) => {
      // Prevent rapid changes
      setQueue((prev) => {
        // If we're already processing this track, do nothing
        if (prev[0]?.id === track.id) return prev;

        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered];
      });

      ReactDOM.unstable_batchedUpdates(() => {
        setPreviousTracks((prev) =>
          currentTrack ? [currentTrack, ...prev] : prev
        );
        setCurrentTrack(track);
        setIsPlaying(true);
      });

      void playTrackFromSource(track, 0);
    },
    [currentTrack, playTrackFromSource, setIsPlaying]
  );

  /**
   * Toggles the current track's play state. If no track is loaded, does nothing.
   */
  const togglePlay = useCallback(async () => {
    if (!currentTrack || !audioElement) return;

    try {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        await audioElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback error:", error);
      // Reset state if playback fails
      setIsPlaying(false);
      audioElement.currentTime = 0;
    }
  }, [currentTrack, isPlaying, setIsPlaying]);

  /**
   * Moves playback to the previous track if one exists in 'previousTracks'.
   */
  const previousTrackFunc = useCallback(() => {
    if (!previousTracks.length || !audioElement) {
      toast.warning("Cannot go to the previous track: no track in history.");
      return;
    }

    const lastTrack = previousTracks[0];
    setPreviousTracks((prev) => prev.slice(1));
    setQueue((q) => [lastTrack, ...q.filter((tk) => tk.id !== lastTrack.id)]);
    setCurrentTrack(lastTrack);

    void playTrackFromSource(lastTrack, 0);
  }, [previousTracks, playTrackFromSource]);

  /**
   * Skips to the next track in the queue. If it’s the last track
   * (or no more are available), stops playback.
   */
  const skipTrack = useCallback(() => {
    if (!currentTrack || queue.length <= 1 || !audioElement) {
      toast.warning("Cannot skip track: no next track available.");
      return;
    }

    setPreviousTracks((prev) =>
      currentTrack ? [currentTrack, ...prev] : prev
    );

    setQueue((q) => {
      const [, ...rest] = q;
      if (rest.length === 0) {
        setCurrentTrack(null);
        setIsPlaying(false);
      } else {
        setCurrentTrack(rest[0]);
        void playTrackFromSource(rest[0], 0);
      }
      return rest;
    });
  }, [currentTrack, queue, setIsPlaying, playTrackFromSource]);

  /**
   * Event fired when a track finishes playing. Based on repeatMode, we decide
   * whether to restart the track, move to next track, or stop playback.
   */
  const handleTrackEnd = useCallback((): void => {
    if (!currentTrack || !audioElement) return;

    switch (repeatMode) {
      case "one":
        // Restart the same track
        void playTrackFromSource(currentTrack, 0);
        break;

      case "all": {
        const isLastTrack =
          queue.findIndex((t) => t.id === currentTrack.id) === queue.length - 1;
        if (isLastTrack) {
          if (queue.length === 0) return;
          setCurrentTrack(queue[0]);
          setQueue(queue);
          void playTrackFromSource(queue[0], 0);
        } else {
          skipTrack();
        }
        break;
      }

      case "off":
      default:
        if (queue.length > 1) {
          skipTrack();
        } else {
          setIsPlaying(false);
          audioElement.pause();
        }
        break;
    }
  }, [
    currentTrack,
    repeatMode,
    playTrackFromSource,
    queue,
    skipTrack,
    setIsPlaying,
  ]);

  /**
   * Cycles through audio quality levels in a fixed array order.
   */
  const onCycleAudioQuality = useCallback(() => {
    const arr: Array<"MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"> = [
      "MAX",
      "HIGH",
      "NORMAL",
      "DATA_SAVER",
    ];
    const i = arr.indexOf(audioQuality);
    const next = arr[(i + 1) % arr.length];
    setAudioQuality(next);
    void storeSetting("audioQuality", next);
  }, [audioQuality]);

  /**
   * Checks if a given track is in the "Liked Songs" playlist.
   */
  const isTrackLiked = useCallback(
    (track: Track): boolean => {
      const liked = playlists.find((p) => p.name === "Liked Songs");
      if (!liked) return false;
      return liked.tracks.some((t) => t.id === track.id);
    },
    [playlists]
  );

  /**
   * Sanitizes a track by ensuring the presence of essential fields
   * to avoid any undefined errors or missing data.
   */
  const sanitizeTrack = (track: Track): Track => {
    return {
      id: track.id || "unknown-id",
      title: track.title || "Unknown Title",
      artist: {
        name: track.artist?.name || "Unknown Artist",
      },
      album: {
        title: track.album?.title || "Unknown Album",
        cover_medium:
          track.album?.cover_medium || "images/defaultPlaylistImage.png",
        cover_small:
          track.album?.cover_small || "images/defaultPlaylistImage.png",
        cover_big: track.album?.cover_big || "images/defaultPlaylistImage.png",
        cover_xl: track.album?.cover_xl || "images/defaultPlaylistImage.png",
      },
    };
  };

  /**
   * Toggles a track's "liked" status by adding/removing it from the
   * "Liked Songs" playlist.
   */
  const toggleLike = useCallback(
    (rawTrack: Track) => {
      if (!rawTrack) return;
      const track = sanitizeTrack(rawTrack);

      const likedPlaylist = playlists.find((p) => p.name === "Liked Songs");
      if (!likedPlaylist) return;

      const isAlreadyLiked = likedPlaylist.tracks.some(
        (t) => t.id === track.id
      );

      const updatedPlaylists = playlists.map((playlist) => {
        if (playlist.name === "Liked Songs") {
          const updatedTracks = isAlreadyLiked
            ? playlist.tracks.filter((t) => t.id !== track.id)
            : [...playlist.tracks, track];
          return { ...playlist, tracks: updatedTracks };
        }
        return playlist;
      });

      setPlaylists(updatedPlaylists);

      Promise.all(updatedPlaylists.map((p) => storePlaylist(p))).catch((err) =>
        console.error("Error storing updated playlists:", err)
      );
    },
    [playlists]
  );

  /**
   * Toggles "liked" status for the currently playing track from Desktop player UI.
   */
  const toggleLikeDesktop = useCallback(() => {
    if (currentTrack) toggleLike(currentTrack);
  }, [currentTrack, toggleLike]);

  /**
   * Toggles "liked" status for the currently playing track from Mobile player UI.
   */
  const toggleLikeMobile = useCallback(() => {
    if (currentTrack) toggleLike(currentTrack);
  }, [currentTrack, toggleLike]);

  /**
   * Adds one or more tracks to the playback queue if they are not already present.
   */
  const addToQueue = useCallback((tr: Track | Track[]) => {
    setQueue((prev) => {
      const arr = Array.isArray(tr) ? tr : [tr];
      const filtered = arr.filter(
        (item) => !prev.some((pk) => pk.id === item.id)
      );
      return [...prev, ...filtered];
    });
  }, []);

  /**
   * Removes a track from the queue at the specified index.
   */
  const removeFromQueue = useCallback((idx: number) => {
    setQueue((q) => q.filter((_, i) => i !== idx));
  }, []);

  /**
   * Handles clicking on a queue item, either from the main queue or from
   * previousTracks. We transfer the track to the "currentTrack" position
   * in the queue and start playback.
   */
  const onQueueItemClick = useCallback(
    (track: Track, idx: number) => {
      if (idx < 0) {
        // from previousTracks
        setPreviousTracks((prev) => prev.filter((_, i) => i !== -idx - 1));
        setQueue((q) => [track, ...q]);
      } else {
        // from queue
        setPreviousTracks((prev) =>
          currentTrack ? [currentTrack, ...prev] : prev
        );
        setQueue((q) => q.filter((_, i) => i !== idx));
      }
      setCurrentTrack(track);
    },
    [currentTrack]
  );

  /**
   * Opens the "Add to Playlist" modal, storing which track we want to add.
   */
  const openAddToPlaylistModal = useCallback((tr: Track) => {
    setContextMenuTrack(tr);
    setShowAddToPlaylistModal(true);
  }, []);

  /**
   * Handles right-click context menu for both tracks and playlists.
   * Populates contextMenuOptions and sets position.
   */
  const handleContextMenu = useCallback(
    (
      evt: MouseEvent<HTMLButtonElement | HTMLDivElement>,
      item: Track | Playlist
    ) => {
      evt.preventDefault();

      let options: ContextMenuOption[] = [];

      // If item is a track
      if ("id" in item) {
        options = [
          { label: "Add to Queue", action: () => addToQueue(item) },
          {
            label: "Add to Playlist",
            action: () => openAddToPlaylistModal(item),
          },
          {
            label: isTrackLiked(item)
              ? "Remove from Liked Songs"
              : "Add to Liked Songs",
            action: () => toggleLike(item),
          },
        ];
      }

      // If item is a playlist
      if ("tracks" in item) {
        options = [
          {
            label: item.pinned ? "Unpin Playlist" : "Pin Playlist",
            action: () => {
              const updatedPlaylists = playlists.map((pl) =>
                pl.name === item.name ? { ...pl, pinned: !pl.pinned } : pl
              );
              setPlaylists(updatedPlaylists);
              void Promise.all(updatedPlaylists.map((pl) => storePlaylist(pl)));
            },
          },
          {
            label: "Delete Playlist",
            action: () => {
              void deletePlaylistByName(item.name).then((nl) =>
                setPlaylists(nl)
              );
            },
          },
        ];
      }

      setContextMenuOptions(options);
      setContextMenuPosition({ x: evt.clientX, y: evt.clientY });
      setShowContextMenu(true);
    },
    [addToQueue, openAddToPlaylistModal, isTrackLiked, toggleLike, playlists]
  );

  /**
   * Actually adds a track to a chosen playlist from the context menu modal.
   */
  const addToPlaylist = useCallback(
    async (t: Track, name: string) => {
      const updatedPlaylists = playlists.map((pl) => {
        if (pl.name === name) {
          const merged = [...pl.tracks, t];
          return { ...pl, tracks: merged };
        }
        return pl;
      });
      setPlaylists(updatedPlaylists);
      await Promise.all(updatedPlaylists.map((p) => storePlaylist(p)));
    },
    [playlists]
  );

  /**
   * Finalizes the "Add to Playlist" context menu process by adding the
   * contextMenuTrack to the user-selected playlist in the UI.
   */
  const handleAddToPlaylist = useCallback(() => {
    if (!selectedPlaylistForAdd || !contextMenuTrack) return;
    void addToPlaylist(contextMenuTrack, selectedPlaylistForAdd);
    setShowAddToPlaylistModal(false);
    setSelectedPlaylistForAdd(null);
  }, [selectedPlaylistForAdd, contextMenuTrack, addToPlaylist]);

  /**
   * Preloads images for the "createCompositeImage" function to generate
   * an aggregated cover image if a user adds multiple tracks to a new playlist.
   */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /**
   * Creates a composite image (2x2 grid) if a user’s new playlist has multiple tracks,
   * by merging up to 4 album covers into a single 'cover' for the playlist.
   */
  const createCompositeImage = useCallback(
    async (urls: string[]): Promise<string> => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "/images/placeholder-image.png";

      const count = Math.min(4, urls.length);
      const size = 128; // quadrant size
      for (let i = 0; i < count; i++) {
        const img = await loadImage(urls[i]);
        const x = (i % 2) * size;
        const y = Math.floor(i / 2) * size;
        ctx.drawImage(img, x, y, size, size);
      }
      return canvas.toDataURL("image/png");
    },
    [loadImage]
  );

  /**
   * Creates a new playlist and saves it to the local store. If the user
   * didn't supply a cover image but did select tracks, we generate a
   * composite image from their covers.
   */
  const createPlaylist = useCallback(async (): Promise<void> => {
    if (!newPlaylistName) return;
    const pl: Playlist = {
      name: newPlaylistName,
      image: newPlaylistImage || "/images/defaultPlaylistImage.png",
      tracks: selectedTracksForNewPlaylist,
    };
    const updated = [...playlists, pl];
    setPlaylists(updated);
    setNewPlaylistName("");
    setNewPlaylistImage(null);
    setSelectedTracksForNewPlaylist([]);
    setShowCreatePlaylist(false);
    setShowSearchInPlaylistCreation(false);

    // If no custom image was provided and we have some tracks
    if (!newPlaylistImage && pl.tracks.length > 0) {
      const covers = pl.tracks.slice(0, 4).map((t) => t.album.cover_medium);
      pl.image = await createCompositeImage(covers);
    }

    // Then store in IDB
    await storePlaylist(pl);
  }, [
    newPlaylistName,
    newPlaylistImage,
    playlists,
    selectedTracksForNewPlaylist,
    createCompositeImage,
  ]);

  const toggleTrackSelection = useCallback((tr: Track) => {
    setSelectedTracksForNewPlaylist((prev) =>
      prev.find((x) => x.id === tr.id)
        ? prev.filter((x) => x.id !== tr.id)
        : [...prev, tr]
    );
  }, []);

  /**
   * Opens a playlist and navigates the user to the 'playlist' view.
   */
  const openPlaylist = useCallback((pl: Playlist) => {
    setCurrentPlaylist(pl);
    setView("playlist");
  }, []);

  /**
   * Forces a track to be downloaded as a Blob and also stored
   * for offline playback in the app.
   */
  const downloadTrack = useCallback(
    async (track: Track) => {
      try {
        const blob = await loadAudioBuffer(track.id);
        if (!blob) {
          toast.error("Failed to download track.");
          return;
        }

        // Store in IndexedDB for offline usage
        await storeTrackBlob(track.id, blob);

        // Also allow the user to save to local disk
        saveAs(blob, `${track.title} - ${track.artist.name}.mp3`);
        toast.warning(
          "Track downloaded and available for offline playback within the app."
        );
      } catch (error) {
        console.error("Error downloading track:", error);
        toast.error("Failed to download track.");
      }
    },
    [loadAudioBuffer]
  );

  /**
   * Downloads an entire playlist track by track, showing progress.
   */
  const downloadPlaylist = useCallback(
    async (p: Playlist) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      const total = p.tracks.length;
      let i = 0;
      for (const t of p.tracks) {
        await downloadTrack(t);
        i++;
        setDownloadProgress(Math.round((i / total) * 100));
      }
      p.downloaded = true;
      setIsDownloading(false);
      await storePlaylist(p);
    },
    [downloadTrack]
  );

  /**
   * Toggles the queue shuffle state, shuffling the entire queue if turning on.
   */
  const shuffleQueue = useCallback(() => {
    const copyQueue = [...queue];
    for (let i = copyQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copyQueue[i], copyQueue[j]] = [copyQueue[j], copyQueue[i]];
    }
    setQueue(copyQueue);
    setShuffleOn(!shuffleOn);
    void storeSetting("shuffleOn", JSON.stringify(!shuffleOn));
  }, [queue, shuffleOn]);

  /**
   * Toggles the lyrics panel on or off.
   */
  const toggleLyricsView = useCallback(() => {
    setShowLyrics(!showLyrics);
  }, [showLyrics]);

  /**
   * Closes the onboarding steps, sets up final states, and moves user to home.
   */
  const handleOnboardingComplete = useCallback(() => {
    void storeSetting("onboardingDone", "true");
    setShowOnboarding(false);
    setShowArtistSelection(false);
    setView("home");
  }, []);

  /**
   * After a user selects their favorite artists, we fetch recommended tracks
   * and store them. Also sets up the user environment (e.g., "Liked Songs" playlist).
   */
  const handleArtistSelectionComplete = useCallback(
    async (artists: Artist[]) => {
      try {
        await storeSetting("favoriteArtists", JSON.stringify(artists));
        setShowArtistSelection(false);

        // Fetch multiple top tracks from these artists
        const fetchPromises = artists.map(async (artist) => {
          const response = await fetch(
            `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(
              artist.name
            )}`
          );
          const data = await response.json();
          return (data.results || []).slice(0, 5);
        });

        const artistTracks = await Promise.all(fetchPromises);
        const allTracks = artistTracks.flat();

        // Shuffle them to avoid monotony
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        setRecommendedTracks(shuffled);

        // Also store them for future reference
        await storeRecommendedTracks(shuffled);

        // Optionally auto-populate queue and start playing
        setQueue(shuffled);
        await storeQueue(shuffled);

        setSearchResults(shuffled);

        if (shuffled.length) {
          setCurrentTrack(shuffled[0]);
          setIsPlaying(true);
        }

        // "Jump Back In" might just be the first 4 recommended tracks
        const firstFour = shuffled.slice(0, 4);
        setJumpBackIn(firstFour);

        // Ensure "Liked Songs" playlist is present
        if (!playlists.some((p) => p.name === "Liked Songs")) {
          const newPL: Playlist = {
            name: "Liked Songs",
            image: "/images/liked-songs.webp",
            tracks: [],
          };
          const updated = [...playlists, newPL];
          setPlaylists(updated);
          await Promise.all(updated.map((pl) => storePlaylist(pl)));
        }

        handleOnboardingComplete();
      } catch (err) {
        console.log("Artist selection error:", err);
      }
    },
    [playlists, handleOnboardingComplete, setIsPlaying]
  );

  /**
   * Primary search handler used by mobile and desktop search UIs.
   * Also adds the query to 'recentSearches' if it’s not a duplicate.
   */
  function handleSearch(newQ: string): void {
    if (newQ.trim().length > 3) {
      if (!recentSearches.includes(newQ)) {
        setRecentSearches((prev) => [...prev, newQ]);
      }
    }
    fetchSearchResults(newQ);
  }

  // ---------------------------------------------------------------------------
  //                            EFFECTS & LIFECYCLE
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let animFrame: number | null = null;
    function updateLyric() {
      if (!audioElement) {
        animFrame = requestAnimationFrame(updateLyric);
        return;
      }
      const currentTime = audioElement.currentTime;
      const activeIndex = lyrics.findIndex((ly, i) => {
        const isLast = i === lyrics.length - 1;
        const nextTime = isLast ? Infinity : lyrics[i + 1].time;
        return currentTime >= ly.time && currentTime < nextTime;
      });
      if (activeIndex !== -1 && activeIndex !== currentLyricIndex) {
        setCurrentLyricIndex(activeIndex);
      }
      animFrame = requestAnimationFrame(updateLyric);
    }
    animFrame = requestAnimationFrame(updateLyric);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [lyrics, currentLyricIndex]);

  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      if (e.key === "Escape") setShowContextMenu(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMounted(true);

    if (isDataSaverMode()) {
      setAudioQuality("DATA_SAVER");
      void storeSetting("audioQuality", "DATA_SAVER");
    }

    if (audioElement) {
      audioElement.volume = volume;
      audioElement.addEventListener("timeupdate", () => {
        if (audioElement) {
          setCurrentTime(audioElement.currentTime);
          setSeekPosition(audioElement.currentTime);
        }
      });

      audioElement.addEventListener("ended", handleTrackEnd);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", () => {});
        audioElement.removeEventListener("ended", handleTrackEnd);
      }
    };
  }, [handleTrackEnd, volume]);

  useEffect(() => {
    if (!audioElement) return;

    const handleEnded = () => {
      handleTrackEnd();
    };

    audioElement.addEventListener("ended", handleEnded);

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("ended", handleEnded);
      }
    };
  }, [handleTrackEnd]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setOnTrackEndCallback(handleTrackEnd);
  }, [handleTrackEnd, setOnTrackEndCallback]);

  useEffect(() => {
    if (!audioElement) {
      console.warn("Audio element is null during setup");
      return;
    }

    const cleanup = setupMediaSession(currentTrack, isPlaying, {
      getCurrentPlaybackTime: () => audioElement?.currentTime || 0,
      handleSeek: (time) => {
        if (audioElement) {
          audioElement.currentTime = time;
        }
      },
      playTrackFromSource,
      pauseAudio,
      previousTrackFunc,
      skipTrack,
      setIsPlaying,
      audioRef: { current: audioElement },
    });

    return () => {
      cleanup();
    };
  }, [
    currentTrack,
    isPlaying,
    pauseAudio,
    playTrackFromSource,
    previousTrackFunc,
    skipTrack,
    setIsPlaying,
  ]);

  useEffect(() => {
    if (currentTrack) {
      storeSetting("currentTrack", JSON.stringify(currentTrack));
    }
  }, [currentTrack]);

  useEffect(() => {
    async function init() {
      try {
        const savedRecommendedTracks = await getRecommendedTracks();
        if (savedRecommendedTracks && savedRecommendedTracks.length > 0) {
          setRecommendedTracks(savedRecommendedTracks);
        }

        const savedQueue = await getQueue();
        if (savedQueue && savedQueue.length > 0) {
          setQueue(savedQueue);
        }

        const [vol, sOn, qual, pls, rec, onboard, savedTrack] =
          await Promise.all([
            getSetting("volume"),
            getSetting("shuffleOn"),
            getSetting("audioQuality"),
            getAllPlaylists(),
            getRecentlyPlayed(),
            getSetting("onboardingDone"),
            getSetting("currentTrack"),
          ]);

        if (vol) setVolume(parseFloat(vol));
        if (sOn) setShuffleOn(JSON.parse(sOn));
        if (qual)
          setAudioQuality(qual as "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER");
        if (pls) setPlaylists(pls);
        if (rec) setJumpBackIn(rec);
        if (!onboard) setShowOnboarding(true);

        if (savedTrack) {
          const track: Track = JSON.parse(savedTrack);
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    }

    void init();
  }, [setIsPlaying, setVolume]);

  useEffect(() => {
    if (queue.length > 0) {
      void storeQueue(queue).catch((err) =>
        console.error("Failed to store queue in IDB:", err)
      );
    } else {
      void clearQueue().catch((err) =>
        console.error("Failed to clear queue in IDB:", err)
      );
    }
  }, [queue]);

  useEffect(() => {
    if (currentTrack) {
      void playTrackFromSource(currentTrack, 0)
        .then(() => {
          setIsPlaying(true);
          void fetchLyrics(currentTrack);
          return storeRecentlyPlayed(currentTrack);
        })
        .then((recent) => setJumpBackIn(recent))
        .then(() => getListenCounts())
        .then((counts) => setListenCount(counts[currentTrack.id] || 0))
        .then(() =>
          setupDiscordRPC(currentTrack.title, currentTrack.artist.name)
        )
        .catch((err) => {
          console.error("Error during playback setup:", err);
          toast.error("An error occurred while setting up the track.");
        });
    }
  }, [currentTrack, playlists, playTrackFromSource, fetchLyrics, setIsPlaying]);

  useEffect(() => {
    const handleLoadedData = () => {
      if (audioElement) {
        URL.revokeObjectURL(audioElement.src);
      }
    };

    if (audioElement) {
      audioElement.addEventListener("loadeddata", handleLoadedData);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("loadeddata", handleLoadedData);
      }
    };
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (isPlaying) {
      t = setInterval(() => {
        setSeekPosition(getCurrentPlaybackTime());
      }, 1000);
    }
    return () => clearInterval(t);
  }, [isPlaying, getCurrentPlaybackTime]);

  useEffect(() => {
    if (playlistSearchQuery.trim().length > 2) {
      handlePlaylistSearch(playlistSearchQuery);
    } else {
      setPlaylistSearchResults([]);
    }
  }, [playlistSearchQuery, handlePlaylistSearch]);

  useEffect(() => {
    if (
      typeof screen !== "undefined" &&
      "orientation" in screen &&
      screen.orientation
    ) {
      (screen.orientation as any).lock("portrait").catch((err: Error) => {
        console.warn("Screen orientation lock failed:", err);
      });
    }

    return () => {
      if (
        typeof screen !== "undefined" &&
        "orientation" in screen &&
        screen.orientation
      ) {
        (screen.orientation as any).unlock();
      }
    };
  }, []);

  useEffect(() => {
    if (previousTracks.length > 0) {
      void storeSetting("previousTracks", JSON.stringify(previousTracks)).catch(
        (err) => console.error("Failed to store previous tracks:", err)
      );
    }
  }, [previousTracks]);

  useEffect(() => {
    async function loadPreviousTracks() {
      try {
        const savedPrevious = await getSetting("previousTracks");
        if (savedPrevious) {
          setPreviousTracks(JSON.parse(savedPrevious));
        }
      } catch (error) {
        console.error("Failed to load previous tracks:", error);
      }
    }
    void loadPreviousTracks();
  }, []);

  useEffect(() => {
    async function loadRecommendedTracks() {
      try {
        const savedTracks = await getRecommendedTracks();
        if (savedTracks && savedTracks.length > 0) {
          setRecommendedTracks(savedTracks);
        } else {
          console.log("No saved recommended tracks.");
          setRecommendedTracks([]);
        }
      } catch (err) {
        console.error("Error loading recommended tracks:", err);
      }
    }

    loadRecommendedTracks();
  }, []);


  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
  
      {/* Conditional Rendering for Onboarding */}
      {showOnboarding ? (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black custom-scrollbar overflow-y-auto">
          <Onboarding
            onComplete={handleOnboardingComplete}
            onArtistSelectionComplete={handleArtistSelectionComplete}
            API_BASE_URL={API_BASE_URL}
            setRecommendedTracks={setRecommendedTracks}
          />
        </div>
      ) : (
        <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden">
          {/* Mobile Layout */}
          <MobileLayout
            greeting={greeting}
            showSettingsMenu={showSettingsMenu}
            setCurrentPlaylist={setCurrentPlaylist}
            setShowSettingsMenu={setShowSettingsMenu}
            showPwaModal={showPwaModal}
            setShowPwaModal={setShowPwaModal}
            view={view}
            currentPlaylist={currentPlaylist}
            setQueue={setQueue}
            setCurrentTrack={setCurrentTrack}
            setIsPlaying={setIsPlaying}
            shuffleQueue={shuffleQueue}
            downloadPlaylist={downloadPlaylist}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            playlistSearchQuery={playlistSearchQuery}
            setPlaylistSearchQuery={setPlaylistSearchQuery}
            playlistSearchResults={playlistSearchResults}
            handlePlaylistSearch={handlePlaylistSearch}
            addTrackToPlaylist={addTrackToPlaylist}
            playTrack={playTrack}
            queue={queue}
            previousTracks={previousTracks}
            removeFromQueue={(track: Track) => {
              const trackIndex = queue.findIndex((t) => t.id === track.id);
              if (trackIndex !== -1) {
                removeFromQueue(trackIndex);
              }
            }}
            toggleLike={toggleLike}
            isTrackLiked={isTrackLiked}
            showLyrics={showLyrics}
            toggleLyricsView={toggleLyricsView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            handleSearch={handleSearch}
            isPlayerOpen={isPlayerOpen}
            setView={(view: string) => {
              setView(
                view as SetStateAction<
                  "home" | "search" | "playlist" | "settings" | "library"
                >
              );
            }}
            mounted={mounted}
            lyrics={lyrics}
            currentLyricIndex={currentLyricIndex}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            seekPosition={seekPosition}
            duration={duration}
            listenCount={listenCount}
            searchType={searchType}
            setIsSearchOpen={setIsSearchOpen}
            recentSearches={recentSearches}
            setRecentSearches={setRecentSearches}
            setPlaylistSearchResults={setPlaylistSearchResults}
            setShowSearchInPlaylistCreation={setShowSearchInPlaylistCreation}
            setShowCreatePlaylist={setShowCreatePlaylist}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            addToQueue={addToQueue}
            openAddToPlaylistModal={openAddToPlaylistModal}
            handleContextMenu={handleContextMenu}
            playlists={playlists}
            setPlaylists={setPlaylists}
            storePlaylist={storePlaylist}
            deletePlaylistByName={deletePlaylistByName}
            jumpBackIn={jumpBackIn}
            recommendedTracks={recommendedTracks}
            toggleLikeMobile={toggleLikeMobile}
            setIsPlayerOpen={setIsPlayerOpen}
            setContextMenuPosition={setContextMenuPosition}
            setContextMenuOptions={setContextMenuOptions}
            setShowContextMenu={setShowContextMenu}
            isSearchOpen={isSearchOpen}
            setSearchType={setSearchType}
            openPlaylist={openPlaylist}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            skipTrack={skipTrack}
            previousTrackFunc={previousTrackFunc}
            handleSeek={handleSeek}
            shuffleOn={shuffleOn}
          />
  
          {/* Mobile Player */}
          <div className="md:hidden flex flex-col h-[100dvh]">
            {mounted && currentTrack && (
              <MobilePlayer
                currentTrack={currentTrack}
                currentTrackIndex={queue.findIndex(
                  (t) => t.id === currentTrack?.id
                )}
                isPlaying={isPlaying}
                removeFromQueue={removeFromQueue}
                setQueue={setQueue}
                togglePlay={togglePlay}
                skipTrack={skipTrack}
                previousTrack={previousTrackFunc}
                seekPosition={seekPosition}
                duration={duration}
                listenCount={listenCount}
                handleSeek={handleSeek}
                isLiked={currentTrack ? isTrackLiked(currentTrack) : false}
                repeatMode={repeatMode}
                setRepeatMode={setRepeatMode}
                toggleLike={toggleLikeMobile}
                lyrics={lyrics}
                currentLyricIndex={currentLyricIndex}
                queue={queue}
                previousTracks={previousTracks}
                shuffleOn={shuffleOn}
                shuffleQueue={shuffleQueue}
                showLyrics={showLyrics}
                toggleLyricsView={toggleLyricsView}
                onQueueItemClick={onQueueItemClick}
                setIsPlayerOpen={setIsPlayerOpen}
              />
            )}
          </div>
  
          {/* Desktop Layout */}
          <DesktopLayout
            showContextMenu={showContextMenu}
            setShowContextMenu={setShowContextMenu}
            contextMenuPosition={contextMenuPosition}
            setContextMenuPosition={setContextMenuPosition}
            contextMenuOptions={contextMenuOptions}
            setContextMenuOptions={setContextMenuOptions}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            playlists={playlists}
            setPlaylists={setPlaylists}
            setView={setView}
            openPlaylist={openPlaylist}
            storePlaylist={storePlaylist}
            deletePlaylistByName={deletePlaylistByName}
            view={view}
            greeting={greeting}
            mounted={mounted}
            setShowPwaModal={setShowPwaModal}
            showPwaModal={showPwaModal}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            setShowSpotifyToDeezerModal={setShowSpotifyToDeezerModal}
            currentPlaylist={currentPlaylist}
            setCurrentPlaylist={setCurrentPlaylist}
            playlistSearchQuery={playlistSearchQuery}
            setPlaylistSearchQuery={setPlaylistSearchQuery}
            handlePlaylistSearch={handlePlaylistSearch}
            playlistSearchResults={playlistSearchResults}
            setPlaylistSearchResults={setPlaylistSearchResults}
            addTrackToPlaylist={addTrackToPlaylist}
            setShowSearchInPlaylistCreation={setShowSearchInPlaylistCreation}
            setShowCreatePlaylist={setShowCreatePlaylist}
            setQueue={setQueue}
            setCurrentTrack={setCurrentTrack}
            setIsPlaying={setIsPlaying}
            playTrack={playTrack}
            addToQueue={addToQueue}
            openAddToPlaylistModal={openAddToPlaylistModal}
            toggleLike={toggleLike}
            isTrackLiked={isTrackLiked}
            handleContextMenu={handleContextMenu}
            shuffleQueue={shuffleQueue}
            downloadPlaylist={downloadPlaylist}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchType={searchType}
            setSearchType={setSearchType}
            handleSearch={handleSearch}
            fetchSearchResults={fetchSearchResults}
            searchResults={searchResults}
            recentSearches={recentSearches}
            setRecentSearches={setRecentSearches}
            showQueue={showQueue}
            queue={queue}
            previousTracks={previousTracks}
            onQueueItemClick={onQueueItemClick}
            volume={volume}
            onVolumeChange={onVolumeChange}
            audioQuality={audioQuality}
            setAudioQuality={setAudioQuality}
            storeSetting={storeSetting}
            jumpBackIn={jumpBackIn}
            recommendedTracks={recommendedTracks}
          />
  
          {/* Desktop Footer */}
          {mounted && (
            <footer className="fixed bottom-0 left-0 right-0">
              {currentTrack ? (
                <DesktopPlayer
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  previousTracks={previousTracks}
                  setQueue={setQueue}
                  togglePlay={togglePlay}
                  skipTrack={skipTrack}
                  previousTrack={previousTrackFunc}
                  seekPosition={seekPosition}
                  duration={duration}
                  handleSeek={handleSeek}
                  isLiked={isTrackLiked(currentTrack)}
                  repeatMode={repeatMode}
                  setRepeatMode={setRepeatMode}
                  toggleLike={toggleLikeDesktop}
                  lyrics={lyrics}
                  currentLyricIndex={currentLyricIndex}
                  showLyrics={showLyrics}
                  toggleLyricsView={toggleLyricsView}
                  shuffleOn={shuffleOn}
                  shuffleQueue={shuffleQueue}
                  queue={queue}
                  currentTrackIndex={queue.findIndex(
                    (x) => x.id === currentTrack.id
                  )}
                  removeFromQueue={removeFromQueue}
                  onQueueItemClick={onQueueItemClick}
                  setIsPlayerOpen={setIsPlayerOpen}
                  volume={volume}
                  onVolumeChange={onVolumeChange}
                  audioQuality={audioQuality}
                  onCycleAudioQuality={onCycleAudioQuality}
                  listenCount={listenCount}
                  downloadTrack={downloadTrack}
                />
              ) : (
                <div className="bg-gray-800 text-white p-4 text-center">
                  No track is currently playing.
                </div>
              )}
            </footer>
          )}
        </div>
      )}
    </>
  );  
}
