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
  useCallback,
  MouseEvent,
  useMemo,
} from "react";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Bell,
  Clock,
  Cog,
  Play,
  Shuffle,
  Plus,
  User,
  Download,
  LogOut,
  ChevronLeft,
  X,
  ChevronRight,
  MoreVertical,
  UploadCloud,
  Music,
  Volume2,
  Check,
  Wifi,
  Shield,
  Beaker,
  FolderPlus,
  ChevronDown,
  ArrowRight,
  Trash2,
} from "lucide-react";
import debounce from "lodash/debounce";

// ----- HOOKS & LIBRARIES -----
import { useAudio } from "../lib/hooks/useAudio";
import { setupMediaSession } from "../lib/hooks/useMediaSession";
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
import { handleFetchLyrics } from "../lib/api/lyrics";
import audioElement from "../lib/managers/audioManager";

// ----- COMPONENTS -----
import MobilePlayer from "./players/mobilePlayer";
import DesktopPlayer from "./players/DesktopPlayer";
import Onboarding from "./onboarding/Onboarding";
import CustomContextMenu from "./common/CustomContextMenu";
import TrackItem from "./common/TrackItem";
import { SpotifyToDeezer } from "./onboarding/SpotifyToDeezer";

// ----- UTILITIES & HELPERS -----
import { cn } from "../lib/utils/utils";
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
} from "../lib/types/types";

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

/**
 * Setup Discord RPC presence with the currently playing track info.
 * (Stub for any RPC or external integrations.)
 */
async function setupDiscordRPC(
  trackTitle: string,
  artistName: string
): Promise<void> {
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

/**
 * The main entry component for our entire app, handling both
 * Mobile and Desktop experiences. Includes:
 * - Onboarding
 * - Playlist management
 * - Searching, playback, queue, context menu, etc.
 */
export function SpotifyClone(): JSX.Element {
  // ---------------------------------------------------------------------------
  //                                STATE
  // ---------------------------------------------------------------------------
  const [view, setView] = useState<
    "home" | "search" | "playlist" | "settings" | "library"
  >("home");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [jumpBackIn, setJumpBackIn] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [previousTracks, setPreviousTracks] = useState<Track[]>([]);
  const [shuffleOn, setShuffleOn] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [seekPosition, setSeekPosition] = useState<number>(0);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] =
    useState<boolean>(false);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<
    string | null
  >(null);
  const [showSearchInPlaylistCreation, setShowSearchInPlaylistCreation] =
    useState<boolean>(false);
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] =
    useState<Track[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [contextMenuOptions, setContextMenuOptions] = useState<
    ContextMenuOption[]
  >([]);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const [listenCount, setListenCount] = useState<number>(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [greeting, setGreeting] = useState<string>(getDynamicGreeting());
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<"tracks">("tracks");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [audioQuality, setAudioQuality] = useState<
    "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"
  >("HIGH");
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showArtistSelection, setShowArtistSelection] =
    useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [showSpotifyToDeezerModal, setShowSpotifyToDeezerModal] =
    useState<boolean>(false);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState<string>("");
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Track[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        alert("This track is already in the playlist.");
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
      setPreviousTracks((prev) =>
        currentTrack ? [currentTrack, ...prev] : prev
      );
      setQueue((prev) => {
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered];
      });

      setCurrentTrack(track);
      setIsPlaying(true);

      void playTrackFromSource(track, 0);
    },
    [currentTrack, playTrackFromSource, setIsPlaying]
  );

  /**
   * Toggles the current track's play state. If no track is loaded, does nothing.
   */
  const togglePlay = useCallback(() => {
    if (!currentTrack || !audioElement) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      void audioElement.play();
    }
    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, setIsPlaying]);

  /**
   * Moves playback to the previous track if one exists in 'previousTracks'.
   */
  const previousTrackFunc = useCallback(() => {
    if (!previousTracks.length || !audioElement) {
      alert("Cannot go to the previous track: no track in history.");
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
      alert("Cannot skip track: no next track available.");
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
        cover_medium: track.album?.cover_medium || "",
        cover_small: track.album?.cover_small || "",
        cover_big: track.album?.cover_big || "",
        cover_xl: track.album?.cover_xl || "",
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
      image: newPlaylistImage || "/placeholder.svg",
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
   * Forces a track to be downloaded as a Blob and also stored
   * for offline playback in the app.
   */
  const downloadTrack = useCallback(
    async (track: Track) => {
      try {
        const blob = await loadAudioBuffer(track.id);
        if (!blob) {
          alert("Failed to download track.");
          return;
        }

        // Store in IndexedDB for offline usage
        await storeTrackBlob(track.id, blob);

        // Also allow the user to save to local disk
        saveAs(blob, `${track.title} - ${track.artist.name}.mp3`);
        alert(
          "Track downloaded and available for offline playback within the app."
        );
      } catch (error) {
        console.error("Error downloading track:", error);
        alert("Failed to download track.");
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
   * Opens a playlist and navigates the user to the 'playlist' view.
   */
  const openPlaylist = useCallback((pl: Playlist) => {
    setCurrentPlaylist(pl);
    setView("playlist");
  }, []);

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

  /**
   * Refresh greeting message every hour in the background.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Keeps the current lyric line in sync with the audio's currentTime.
   * Uses requestAnimationFrame for smooth updates.
   */
  useEffect(() => {
    let animFrame: number | null = null;
    function updateLyric() {
      if (!audioElement) {
        animFrame = requestAnimationFrame(updateLyric);
        return;
      }
      const currentT = audioElement.currentTime;
      const activeIndex = lyrics.findIndex((ly, i) => {
        const isLast = i === lyrics.length - 1;
        const nextTime = isLast ? Infinity : lyrics[i + 1].time;
        return currentT >= ly.time && currentT < nextTime;
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

  /**
   * Closes the context menu when 'Escape' is pressed.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowContextMenu(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Shows loading spinner if 'searchQuery' changes, simulating network delay.
   * Useful for improved user feedback.
   */
  useEffect(() => {
    if (searchQuery) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  /**
   * Sets up audio event listeners (timeupdate, ended) to track currentTime
   * and handle the track end logic.
   */
  useEffect(() => {
    if (audioElement) {
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
  }, [handleTrackEnd]);

  /**
   * Sets the callback for when a track finishes to 'handleTrackEnd'.
   * Helps unify logic for mobile/desktop usage of the audio hook.
   */
  useEffect(() => {
    setOnTrackEndCallback(handleTrackEnd);
  }, [handleTrackEnd, setOnTrackEndCallback]);

  /**
   * Sets up the Media Session metadata for lock-screen controls (mobile)
   * or system-level media controls (desktop).
   */
  useEffect(() => {
    if (!audioElement) {
      return;
    }
    const cleanup = setupMediaSession(currentTrack, isPlaying, {
      getCurrentPlaybackTime: () => audioElement?.currentTime || 0,
      handleSeek: (time: number) => {
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

  /**
   * Whenever 'currentTrack' changes, store it in local settings so
   * that user can pick up exactly where they left off.
   */
  useEffect(() => {
    if (currentTrack) {
      storeSetting("currentTrack", JSON.stringify(currentTrack)).catch((err) =>
        console.error("Failed to store current track:", err)
      );
    }
  }, [currentTrack]);

  /**
   * Initialization effect on app mount:
   *  - loads recommended tracks, queue, volume, shuffle, audio quality, etc.
   *  - attempts to resume last track.
   *  - sets up Liked Songs if not present.
   *  - triggers Onboarding if not previously done.
   */
  useEffect(() => {
    async function init(): Promise<void> {
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

        // Resume last track
        if (savedTrack) {
          const track: Track = JSON.parse(savedTrack) as Track;
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    }
    void init();
    // Also handle data-saver detection
    if (isDataSaverMode()) {
      setAudioQuality("DATA_SAVER");
      void storeSetting("audioQuality", "DATA_SAVER");
    }
    setMounted(true);
  }, [setIsPlaying, setVolume]);

  /**
   * Watches the queue for changes and updates the stored queue in IDB accordingly.
   */
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

  /**
   * Whenever we have a valid currentTrack, we set up:
   *  - playback from source,
   *  - fetch lyrics,
   *  - store recently played,
   *  - get listen counts,
   *  - set Discord RPC
   */
  useEffect(() => {
    if (currentTrack) {
      void playTrackFromSource(currentTrack, 0)
        .then(() => {
          setIsPlaying(true);
          return fetchLyrics(currentTrack);
        })
        .then(() => storeRecentlyPlayed(currentTrack))
        .then((recent) => setJumpBackIn(recent))
        .then(() => getListenCounts())
        .then((counts) => setListenCount(counts[currentTrack.id] || 0))
        .then(() =>
          setupDiscordRPC(currentTrack.title, currentTrack.artist.name)
        )
        .catch((err) => {
          console.error("Error during playback setup:", err);
          alert("An error occurred while setting up the track.");
        });
    }
  }, [currentTrack, playlists, playTrackFromSource, fetchLyrics, setIsPlaying]);

  /**
   * Cleanup loaded data URL from memory once audio finishes loading.
   */
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

  /**
   * Continuously updates 'seekPosition' while playing.
   */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setSeekPosition(getCurrentPlaybackTime());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, getCurrentPlaybackTime]);

  /**
   * Persistence of 'previousTracks' in local settings.
   */
  useEffect(() => {
    if (previousTracks.length > 0) {
      void storeSetting("previousTracks", JSON.stringify(previousTracks)).catch(
        (err) => console.error("Failed to store previous tracks:", err)
      );
    }
  }, [previousTracks]);

  /**
   * Loads saved 'previousTracks' if present.
   */
  useEffect(() => {
    async function loadPreviousTracks(): Promise<void> {
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

  /**
   * Loads recommended tracks from IDB if available.
   */
  useEffect(() => {
    async function loadRecommendedTracks(): Promise<void> {
      try {
        const savedTracks = await getRecommendedTracks();
        if (savedTracks && savedTracks.length > 0) {
          setRecommendedTracks(savedTracks);
        } else {
          setRecommendedTracks([]);
        }
      } catch (err) {
        console.error("Error loading recommended tracks:", err);
      }
    }
    void loadRecommendedTracks();
  }, []);

  /**
   * If user is searching tracks to add to an existing playlist, react to changes
   * in playlistSearchQuery. If the query is short, clear the results.
   */
  useEffect(() => {
    if (playlistSearchQuery.trim().length > 2) {
      void handlePlaylistSearch(playlistSearchQuery);
    } else {
      setPlaylistSearchResults([]);
    }
  }, [playlistSearchQuery, handlePlaylistSearch]);

  const toggleTrackSelection = useCallback((tr: Track) => {
    setSelectedTracksForNewPlaylist((prev) =>
      prev.find((x) => x.id === tr.id)
        ? prev.filter((x) => x.id !== tr.id)
        : [...prev, tr]
    );
  }, []);

  // ---------------------------------------------------------------------------
  //                             MOBILE LAYOUT
  // ---------------------------------------------------------------------------
  /**
   * Contains all rendering for the mobile layout (screens < md).
   * Wrapped in hidden logic for desktop.
   */
  const MobileLayout = (): JSX.Element => {
    return (
      <div className="md:hidden flex flex-col h-[100dvh]">
        {/* Mobile Header */}
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
          <div className="flex space-x-4">
            <Bell className="w-6 h-6" />
            <Clock className="w-6 h-6" />
            <div className="relative">
              <button
                className="w-6 h-6 rounded-full flex items-center justify-center"
                onClick={() => setShowSettingsMenu((p) => !p)}
              >
                <Cog className="w-6 h-6 text-white" />
              </button>
              {showSettingsMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-[#0a1929] rounded-lg shadow-xl z-[99999]
                  border border-[#1e3a5f] animate-slideIn"
                >
                  <button
                    className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
                    transition-colors duration-200 group rounded-t-lg"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      const dp = window.deferredPrompt;
                      if (dp) {
                        dp.prompt();
                        void dp.userChoice.then(() => {
                          window.deferredPrompt = undefined;
                        });
                      } else {
                        setShowPwaModal(true);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-3 text-[#90caf9] group-hover:text-white" />
                    Install App
                    <span className="ml-2 bg-[#1a237e] text-xs text-white px-2 py-0.5 rounded-full">
                      New
                    </span>
                  </button>
                  <button
                    className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 w-full text-left
                    rounded-b-lg"
                    onClick={() => setShowSettingsMenu(false)}
                  >
                    <LogOut className="w-4 h-4 mr-3 text-white" />
                    Log Out
                  </button>
                </div>
              )}
              {showPwaModal && (
                <div
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999999]
                    transition-all duration-300 animate-fadeIn"
                >
                  <div
                    className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl 
                    border border-[#1e3a5f] animate-slideIn m-4"
                  >
                    <h2 className="text-2xl font-bold text-center mb-6 text-[#90caf9]">
                      Install App
                    </h2>
                    <p className="text-gray-300">
                      On desktop, you can install the PWA by clicking the
                      "Install App" button in the URL bar if supported, or
                      pressing the "Install" button. On Android, you can tap the
                      three dots menu in Chrome and select "Add to Home screen."
                      On iOS, use Safari's share button and select "Add to Home
                      Screen."
                    </p>
                    <button
                      onClick={() => setShowPwaModal(false)}
                      className="mt-8 px-6 py-3 bg-[#1a237e] text-white rounded-lg w-full
                        transition-all duration-300 hover:bg-[#283593]"
                    >
                      Close
                    </button>
                    <div className="mt-4">
                      <label className="flex items-center text-sm text-gray-400 space-x-2">
                        <input
                          type="checkbox"
                          onChange={() => {
                            // If user wants to hide this prompt forever, storeSetting('hidePwaPrompt','true')
                            void storeSetting("hidePwaPrompt", "true");
                            setShowPwaModal(false);
                          }}
                        />
                        <span>Don’t show again</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav className="px-4 mb-4">
          <ul className="flex space-x-2 overflow-x-auto custom-scrollbar">
            <li>
              <button className="bg-gray-800 rounded-full px-4 py-2 text-sm font-medium">
                Music
              </button>
            </li>
            <li>
              <button className="bg-gray-800 rounded-full px-4 py-2 text-sm font-medium">
                Podcasts &amp; Shows
              </button>
            </li>
            <li>
              <button className="bg-gray-800 rounded-full px-4 py-2 text-sm font-medium">
                Audiobooks
              </button>
            </li>
          </ul>
        </nav>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(4rem+2rem+env(safe-area-inset-bottom))]">
          {/* Conditional rendering of the current view */}
          {view === "playlist" && currentPlaylist ? (
            <section className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
              {/* Hero Section */}
              <div className="relative h-[40vh] overflow-hidden">
                <div className="absolute inset-0">
                  <img
                    src={
                      currentPlaylist.image ||
                      "assets/images/defaultPlaylistImage.png"
                    }
                    alt={currentPlaylist.name || "default playlist error alt"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 backdrop-blur-sm"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">
                      {currentPlaylist.name}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <button
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 
                            text-white rounded-full px-8 py-3 text-base font-medium
                            transition-all duration-200 hover:bg-opacity-90 shadow-lg"
                        onClick={() => {
                          setQueue(currentPlaylist.tracks);
                          setCurrentTrack(currentPlaylist.tracks[0]);
                          setIsPlaying(true);
                        }}
                      >
                        <Play className="w-5 h-5" />
                        <span>Play All</span>
                      </button>

                      <button
                        className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 
                            text-white rounded-full px-6 py-3 backdrop-blur-lg 
                            transition-all duration-300"
                        onClick={shuffleQueue}
                      >
                        <Shuffle className="w-5 h-5" />
                      </button>

                      <button
                        className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 
                            text-white rounded-full px-6 py-3 backdrop-blur-lg 
                            transition-all duration-300"
                        onClick={() => downloadPlaylist(currentPlaylist)}
                      >
                        {isDownloading ? (
                          <div className="flex items-center space-x-2">
                            <Download
                              className={`w-5 h-5 ${
                                downloadProgress === 100 ? "text-green-500" : ""
                              }`}
                            />
                            <span>{downloadProgress}%</span>
                          </div>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="max-w-7xl mx-auto px-8 py-6">
                {/* Search Bar */}
                <div className="mb-8">
                  <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for songs to add..."
                      value={playlistSearchQuery}
                      onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && playlistSearchQuery.trim()) {
                          void handlePlaylistSearch(playlistSearchQuery);
                        }
                      }}
                      className="w-full pl-12 pr-12 py-4 bg-gray-800/30 text-white placeholder-gray-400
                            rounded-xl border border-gray-700 focus:border-purple-500
                            focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                    />
                    {playlistSearchQuery && (
                      <button
                        onClick={() => {
                          setPlaylistSearchQuery("");
                          setPlaylistSearchResults([]);
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                      </button>
                    )}
                  </div>
                  {playlistSearchResults.length > 0 && (
                    <div
                      className="mt-4 max-w-2xl bg-gray-800/50 backdrop-blur-lg rounded-xl 
                            border border-gray-700 overflow-hidden"
                    >
                      {playlistSearchResults.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-700/50 
                                transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={
                                track.album.cover_small ||
                                "assets/default-album.jpg"
                              }
                              alt={track.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-white">
                                {track.title}
                              </p>
                              <p className="text-sm text-gray-400">
                                {track.artist.name}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => void addTrackToPlaylist(track)}
                            className="flex items-center space-x-2 bg-green-500/20 text-green-400
                                hover:bg-green-500 hover:text-white px-4 py-2 rounded-lg
                                transition-all duration-300"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tracks List */}
                <div className="space-y-2">
                  {currentPlaylist.tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Music className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-4">
                        This playlist is empty
                      </p>
                      <button
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700
                            text-white rounded-full px-6 py-3 font-medium
                            transition-all duration-300"
                        onClick={() => {
                          setShowSearchInPlaylistCreation(true);
                          setCurrentPlaylist(currentPlaylist);
                        }}
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Songs</span>
                      </button>
                    </div>
                  ) : (
                    currentPlaylist.tracks.map((track, idx) => (
                      <TrackItem
                        key={idx}
                        track={track}
                        index={idx}
                        onTrackClick={playTrack}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          ) : view === "library" ? (
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your Library</h2>
                <button
                  className="p-2 rounded-full hover:bg-white/10"
                  onClick={() => setShowCreatePlaylist(true)}
                >
                  <Plus className="w-6 h-6 text-white" />
                </button>
              </div>
              <div
                className={cn(
                  "grid gap-4",
                  sidebarCollapsed ? "grid-cols-1" : "grid-cols-1"
                )}
              >
                {playlists.map((playlist) => (
                  <div
                    key={playlist.name}
                    className={cn(
                      "bg-gray-800 bg-opacity-40 rounded-lg flex items-center cursor-pointer relative",
                      sidebarCollapsed ? "p-2 justify-center" : "p-4",
                      playlist.pinned && "border-2 border-blue-900"
                    )}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", playlist.name);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedPlaylistName =
                        e.dataTransfer.getData("text/plain");
                      const fromIndex = playlists.findIndex(
                        (p) => p.name === droppedPlaylistName
                      );
                      const toIndex = playlists.findIndex(
                        (p) => p.name === playlist.name
                      );
                      const updated = [...playlists];
                      const [removed] = updated.splice(fromIndex, 1);
                      updated.splice(toIndex, 0, removed);
                      setPlaylists(updated);
                      void Promise.all(updated.map((pl) => storePlaylist(pl)));
                    }}
                    onClick={() => openPlaylist(playlist)}
                    onContextMenu={(e) => handleContextMenu(e, playlist)}
                    style={{ userSelect: "none" }}
                  >
                    <img
                      src={playlist.image || "assets/"}
                      alt={playlist.name || "Playlist Cover"}
                      className={cn(
                        "rounded",
                        sidebarCollapsed ? "w-10 h-10" : "w-12 h-12 mr-3"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium text-sm flex-1">
                          {playlist.name}
                        </span>
                        {playlist.downloaded && (
                          <Download className="w-4 h-4 text-green-500 ml-2" />
                        )}
                        <button
                          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const opts: ContextMenuOption[] = [
                              {
                                label: playlist.pinned
                                  ? "Unpin Playlist"
                                  : "Pin Playlist",
                                action: () => {
                                  const updatedPlaylists = playlists.map((pl) =>
                                    pl.name === playlist.name
                                      ? { ...pl, pinned: !pl.pinned }
                                      : pl
                                  );
                                  setPlaylists(updatedPlaylists);
                                  void Promise.all(
                                    updatedPlaylists.map((pl) =>
                                      storePlaylist(pl)
                                    )
                                  );
                                },
                              },
                              {
                                label: "Delete Playlist",
                                action: () => {
                                  void deletePlaylistByName(playlist.name).then(
                                    (nl) => setPlaylists(nl)
                                  );
                                },
                              },
                              {
                                label: "Download Playlist",
                                action: () => downloadPlaylist(playlist),
                              },
                            ];
                            setContextMenuPosition({
                              x: e.clientX,
                              y: e.clientY,
                            });
                            setContextMenuOptions(opts);
                            setShowContextMenu(true);
                          }}
                        >
                          <span className="w-4 h-4 text-white">
                            <MoreVertical />
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              {/* HOME */}
              <section className="mb-6">
                <div className="grid grid-cols-2 gap-2">
                  {playlists
                    .filter((pl) => pl.pinned)
                    .map((pl) => (
                      <div
                        key={pl.name}
                        className="flex items-center space-x-3 bg-gray-800 bg-opacity-40 rounded-md p-2 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                      >
                        <img
                          src={pl.image || "assets/"}
                          alt={pl.name || "Playlist Cover"}
                          className="w-10 h-10 rounded-md"
                        />
                        <span className="font-medium text-sm">{pl.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedPlaylists = playlists.map((playlist) =>
                              playlist.name === pl.name
                                ? { ...playlist, pinned: false }
                                : playlist
                            );
                            setPlaylists(updatedPlaylists);
                            void Promise.all(
                              updatedPlaylists.map((playlist) =>
                                storePlaylist(playlist)
                              )
                            );
                          }}
                          className="ml-auto p-1 text-red-400 hover:text-red-500"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                </div>
              </section>

              <section className="px-6 mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {jumpBackIn.length > 0 ? "Jump Back In" : "Suggested for you"}
                </h2>
                <div className="relative">
                  <div
                    className={cn(
                      "flex gap-4",
                      "overflow-x-auto",
                      "snap-x snap-mandatory",
                      "pb-4",
                      "no-scrollbar"
                    )}
                  >
                    {(jumpBackIn.length > 0
                      ? jumpBackIn
                      : searchResults.slice(0, 5)
                    ).map((track, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex-shrink-0",
                          "w-[180px]",
                          "snap-start",
                          "group relative",
                          "transition-transform duration-200 ease-out",
                          "hover:scale-[1.02]",
                          "select-none"
                        )}
                      >
                        <div className="relative aspect-square mb-3">
                          <img
                            src={
                              track.album.cover_medium ||
                              "assets/default-album.jpg"
                            }
                            alt={track.title || "Album Cover"}
                            className={cn(
                              "w-full h-full",
                              "object-cover rounded-xl",
                              "shadow-lg",
                              "transition-opacity duration-200",
                              "bg-gray-900"
                            )}
                            draggable={false}
                            loading="lazy"
                          />
                          <div
                            className={cn(
                              "absolute inset-0",
                              "rounded-xl",
                              "flex items-center justify-center",
                              "bg-black/40",
                              "opacity-0 group-hover:opacity-100",
                              "transition-all duration-200"
                            )}
                          >
                            <button
                              onClick={() => playTrack(track)}
                              className={cn(
                                "p-3 rounded-full",
                                "bg-green-500",
                                "hover:bg-green-400",
                                "hover:scale-105",
                                "transform",
                                "transition-all duration-200",
                                "shadow-xl"
                              )}
                            >
                              <Play className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1 px-1">
                          <p className="font-medium text-sm text-gray-100 line-clamp-1">
                            {track.title}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-1">
                            {track.artist?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-4",
                      "w-12",
                      "bg-gradient-to-r from-black to-transparent",
                      "pointer-events-none"
                    )}
                  />
                  <div
                    className={cn(
                      "absolute right-0 top-0 bottom-4",
                      "w-12",
                      "bg-gradient-to-l from-black to-transparent",
                      "pointer-events-none"
                    )}
                  />
                </div>
              </section>

              <section className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedTracks.length > 0 ? (
                    recommendedTracks.map((track, idx) => (
                      <TrackItem
                        key={track.id}
                        track={track}
                        index={idx}
                        onTrackClick={playTrack}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No recommendations available.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Mobile Footer Nav */}
        {!isPlayerOpen && (
          <footer
            className="bg-black p-4 flex justify-around fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)]"
            style={{
              zIndex: 9999,
              paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
            }}
          >
            <button
              className="flex flex-col items-center text-gray-400 hover:text-white"
              onClick={() => {
                setView("home");
                setSearchQuery("");
              }}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button
              className="flex flex-col items-center text-gray-400 hover:text-white"
              onClick={() => {
                setIsSearchOpen(true);
                setView("search");
              }}
            >
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Search</span>
            </button>

            {/* Search Drawer */}
            {isSearchOpen && view === "search" && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                className="fixed inset-0 bg-black z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setView("home");
                    }}
                    className="p-2"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <h1 className="text-lg font-semibold">Search</h1>
                  <div className="w-10" />
                </div>
                <div className="p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) handleSearch(searchQuery);
                    }}
                    className="relative"
                  >
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="What do you want to listen to?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          handleSearch(searchQuery);
                        }
                      }}
                      className="w-full px-4 py-3 rounded-full bg-gray-800 text-white placeholder-gray-500 
                            focus:outline-none focus:ring-2 focus:ring-green-500 pl-12 transition-all 
                            duration-200 ease-in-out"
                    />
                  </form>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSearchType("tracks")}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        searchType === "tracks"
                          ? "bg-white text-black"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      Tracks
                    </button>
                  </div>
                </div>

                {/* Recent searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white/90">
                        Recent Searches
                      </h3>
                      <button
                        onClick={() => setRecentSearches([])}
                        className="px-4 py-2 text-sm font-medium bg-red-500 rounded hover:bg-red-600 text-white"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((query, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                        >
                          <button
                            onClick={() => {
                              setSearchQuery(query);
                              handleSearch(query);
                            }}
                            className="flex items-center space-x-4 text-left"
                          >
                            <Clock className="w-5 h-5 text-purple-400" />
                            <span className="truncate">{query}</span>
                          </button>
                          <button
                            onClick={() => {
                              const upd = recentSearches.filter(
                                (_, i2) => i2 !== idx
                              );
                              setRecentSearches(upd);
                            }}
                            className="text-red-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {searchQuery && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400">
                          No results found for "{searchQuery}"
                        </p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold mb-4">
                          Search Results
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                          {searchResults.map((res, idx) => (
                            <TrackItem
                              key={res.id}
                              track={res}
                              index={idx}
                              addToQueue={addToQueue}
                              openAddToPlaylistModal={openAddToPlaylistModal}
                              toggleLike={toggleLike}
                              isLiked={isTrackLiked(res)}
                              onTrackClick={(t) => {
                                playTrack(t);
                                setIsSearchOpen(false);
                                setView("home");
                              }}
                              onContextMenu={(e) => handleContextMenu(e, res)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <button
              className="flex flex-col items-center text-gray-400 hover:text-white"
              onClick={() => setView("library")}
            >
              <Library className="w-6 h-6" />
              <span className="text-xs mt-1">Your Library</span>
            </button>
          </footer>
        )}

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
    );
  };

  // ---------------------------------------------------------------------------
  //                            DESKTOP LAYOUT
  // ---------------------------------------------------------------------------
  /**
   * Renders all desktop-specific UI (screens >= md). Collapsible sidebar,
   * top-level navigation, full player bar, etc.
   */
  const DesktopLayout = (): JSX.Element => {
    return (
      <div className="hidden md:flex flex-1 gap-2 p-2 overflow-y-auto custom-scrollbar">
        {showContextMenu && (
          <CustomContextMenu
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            onClose={() => setShowContextMenu(false)}
            options={contextMenuOptions}
          />
        )}

        {/* Collapsible Sidebar */}
        <aside
          className={cn(
            "relative h-full",
            "bg-gradient-to-b from-gray-900 to-black",
            "transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "w-20" : "w-72",
            "overflow-y-auto overflow-x-hidden",
            "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400",
            "rounded-r-xl"
          )}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "absolute -right-1 top-6",
              "w-6 h-12",
              "flex items-center justify-center",
              "bg-gray-800 rounded-full",
              "border border-gray-700",
              "hover:bg-gray-700",
              "transition-all duration-200",
              "shadow-lg hover:shadow-xl",
              "z-50"
            )}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-300" />
            )}
          </button>

          <nav className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-2">
              {[
                { icon: Home, label: "Home", action: () => setView("home") },
                {
                  icon: Search,
                  label: "Search",
                  action: () => setView("search"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    "w-full group relative",
                    "flex items-center",
                    "px-3 py-2.5 rounded-lg",
                    "hover:bg-white/10",
                    "transition-all duration-200",
                    sidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                >
                  <item.icon className="w-5 h-5 text-gray-300 group-hover:text-white" />
                  {sidebarCollapsed ? (
                    <div
                      className={cn(
                        "absolute left-full ml-2 px-2 py-1 bg-gray-800 rounded-md",
                        "opacity-0 group-hover:opacity-100 pointer-events-none",
                        "transition-opacity duration-200 z-[9999]"
                      )}
                    >
                      <span className="text-sm text-white whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <span className="ml-3 text-sm font-medium text-gray-300 group-hover:text-white">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="h-px bg-white/10" />

            {/* Library Section */}
            <div className="space-y-4">
              <div
                className={cn(
                  "flex items-center px-3 py-2",
                  sidebarCollapsed ? "justify-center" : "justify-between"
                )}
              >
                <div className="flex items-center">
                  <Library className="w-5 h-5 text-gray-300" />
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm font-medium text-gray-300">
                      Your Library
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <button
                    onClick={() => setShowCreatePlaylist(true)}
                    className={cn(
                      "p-1.5 rounded-full hover:bg-white/10 transition-colors duration-200"
                    )}
                  >
                    <Plus className="w-4 h-4 text-gray-300 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Playlist Items */}
              <div className="space-y-1">
                {playlists.map((pl) => (
                  <div
                    key={pl.name}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                      "transition-all duration-200",
                      pl.pinned && "bg-white/5",
                      sidebarCollapsed && "mr-5"
                    )}
                    onClick={() => openPlaylist(pl)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={pl.image || "placeholder"}
                        alt={pl.name}
                        className={cn(
                          "rounded-md object-cover shadow-md",
                          sidebarCollapsed ? "w-10 h-10" : "w-12 h-12"
                        )}
                      />
                      {pl.downloaded && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                          <Download className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-200 truncate">
                            {pl.name}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">
                            Playlist
                          </p>
                        </div>
                        <button
                          className={cn(
                            "opacity-0 group-hover:opacity-100",
                            "p-1.5 rounded-full transition-all duration-200"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            const options: ContextMenuOption[] = [
                              {
                                label: pl.pinned
                                  ? "Unpin Playlist"
                                  : "Pin Playlist",
                                action: () => {
                                  const updated = playlists.map((p) =>
                                    p.name === pl.name
                                      ? { ...p, pinned: !p.pinned }
                                      : p
                                  );
                                  setPlaylists(updated);
                                  void Promise.all(updated.map(storePlaylist));
                                },
                              },
                              {
                                label: "Delete Playlist",
                                action: () => {
                                  void deletePlaylistByName(pl.name).then(
                                    setPlaylists
                                  );
                                },
                              },
                            ];
                            setContextMenuPosition({
                              x: e.clientX,
                              y: e.clientY,
                            });
                            setContextMenuOptions(options);
                            setShowContextMenu(true);
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400 hover:text-white" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] bg-gradient-to-b from-gray-900 to-black rounded-lg p-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
            <div className="relative flex items-center">
              {mounted &&
                !(
                  window.matchMedia &&
                  window.matchMedia("(display-mode: standalone)").matches
                ) && (
                  <>
                    <button
                      className="bg-[#1a237e] text-white rounded-full px-6 py-2.5 text-sm font-semibold ml-4
                        transition-all duration-300 hover:bg-[#283593] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2"
                      onClick={() => {
                        const dp = window.deferredPrompt;
                        if (dp) {
                          dp.prompt();
                          void dp.userChoice.then(() => {
                            window.deferredPrompt = undefined;
                          });
                        } else {
                          setShowPwaModal(true);
                        }
                      }}
                    >
                      <span className="flex items-center">
                        <Download className="w-5 h-5 mr-2" />
                        Install App
                      </span>
                    </button>
                    {showPwaModal && (
                      <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999999] 
                        transition-all duration-300 animate-fadeIn"
                      >
                        <div
                          className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl 
                            border border-[#1e3a5f] animate-slideIn"
                        >
                          <h2 className="text-2xl font-bold text-center mb-6 text-[#90caf9]">
                            Install App
                          </h2>
                          <p className="text-gray-300 text-center">
                            You can install this as a PWA on desktop or mobile.
                            If your browser supports it, you’ll see an install
                            icon in the address bar or you can use the button
                            above.
                          </p>
                          <button
                            onClick={() => setShowPwaModal(false)}
                            className="mt-8 px-6 py-3 bg-[#1a237e] text-white rounded-lg w-full
                                transition-all duration-300 hover:bg-[#283593]"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              <div className="relative ml-4">
                <button
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="w-5 h-5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl z-10 border border-gray-700">
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left rounded-t-lg"
                      onClick={() => {
                        setView("settings");
                        setShowUserMenu(false);
                      }}
                    >
                      <Cog className="w-5 h-5 mr-3" />
                      Settings
                    </button>
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-5 h-5 mr-3" />
                      Profile
                    </button>
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left"
                      onClick={() => setShowSpotifyToDeezerModal(true)}
                    >
                      <UploadCloud className="w-5 h-5 mr-3" />
                      Migrate Playlists
                    </button>
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left rounded-b-lg"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {showSpotifyToDeezerModal && (
            <div
              className="fixed inset-0 z-[99999] overflow-y-auto"
              onClick={() => setShowSpotifyToDeezerModal(false)}
            >
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300" />
              <div className="flex min-h-screen items-center justify-center p-4">
                <div
                  className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 via-gray-800 to-black border border-gray-700/50 shadow-2xl transition-all duration-300 animate-modal-appear"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center justify-between p-6 border-b border-gray-700/50">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                      Migrate Playlists to Deezer
                    </h2>
                    <button
                      className="group p-2 rounded-full hover:bg-gray-700/50 transition-all duration-200"
                      onClick={() => setShowSpotifyToDeezerModal(false)}
                    >
                      <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                  <div className="relative max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <SpotifyToDeezer />
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "settings" ? (
            <section className="max-w-4xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Settings</h2>
                <div className="flex items-center space-x-2 bg-purple-600/10 text-purple-400 px-4 py-2 rounded-full">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Pro Account</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-6 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          Account
                        </h3>
                        <p className="text-gray-400">
                          Manage your account settings and preferences
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
                      <Music className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        Playback
                      </h3>
                      <p className="text-gray-400">
                        Customize your listening experience
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">
                          Default Volume
                        </label>
                        <div className="flex items-center space-x-2">
                          <Volume2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {Math.round(volume * 100)}%
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) =>
                          onVolumeChange(parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer
                                    focus:outline-none focus:ring-2 focus:ring-purple-500/50
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-4
                                    [&::-webkit-slider-thumb]:h-4
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-purple-500
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-webkit-slider-thumb]:hover:bg-purple-400
                                    [&::-webkit-slider-thumb]:transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-300">
                        Audio Quality
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["MAX", "HIGH", "NORMAL", "DATA_SAVER"].map(
                          (quality) => (
                            <button
                              key={quality}
                              onClick={() => {
                                void storeSetting(
                                  "musicQuality",
                                  quality as
                                    | "MAX"
                                    | "HIGH"
                                    | "NORMAL"
                                    | "DATA_SAVER"
                                );
                                setAudioQuality(
                                  quality as
                                    | "MAX"
                                    | "HIGH"
                                    | "NORMAL"
                                    | "DATA_SAVER"
                                );
                              }}
                              className={`relative p-3 rounded-lg border-2 transition-all duration-200
                                ${
                                  audioQuality === quality
                                    ? "border-purple-500 bg-purple-500/10 text-white"
                                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                                }`}
                            >
                              <span className="text-sm font-medium">
                                {quality.replace("_", " ")}
                              </span>
                              {audioQuality === quality && (
                                <div className="absolute top-1 right-1">
                                  <Check className="w-3 h-3 text-purple-400" />
                                </div>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
                        <Wifi className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          Data Saver
                        </h3>
                        <p className="text-gray-400">
                          Currently set to: {audioQuality}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div
                        className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 
                                    peer-focus:ring-purple-500/25 rounded-full peer 
                                    peer-checked:after:translate-x-full peer-checked:after:border-white 
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:rounded-full after:h-5 after:w-5 
                                    after:transition-all peer-checked:bg-purple-500"
                      ></div>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      icon: Shield,
                      title: "Privacy",
                      desc: "Control your privacy settings",
                      color: "rose",
                    },
                    {
                      icon: Bell,
                      title: "Notifications",
                      desc: "Set notification preferences",
                      color: "orange",
                    },
                    {
                      icon: Beaker,
                      title: "Beta Features",
                      desc: "Try experimental features",
                      color: "emerald",
                    },
                  ].map(({ icon: Icon, title, desc, color }) => (
                    <div
                      key={title}
                      className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-6 transition-all duration-200 cursor-pointer"
                    >
                      <div
                        className={`p-3 bg-${color}-500/10 text-${color}-400 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {title}
                      </h3>
                      <p className="text-sm text-gray-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : view === "playlist" && currentPlaylist ? (
            <section className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
              <div className="relative h-[50vh] overflow-hidden">
                <div className="absolute inset-0">
                  <img
                    src={
                      currentPlaylist.image ||
                      "/images/defaultPlaylistImage.png"
                    }
                    alt={currentPlaylist.name || "Playlist cover"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/80 to-gray-900"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-12 z-10">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-end space-x-6">
                      <img
                        src={
                          currentPlaylist.image ||
                          "/images/defaultPlaylistImage.png"
                        }
                        alt={currentPlaylist.name || "Playlist cover"}
                        className="w-48 h-48 object-cover rounded-xl shadow-2xl"
                      />
                      <div className="flex-1">
                        <span className="text-white/80 text-lg font-medium mb-2">
                          PLAYLIST
                        </span>
                        <h2 className="text-6xl font-bold mb-4 text-white tracking-tight">
                          {currentPlaylist.name}
                        </h2>
                        <p className="text-white/80 mb-6">
                          {currentPlaylist.tracks.length} tracks
                        </p>
                        <div className="flex items-center space-x-4">
                          <button
                            className="flex items-center space-x-3 bg-purple-600 hover:bg-purple-700 
                                        text-white rounded-full px-8 py-4 text-base font-medium
                                        transition-all duration-200 hover:scale-105 shadow-lg"
                            onClick={() => {
                              setQueue(currentPlaylist.tracks);
                              setCurrentTrack(currentPlaylist.tracks[0]);
                              setIsPlaying(true);
                            }}
                          >
                            <Play className="w-6 h-6" />
                            <span>Play All</span>
                          </button>
                          <button
                            className="flex items-center space-x-3 bg-gray-800/50 hover:bg-gray-700/50 
                                        text-white rounded-full px-6 py-4 backdrop-blur-lg 
                                        transition-all duration-300 hover:scale-105"
                            onClick={shuffleQueue}
                          >
                            <Shuffle className="w-5 h-5" />
                            <span>Shuffle</span>
                          </button>
                          <button
                            className="flex items-center space-x-3 bg-gray-800/50 hover:bg-gray-700/50 
                                        text-white rounded-full px-6 py-4 backdrop-blur-lg 
                                        transition-all duration-300 hover:scale-105"
                            onClick={() => downloadPlaylist(currentPlaylist)}
                          >
                            {isDownloading ? (
                              <div className="flex items-center space-x-2">
                                <Download
                                  className={`w-5 h-5 ${
                                    downloadProgress === 100
                                      ? "text-green-500"
                                      : ""
                                  }`}
                                />
                                <span>{downloadProgress}%</span>
                              </div>
                            ) : (
                              <>
                                <Download className="w-5 h-5" />
                                <span>Download</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto px-12 py-8">
                <div className="mb-8">
                  <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for songs to add..."
                      value={playlistSearchQuery}
                      onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && playlistSearchQuery.trim()) {
                          void handlePlaylistSearch(playlistSearchQuery);
                        }
                      }}
                      className="w-full pl-12 pr-12 py-4 bg-gray-800/30 text-white placeholder-gray-400
                                rounded-xl border border-gray-700 focus:border-purple-500
                                focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
                    />
                    {playlistSearchQuery && (
                      <button
                        onClick={() => {
                          setPlaylistSearchQuery("");
                          setPlaylistSearchResults([]);
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                      </button>
                    )}
                  </div>
                  {playlistSearchResults.length > 0 && (
                    <div
                      className="mt-4 max-w-2xl bg-gray-800/50 backdrop-blur-lg rounded-xl 
                                border border-gray-700 overflow-hidden shadow-xl"
                    >
                      {playlistSearchResults.map((track) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-700/50 
                                    transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={
                                track.album.cover_small ||
                                "assets/default-album.jpg"
                              }
                              alt={track.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-white">
                                {track.title}
                              </p>
                              <p className="text-sm text-gray-400">
                                {track.artist.name}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => void addTrackToPlaylist(track)}
                            className="flex items-center space-x-2 bg-green-500/20 text-green-400
                                        hover:bg-green-500 hover:text-white px-4 py-2 rounded-lg
                                        transition-all duration-300"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {currentPlaylist.tracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Music className="w-16 h-16 text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-4">
                        This playlist is empty
                      </p>
                      <button
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700
                                    text-white rounded-full px-6 py-3 font-medium
                                    transition-all duration-300 hover:scale-105"
                        onClick={() => {
                          setShowSearchInPlaylistCreation(true);
                          setCurrentPlaylist(currentPlaylist);
                        }}
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Songs</span>
                      </button>
                    </div>
                  ) : (
                    currentPlaylist.tracks.map((track, idx) => (
                      <TrackItem
                        key={idx}
                        track={track}
                        index={idx}
                        onTrackClick={playTrack}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>
          ) : view === "search" ? (
            <section className="min-h-screen bg-transparent backdrop-blur-sm px-4 py-6">
              <div className="max-w-7xl mx-auto flex flex-col gap-8">
                <div className="flex flex-col space-y-6">
                  <h1
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r 
                                from-purple-400 to-pink-500 text-transparent bg-clip-text text-center animate-gradient"
                  >
                    Discover Your Music
                  </h1>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) handleSearch(searchQuery);
                    }}
                    className="w-full max-w-2xl mx-auto"
                  >
                    <div className="relative group">
                      <Search
                        className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 
                                    text-purple-400 group-hover:text-pink-400 transition-colors duration-300"
                      />
                      <input
                        type="text"
                        placeholder="Search for songs, artists, or albums..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.trim().length > 3) {
                            fetchSearchResults(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && searchQuery.trim()) {
                            handleSearch(searchQuery);
                          }
                        }}
                        className="w-full px-14 py-4 rounded-full bg-black/20 backdrop-blur-lg
                                    text-white placeholder-gray-400 border border-purple-500/20
                                    focus:outline-none focus:ring-2 focus:ring-purple-500/50
                                    text-[15px] transition-all duration-300 hover:bg-black/30"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            fetchSearchResults("");
                          }}
                          className="absolute right-5 top-1/2 transform -translate-y-1/2 text-purple-400 
                                    hover:text-pink-400 transition-colors duration-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </form>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSearchType("tracks")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        searchType === "tracks"
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                          : "bg-black/20 backdrop-blur-lg text-white hover:bg-black/30 border border-purple-500/20"
                      }`}
                    >
                      Tracks
                    </button>
                  </div>
                </div>
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white/90">
                        Recent Searches
                      </h3>
                      <button
                        onClick={() => setRecentSearches([])}
                        className="px-4 py-2 text-sm font-medium bg-red-500 rounded hover:bg-red-600 text-white"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((q, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                        >
                          <button
                            onClick={() => {
                              setSearchQuery(q);
                              fetchSearchResults(q);
                            }}
                            className="flex items-center space-x-4 text-left"
                          >
                            <Clock className="w-5 h-5 text-purple-400" />
                            <span className="truncate">{q}</span>
                          </button>
                          <button
                            onClick={() => {
                              const upd = recentSearches.filter(
                                (_, i2) => i2 !== i
                              );
                              setRecentSearches(upd);
                            }}
                            className="text-red-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {searchQuery && (
                  <div className="animate-fadeIn">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">
                          No results found for "{searchQuery}"
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h2
                            className="text-xl font-bold bg-gradient-to-r from-purple-400 
                                        to-pink-500 text-transparent bg-clip-text"
                          >
                            Search Results
                          </h2>
                          <span className="text-sm text-purple-400">
                            {searchResults.length} items found
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.map((r, idx) => (
                            <TrackItem
                              key={r.id}
                              track={r}
                              index={idx}
                              onTrackClick={playTrack}
                              addToQueue={addToQueue}
                              openAddToPlaylistModal={openAddToPlaylistModal}
                              toggleLike={toggleLike}
                              isLiked={isTrackLiked(r)}
                              onContextMenu={(e) => handleContextMenu(e, r)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          ) : (
            <>
              {playlists.length > 0 && (
                <section className="mb-8 overflow-y-auto custom-scrollbar">
                  <h2 className="text-2xl font-bold mb-4">Recently played</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {playlists.slice(0, 6).map((pl, i) => (
                      <div
                        key={i}
                        className="bg-gray-800 bg-opacity-40 rounded-lg p-4 flex items-center cursor-pointer"
                        onClick={() => openPlaylist(pl)}
                      >
                        <img
                          src={pl.image || ""}
                          alt={pl.name || ""}
                          className="w-16 h-16 rounded mr-4"
                        />
                        <span className="font-medium">{pl.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Jump Back In</h2>
                <div
                  className={cn(
                    "grid gap-4",
                    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  )}
                >
                  {jumpBackIn.map((track, i) => (
                    <div key={i} className="group relative flex flex-col">
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                        <img
                          src={track.album.cover_medium || ""}
                          alt={track.title || ""}
                          className={cn(
                            "w-full h-full object-cover",
                            "transform transition-transform duration-300",
                            "group-hover:scale-105"
                          )}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100",
                            "transition-opacity duration-200"
                          )}
                        />
                        <button
                          className={cn(
                            "absolute bottom-2 right-2",
                            "w-10 h-10 rounded-full",
                            "bg-green-500 text-white",
                            "flex items-center justify-center",
                            "transform translate-y-4 opacity-0",
                            "group-hover:translate-y-0 group-hover:opacity-100",
                            "transition-all duration-200",
                            "hover:scale-105 hover:bg-green-400"
                          )}
                          onClick={() => playTrack(track)}
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="font-medium text-sm line-clamp-1">
                          {track.title}
                        </p>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {track.artist.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="flex-1 overflow-y-auto custom-scrollbar pb-32">
                <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedTracks.length > 0 ? (
                    recommendedTracks.map((track, idx) => (
                      <TrackItem
                        key={track.id}
                        track={track}
                        index={idx}
                        onTrackClick={playTrack}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No recommendations available.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
        {showQueue && (
          <aside className="w-64 bg-gradient-to-b from-gray-900 to-black rounded-lg p-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4">Queue</h2>
            {queue.length === 0 && previousTracks.length === 0 ? (
              <div>
                <p className="text-gray-400 mb-4">Your queue is empty.</p>
                <button
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-600 transition-all duration-200"
                  onClick={() => {
                    /* Implement Add Suggestions if desired */
                  }}
                >
                  Add Suggestions
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {previousTracks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">
                      Previous Tracks
                    </h3>
                    {previousTracks.map((track, idx) => (
                      <TrackItem
                        key={`prev-${track.id}`}
                        track={track}
                        index={idx}
                        isPrevious
                        onTrackClick={onQueueItemClick}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))}
                  </div>
                )}
                {queue.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">
                      Up Next
                    </h3>
                    {queue.map((track, idx) => (
                      <TrackItem
                        key={`queue-${track.id}`}
                        track={track}
                        index={idx}
                        isPrevious={false}
                        onTrackClick={onQueueItemClick}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  //                          FINAL RENDER & MODALS
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Onboarding flow */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black custom-scrollbar overflow-y-auto">
          <Onboarding
            onComplete={handleOnboardingComplete}
            onArtistSelectionComplete={handleArtistSelectionComplete}
            API_BASE_URL={API_BASE_URL}
            setRecommendedTracks={setRecommendedTracks}
          />
        </div>
      )}

      {/* Render MobileLayout or DesktopLayout */}
      <MobileLayout />
      <DesktopLayout />

      {/* Desktop Player */}
      {mounted &&
        (currentTrack ? (
          <footer className="fixed bottom-0 left-0 right-0">
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
          </footer>
        ) : (
          <footer className="fixed bottom-0 left-0 right-0">
            <div className="bg-gray-800 text-white p-4 text-center">
              No track is currently playing.
            </div>
          </footer>
        ))}

      {/* Add to Playlist Modal */}
      {showAddToPlaylistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 w-full max-w-md border border-gray-800 shadow-2xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <FolderPlus className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
                  Add to Playlist
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Choose a playlist to add your song
                </p>
              </div>
            </div>
            <div className="relative mb-6">
              <select
                value={selectedPlaylistForAdd || ""}
                onChange={(e) => setSelectedPlaylistForAdd(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
                            focusborder-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none
                            transition-all duration-300 cursor-pointer hover:border-gray-600
                            appearance-none text-base"
              >
                <option value="" disabled className="text-gray-400">
                  Select a playlist
                </option>
                {playlists.map((pl) => (
                  <option
                    key={pl.name}
                    value={pl.name}
                    className="bg-gray-800 py-2"
                  >
                    {pl.name}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddToPlaylistModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-medium
                            hover:bg-gray-800/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToPlaylist}
                disabled={!selectedPlaylistForAdd}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-blue-500
                            hover:from-green-600 hover:to-blue-600 text-white font-medium
                            transition-all duration-300 hover:scale-[1.02] disabled:opacity-50
                            disabled:hover:scale-100 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center">
                  Add to Playlist
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-xl p-6 w-full max-w-sm border border-gray-800 shadow-2xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Delete Playlist
                </h3>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to delete "
                  <span className="text-white font-medium">
                    {selectedPlaylist?.name}
                  </span>
                  "?
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-700 text-gray-300 font-medium
                            hover:bg-gray-800/50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfirmedPlaylist}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600
                            hover:from-red-600 hover:to-red-700 text-white font-medium
                            transition-all duration-300 hover:scale-[1.02] group"
              >
                <span className="flex items-center justify-center">
                  Delete
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 sm:p-8 w-full max-w-[420px] border border-gray-800 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-5 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
              Create Your Playlist
            </h2>
            <div className="space-y-5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Give your playlist a name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400
                            border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500
                            transition-all duration-300 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Image
                </label>
                <div className="relative group">
                  <label
                    htmlFor="playlist-image"
                    className="relative flex flex-col items-center justify-center w-full h-[200px] sm:h-[240px]
                                rounded-lg cursor-pointer overflow-hidden transition-all duration-300
                                bg-gradient-to-br from-gray-800/50 to-gray-900/50
                                group-hover:from-gray-700/50 group-hover:to-gray-800/50
                                border-2 border-dashed border-gray-600 group-hover:border-green-500"
                  >
                    {newPlaylistImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={newPlaylistImage}
                          alt="Playlist Cover"
                          className="w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                                    transition-opacity duration-300 flex items-center justify-center"
                        >
                          <p className="text-sm text-white font-medium">
                            Change Image
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-300">
                          Drop your image here
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          or click to browse
                        </p>
                      </div>
                    )}
                    <input
                      id="playlist-image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const r = new FileReader();
                        r.onloadend = () => {
                          setNewPlaylistImage(r.result as string);
                        };
                        r.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreatePlaylist(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 font-medium
                            hover:bg-gray-800/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void createPlaylist()}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600
                            hover:from-blue-600 hover:to-blue-700 text-white font-medium
                            transition-all duration-300 hover:scale-[1.02] disabled:opacity-50
                            disabled:hover:scale-100 disabled:cursor-not-allowed"
                  disabled={!newPlaylistName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add songs after creation */}
      {showSearchInPlaylistCreation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div
            className="bg-gradient-to-b from-gray-900 to-black rounded-2xl w-full max-w-3xl 
                        border border-gray-800 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Add Songs to Your Playlist
                </h2>
                <p className="text-gray-400 text-sm">
                  Search and select songs to add to your playlist
                </p>
              </div>
              <button
                onClick={() => setShowSearchInPlaylistCreation(false)}
                className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="p-6 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 text-white 
                            placeholder-gray-400 border border-gray-700 
                            focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
                            transition-all duration-300"
                />
              </div>
            </div>
            <div className="p-6" style={{ height: "400px" }}>
              {searchResults.length > 0 ? (
                <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-2">
                    {searchResults.map((track, idx) => (
                      <div
                        key={track.id}
                        className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl transition-all duration-200"
                      >
                        <TrackItem
                          track={track}
                          index={idx}
                          inPlaylistCreation
                          openAddToPlaylistModal={openAddToPlaylistModal}
                          onTrackClick={() => toggleTrackSelection(track)}
                          onContextMenu={(e) => handleContextMenu(e, track)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Search className="w-8 h-8 text-gray-500 mb-4" />
                  <p className="text-gray-300 font-medium">No songs found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try searching for something else
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Music className="w-8 h-8 text-gray-500 mb-4" />
                  <p className="text-gray-300 font-medium">
                    Start searching for songs
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Find the perfect tracks for your playlist
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-6 border-t border-gray-800 bg-gray-900/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-gray-300">
                  {selectedTracksForNewPlaylist.length} songs selected
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSearchInPlaylistCreation(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSearchInPlaylistCreation(false)}
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-all duration-300 flex items-center space-x-2"
                  disabled={selectedTracksForNewPlaylist.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Selected</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
