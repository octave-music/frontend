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
import {
  X,
  ChevronRight,
  FolderPlus,
  ChevronDown,
  ArrowRight,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import debounce from "lodash/debounce";

// Hooks & Libraries
import { useAudio } from "@/lib/hooks/useAudio";
import { setupMediaSession } from "@/lib/hooks/useMediaSession";
import {
  storeQueue,
  clearQueue,
  storePlaylist,
  getAllPlaylists,
  deletePlaylistByName,
  getRecentlyPlayed,
  storeSetting,
  getSetting,
  getQueue,
  storeRecommendedTracks,
  storeTrackBlob,
  getRecommendedTracks,
} from "../lib/managers/idbWrapper";
import { handleFetchLyrics } from "@/lib/api/lyrics";
import audioElement from "@/lib/managers/audioManager";
import { getTopArtists } from "@/lib/api/lastfm";

// Components
import MobilePlayer from "./players/mobilePlayer";
import DesktopPlayer from "./players/DesktopPlayer";
import Onboarding from "./onboarding/Onboarding";
import MobileLayout from "./layout/MobileLayout";
import DesktopLayout from "./layout/DesktopLayout";

// Utilities & Helpers
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { Portal } from "@radix-ui/react-portal";
import { SpotifyToDeezer } from "./onboarding/SpotifyToDeezer";

// Types
import {
  Track,
  Playlist,
  Lyric,
  ContextMenuOption,
  Position,
  Artist,
  BeforeInstallPromptEvent,
} from "@/lib/types/types";

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

const API_BASE_URL = "https://api.octave.gold";

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
export function SpotifyClone() {
  // ----------------------------------------------------------
  //                  References & Audio Setup
  // ----------------------------------------------------------
  const isMounted = useRef(false);

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
    audioQuality, 
    setAudioQuality, 
    isDataSaver, 
    changeAudioQuality, 
  } = useAudio(); 

  // ----------------------------------------------------------
  //                  Core App State
  // ----------------------------------------------------------
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
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [previousTracks, setPreviousTracks] = useState<Track[]>([]);
  const [jumpBackIn, setJumpBackIn] = useState<Track[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);

  // Search & Results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchType, setSearchType] = useState("tracks");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Track[]>([]);

  // Playback Controls
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [seekPosition, setSeekPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [listenCount, setListenCount] = useState(0);

  // Context Menu & Modals
  const [showQueue, setShowQueue] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [contextMenuOptions, setContextMenuOptions] = useState<ContextMenuOption[]>([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSpotifyToDeezerModal, setShowSpotifyToDeezerModal] = useState(false);

  // Playlist Creation
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<string | null>(
    null
  );
  const [showSearchInPlaylistCreation, setShowSearchInPlaylistCreation] =
    useState(false);
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] = useState<
    Track[]
  >([]);

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
  const [isSearching, setIsSearching] = useState(false);

  // ----------------------------------------------------------
  //                  Handlers & Utility Functions
  // ----------------------------------------------------------

  const confirmDeletePlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowDeleteConfirmation(true);
  }, []);

  const deleteConfirmedPlaylist = useCallback(() => {
    if (selectedPlaylist && selectedPlaylist.name === "Liked Songs") {
      toast.error("You cannot delete the Liked Songs playlist.");
      return;
    }
    // Proceed with deletion for other playlists:
    if (selectedPlaylist) {
      void deletePlaylistByName(selectedPlaylist.name).then((updatedPlaylists) => {
        setPlaylists(updatedPlaylists);
        setSelectedPlaylist(null);
        setShowDeleteConfirmation(false);
      });
    }
  }, [selectedPlaylist]);

  useEffect(() => {
    (async function initPlaylists() {
      const pls = await getAllPlaylists();
      if (pls) {
        // Check if "Liked Songs" exists
        if (!pls.some((pl) => pl.name === "Liked Songs")) {
          const likedPlaylist: Playlist = {
            name: "Liked Songs",
            image: "/images/liked-songs.webp",
            tracks: [],
            // Optionally, add a pinned flag
            pinned: true,
          };
          pls.push(likedPlaylist);
          await storePlaylist(likedPlaylist);
        }
        setPlaylists(pls);
      }
    })();
  }, []);

  useEffect(() => {
    function unlockAudioContext() {
      if (audioElement && audioElement.paused) {
        // Mute the audio so that the play call isn’t disruptive.
        audioElement.muted = true;
        audioElement
          .play()
          .then(() => {
            // Once playback starts, unmute.
            audioElement!.muted = false;
          })
          .catch((err) => {
            console.error("Audio unlock failed:", err);
          });
        // Remove the listeners once the audio context is unlocked.
        document.removeEventListener("touchstart", unlockAudioContext);
        document.removeEventListener("click", unlockAudioContext);
      }
    }

    // Attach listeners for both touch and click events.
    document.addEventListener("touchstart", unlockAudioContext);
    document.addEventListener("click", unlockAudioContext);

    // Cleanup the event listeners when the component unmounts.
    return () => {
      document.removeEventListener("touchstart", unlockAudioContext);
      document.removeEventListener("click", unlockAudioContext);
    };
  }, []);

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

  const fetchSearchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        setIsSearching(true);
        try {
          const resp = await fetch(
            `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(query)}`
          );
          const data = await resp.json();
          if (data && data.results) {
            setSearchResults(data.results as Track[]);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.log("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300),
    []
  );

  const fetchLyrics = useCallback(async (track: Track) => {
    try {
      const fetchedLyrics = await handleFetchLyrics(track);
      setLyrics(fetchedLyrics);
    } catch (err) {
      console.log("Lyrics error:", err);
      setLyrics([]);
    }
  }, []);

  useEffect(() => {
    if (showLyrics && currentTrack) {
      void fetchLyrics(currentTrack);
    }
  }, [showLyrics, currentTrack, fetchLyrics]);

  /**
   * “Play Track” => set it to front of queue, optionally auto-play
   */
  const playTrack = useCallback(
    (track: Track, autoPlay = true) => {
      // Insert the track at front of queue
      setQueue((prev) => {
        if (prev[0]?.id === track.id) return prev; // Already playing at front
        const filtered = prev.filter((t) => t.id !== track.id);
        return [track, ...filtered];
      });

      // Move the current track to previousTracks
      setPreviousTracks((prev) => (currentTrack ? [currentTrack, ...prev] : prev));
      setCurrentTrack(track);

      // Actually load & possibly play
      void playTrackFromSource(track, 0, autoPlay);
      if (autoPlay) setIsPlaying(true);
    },
    [currentTrack, playTrackFromSource, setIsPlaying]
  );

  /**
   * Toggle the current track’s play state. If no track is loaded, do nothing.
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
      setIsPlaying(false);
      audioElement.currentTime = 0;
    }
  }, [currentTrack, isPlaying, setIsPlaying]);

  const previousTrackFunc = useCallback(() => {
    if (!previousTracks.length || !audioElement) {
      toast.warning("Cannot go to the previous track: no track in history.");
      return;
    }
    const lastTrack = previousTracks[0];
    setPreviousTracks((prev) => prev.slice(1));
    setQueue((q) => [lastTrack, ...q.filter((tk) => tk.id !== lastTrack.id)]);
    setCurrentTrack(lastTrack);
    void playTrackFromSource(lastTrack, 0, true);
    setIsPlaying(true);
  }, [previousTracks, playTrackFromSource, setIsPlaying]);

  const skipTrack = useCallback(() => {
    if (!currentTrack || queue.length <= 1 || !audioElement) {
      toast.warning("Cannot skip track: no next track available.");
      return;
    }
    setPreviousTracks((prev) => (currentTrack ? [currentTrack, ...prev] : prev));
    setQueue((q) => {
      const [, ...rest] = q;
      if (rest.length === 0) {
        setCurrentTrack(null);
        setIsPlaying(false);
      } else {
        setCurrentTrack(rest[0]);
        void playTrackFromSource(rest[0], 0, true);
        setIsPlaying(true);
      }
      return rest;
    });
  }, [currentTrack, queue, setIsPlaying, playTrackFromSource]);

  /**
   * If queue ends, we can fetch new recommendations or do nothing.
   */
  const fetchNewRecommendations = useCallback(async () => {
    try {
      setPlaylists((prevPlaylists) => {
        const liked = prevPlaylists.find((p) => p.name === "Liked Songs");
        if (!liked) {
          const newPL: Playlist = {
            name: "Liked Songs",
            image: "/images/liked-songs.webp",
            tracks: [],
          };
          // Store the new playlist
          storePlaylist(newPL).catch((err) =>
            console.error("Error storing new playlist:", err)
          );
          return [...prevPlaylists, newPL];
        }
        return prevPlaylists;
      });

      // Retrieve the updated playlists
      const updatedPlaylists = await getAllPlaylists();
      const liked = updatedPlaylists.find((p) => p.name === "Liked Songs");

      if (!liked) {
        throw new Error("Failed to create 'Liked Songs' playlist.");
      }

      const topArtists: string[] = await getTopArtists(6);
      const trackPromises = topArtists.map(async (artistName: string) => {
        const response = await fetch(
          `${API_BASE_URL}/api/search/artists?query=${encodeURIComponent(artistName)}`
        );
        const data = await response.json();
        return data.results?.[0] || null;
      });
      const artists = (await Promise.all(trackPromises)).filter(Boolean);
      const tracksByArtistPromises = artists.map(async (artist) => {
        const response = await fetch(
          `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(
            artist.name
          )}`
        );
        const data = await response.json();
        return data.results?.slice(0, 6) || [];
      });
      const tracksByArtist = await Promise.all(tracksByArtistPromises);
      const allTracks = tracksByArtist.flat();
      const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);

      setQueue((prevQueue) => [...prevQueue, ...shuffledTracks]);
      setRecommendedTracks(shuffledTracks);
    } catch (error) {
      console.error("Error fetching new recommendations:", error);
    }
  }, [setPlaylists, setQueue, setRecommendedTracks]);

  const handleTrackEnd = useCallback(async (): Promise<void> => {
  // Ensure that there is a current track and a valid audio element.
  if (!currentTrack || !audioElement) return;

  switch (repeatMode) {
    case "one":
      // Repeat the current track.
      try {
        await playTrackFromSource(currentTrack, 0, true);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing track in repeat 'one' mode:", error);
      }
      break;

    case "all": {
      // Find the index of the current track in the queue.
      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex === -1) {
        console.error("Current track not found in the queue.");
        break;
      }

      const isLastTrack = currentIndex === queue.length - 1;
      if (isLastTrack && queue.length > 0) {
        // If the current track is the last one, loop back to the first track.
        const firstTrack = queue[0];
        setCurrentTrack(firstTrack);
        try {
          await playTrackFromSource(firstTrack, 0, true);
          setIsPlaying(true);
        } catch (error) {
          console.error("Error playing first track in repeat 'all' mode:", error);
        }
      } else {
        // Otherwise, skip to the next track.
        skipTrack();
      }
      break;
    }

    case "off":
    default:
      // If repeat is off and there is more than one track in the queue, skip.
      if (queue.length > 1) {
        skipTrack();
      } else {
        // If there's only one track, pause playback.
        setIsPlaying(false);
        audioElement.pause();
      }
      break;
  }
}, [currentTrack, repeatMode, playTrackFromSource, setIsPlaying, queue, skipTrack]);


  const handleUnpinPlaylist = (playlistToUnpin: Playlist) => {
    const updatedPlaylists = playlists.map((pl) =>
      pl.name === playlistToUnpin.name ? { ...pl, pinned: false } : pl
    );
    setPlaylists(updatedPlaylists);
    updatedPlaylists.forEach((pl) => storePlaylist(pl));
  };

  async function onCycleAudioQuality() {
    if (isDataSaver) {
      toast.error("Data Saver is ON. Disable it to switch audio quality.");
      return;
    }
    try {
      const qualities: Array<"MAX" | "HIGH" | "NORMAL" | "DATA_SAVER"> = [
        "MAX",
        "HIGH",
        "NORMAL",
        "DATA_SAVER",
      ];
      const currentIndex = qualities.indexOf(audioQuality);
      const nextQ = qualities[(currentIndex + 1) % qualities.length];

      await changeAudioQuality(nextQ);
      toast.success(`Switched audio quality to ${nextQ}`);
    } catch (err: any) {
      console.error("Could not change audio quality:", err);
      toast.error(err?.message || "Could not change audio quality");
    }
  }

  const isTrackLiked = useCallback(
    (track: Track): boolean => {
      const liked = playlists.find((p) => p.name === "Liked Songs");
      if (!liked) return false;
      return liked.tracks.some((t) => t.id === track.id);
    },
    [playlists]
  );

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
          track.album?.cover_medium || "/images/defaultPlaylistImage.png",
        cover_small:
          track.album?.cover_small || "/images/defaultPlaylistImage.png",
        cover_big:
          track.album?.cover_big || "/images/defaultPlaylistImage.png",
        cover_xl:
          track.album?.cover_xl || "/images/defaultPlaylistImage.png",
      },
    };
  };

  const toggleLike = useCallback(
    (rawTrack: Track) => {
      if (!rawTrack) return;
      const track = sanitizeTrack(rawTrack);

      const likedPlaylist = playlists.find((p) => p.name === "Liked Songs");
      if (!likedPlaylist) return;

      const isAlreadyLiked = likedPlaylist.tracks.some((t) => t.id === track.id);
      const updatedLikedTracks = isAlreadyLiked
        ? likedPlaylist.tracks.filter((t) => t.id !== track.id)
        : [...likedPlaylist.tracks, track];

      const updatedLikedPlaylist = { ...likedPlaylist, tracks: updatedLikedTracks };
      const updatedPlaylists = playlists.map((playlist) =>
        playlist.name === "Liked Songs" ? updatedLikedPlaylist : playlist
      );

      setPlaylists(updatedPlaylists);
      void storePlaylist(updatedLikedPlaylist).catch((err) =>
        console.error("Error storing updated playlist:", err)
      );
    },
    [playlists]
  );

  const toggleLikeDesktop = useCallback(() => {
    if (currentTrack) toggleLike(currentTrack);
  }, [currentTrack, toggleLike]);

  const toggleLikeMobile = useCallback(() => {
    if (currentTrack) toggleLike(currentTrack);
  }, [currentTrack, toggleLike]);

  const addToQueue = useCallback((tr: Track | Track[]) => {
    setQueue((prev) => {
      const arr = Array.isArray(tr) ? tr : [tr];
      const filtered = arr.filter((item) => !prev.some((pk) => pk.id === item.id));
      return [...prev, ...filtered];
    });
    toast.success("Added track to queue!");
  }, []);

  const removeFromQueue = useCallback((idx: number) => {
    setQueue((q) => q.filter((_, i) => i !== idx));
  }, []);

  const onQueueItemClick = useCallback(
    (track: Track, idx: number) => {
      if (idx < 0) {
        // Handle clicks from previousTracks (if needed)
        setPreviousTracks((prev) => prev.filter((_, i) => i !== -idx - 1));
        setQueue((q) => [track, ...q]);
      } else {
        // Instead of removing the track entirely, reposition it to the top.
        setPreviousTracks((prev) =>
          currentTrack ? [currentTrack, ...prev] : prev
        );
        setQueue((q) => {
          // Create a shallow copy of the current queue.
          const newQueue = [...q];
          // Remove the clicked track from its current position.
          newQueue.splice(idx, 1);
          // Insert the track at the beginning of the queue.
          newQueue.unshift(track);
          return newQueue;
        });
      }
      setCurrentTrack(track);
    },
    [currentTrack]
  );

  const openAddToPlaylistModal = useCallback((tr: Track) => {
    setContextMenuTrack(tr);
    setShowAddToPlaylistModal(true);
  }, []);

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
          { label: "Add to Playlist", action: () => openAddToPlaylistModal(item) },
          {
            label: isTrackLiked(item) ? "Remove from Liked Songs" : "Add to Liked Songs",
            action: () => toggleLike(item),
          },
        ];
      }

      // If item is a playlist
      if ("tracks" in item) {
        options = [
          ...options,
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
              confirmDeletePlaylist(item);
            },
          },
        ];
      }

      setContextMenuOptions(options);
      setContextMenuPosition({ x: evt.clientX, y: evt.clientY });
      setShowContextMenu(true);
    },
    [isTrackLiked, addToQueue, openAddToPlaylistModal, toggleLike, playlists, confirmDeletePlaylist]
  );

  const addToPlaylist = useCallback(
    async (t: Track, name: string) => {
      const updatedPlaylists = playlists.map((pl) => {
        if (pl.name === name) {
          return { ...pl, tracks: [...pl.tracks, t] };
        }
        return pl;
      });
      setPlaylists(updatedPlaylists);
      await Promise.all(updatedPlaylists.map((p) => storePlaylist(p)));
    },
    [playlists]
  );

  const handleAddToPlaylist = useCallback(() => {
    if (!selectedPlaylistForAdd || !contextMenuTrack) return;
    void addToPlaylist(contextMenuTrack, selectedPlaylistForAdd);
    setShowAddToPlaylistModal(false);
    setSelectedPlaylistForAdd(null);
  }, [selectedPlaylistForAdd, contextMenuTrack, addToPlaylist]);

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

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

    if (!newPlaylistImage && pl.tracks.length > 0) {
      const covers = pl.tracks.slice(0, 4).map((t) => t.album.cover_medium);
      pl.image = await createCompositeImage(covers);
    }

    await storePlaylist(pl);
  }, [
    newPlaylistName,
    newPlaylistImage,
    playlists,
    selectedTracksForNewPlaylist,
    createCompositeImage,
  ]);

  const openPlaylist = useCallback((pl: Playlist) => {
    setCurrentPlaylist(pl);
    setView("playlist");
  }, []);

  const downloadTrack = useCallback(
    async (track: Track) => {
      try {
        const blob = await loadAudioBuffer(track.id);
        if (!blob) {
          toast.error("Failed to download track.");
          return;
        }

        // Store in IndexedDB
        await storeTrackBlob(track.id, blob);

        // Allow user to save
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

  const toggleLyricsView = useCallback(() => {
    setShowLyrics((prev) => !prev);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    void storeSetting("onboardingDone", "true");
    setShowOnboarding(false);
    setShowArtistSelection(false);
    setView("home");
  }, []);

  const handleArtistSelectionComplete = useCallback(
    async (artists: Artist[]) => {
      try {
        await storeSetting("favoriteArtists", JSON.stringify(artists));
        setShowArtistSelection(false);

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
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        setRecommendedTracks(shuffled);
        await storeRecommendedTracks(shuffled);

        setQueue(shuffled);
        await storeQueue(shuffled);

        setSearchResults(shuffled);

        // If you want auto-play on first load:
        if (shuffled.length) {
          setCurrentTrack(shuffled[0]);
          setIsPlaying(true);
          void playTrackFromSource(shuffled[0], 0, true);
        }

        const firstFour = shuffled.slice(0, 4);
        setJumpBackIn(firstFour);

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
    [playlists, handleOnboardingComplete, setIsPlaying, playTrackFromSource]
  );

  function handleSearch(newQ: string): void {
    if (newQ.trim().length > 3) {
      if (!recentSearches.includes(newQ)) {
        setRecentSearches((prev) => [...prev, newQ]);
      }
    }
    fetchSearchResults(newQ);
  }

  // ----------------------------------------------------------
  //                  Effects & Lifecycle
  // ----------------------------------------------------------

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
      const t = audioElement.currentTime;
      const idx = lyrics.findIndex((ly, i) => {
        const isLast = i === lyrics.length - 1;
        const nextTime = isLast ? Infinity : lyrics[i + 1].time;
        return t >= ly.time && t < nextTime;
      });
      if (idx !== -1 && idx !== currentLyricIndex) {
        setCurrentLyricIndex(idx);
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
        if (!audioElement) return;
        setCurrentTime(audioElement.currentTime);
        setSeekPosition(audioElement.currentTime);
      });
      audioElement.addEventListener("ended", handleTrackEnd);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", () => {});
        audioElement.removeEventListener("ended", handleTrackEnd);
      }
    };
  }, [handleTrackEnd, setAudioQuality, volume]);

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

  // MediaSession integration
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

  // Main init: load from IDB
  useEffect(() => {
    void (async function init() {
      try {
        // 1. Attempt to load recommended
        const savedRecommended = await getRecommendedTracks();
        if (savedRecommended && savedRecommended.length > 0) {
          setRecommendedTracks(savedRecommended);
        }

        // 2. Attempt to load queue
        const savedQueue = await getQueue();

        // 3. Parallel IDB settings
        const [
          vol,
          sOn,
          qual,
          pls,
          rec,
          onboard,
          savedTrack,
        ] = await Promise.all([
          getSetting("volume"),
          getSetting("shuffleOn"),
          getSetting("audioQuality"),
          getAllPlaylists(),
          getRecentlyPlayed(),
          getSetting("onboardingDone"),
          getSetting("currentTrack"),
        ]);

        // 4. Apply volume, shuffle, audioQuality
        if (vol) setVolume(parseFloat(vol));
        if (sOn) setShuffleOn(JSON.parse(sOn));

        if (qual) {
          // e.g. "MAX", "HIGH", "NORMAL", or "DATA_SAVER"
          await changeAudioQuality(qual as "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER");
        }

        // 5. Load playlists, recently played, handle onboarding
        if (pls) setPlaylists(pls);
        if (rec) setJumpBackIn(rec);
        if (!onboard) setShowOnboarding(true);

        // 6. Decide on queue fallback
        if (savedQueue && savedQueue.length > 0) {
          setQueue(savedQueue);
        } else if (savedRecommended && savedRecommended.length > 0) {
          setQueue(savedRecommended);
        } else {
          await fetchNewRecommendations();
        }

        // 7. If we have a saved track, load it (but do NOT auto-play if you prefer)
        if (savedTrack) {
          const track: Track = JSON.parse(savedTrack);
          setCurrentTrack(track);
          // If you want it to not start playing, set autoPlay = false
          await playTrackFromSource(track, 0, true);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      }
    })();
    // [] ensures it runs only once after component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      void handlePlaylistSearch(playlistSearchQuery);
    } else {
      setPlaylistSearchResults([]);
    }
  }, [playlistSearchQuery, handlePlaylistSearch]);

  useEffect(() => {
    if (previousTracks.length > 0) {
      void storeSetting("previousTracks", JSON.stringify(previousTracks)).catch((err) =>
        console.error("Failed to store previous tracks:", err)
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
    void loadRecommendedTracks();
  }, []);

  // ----------------------------------------------------------
  //                      Render
  // ----------------------------------------------------------
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

      {/* Onboarding */}
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
            storeSetting={storeSetting}
            changeAudioQuality={changeAudioQuality}
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
            audioQuality={audioQuality}
            setAudioQuality={setAudioQuality}
            isPlayerOpen={isPlayerOpen}
            setView={(v: string) => {
              setView(
                v as SetStateAction<
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
            volume={volume}
            onVolumeChange={onVolumeChange}
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
                currentTrackIndex={queue.findIndex((t) => t.id === currentTrack?.id)}
                isPlaying={isPlaying}
                audioQuality={audioQuality}
                isDataSaver={isDataSaver}
                changeAudioQuality={changeAudioQuality}
                removeFromQueue={removeFromQueue}
                downloadTrack={downloadTrack}
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
            handleUnpinPlaylist={handleUnpinPlaylist}
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
            <footer className="hidden md:block fixed bottom-0 left-0 right-0">
              {currentTrack ? (
                <DesktopPlayer
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  audioQuality={audioQuality}
                  isDataSaver={isDataSaver}
                  changeAudioQuality={changeAudioQuality}
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
                  currentTrackIndex={queue.findIndex((x) => x.id === currentTrack.id)}
                  removeFromQueue={removeFromQueue}
                  onQueueItemClick={onQueueItemClick}
                  volume={volume}
                  onVolumeChange={onVolumeChange}
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

          {/* Context Menu */}
          {showContextMenu && contextMenuOptions && (
            <Portal>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40 backdrop-blur-sm bg-black/30"
                onClick={() => setShowContextMenu(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute z-50 min-w-[220px] max-w-[320px] overflow-hidden rounded-xl bg-gray-800/95 backdrop-blur-md shadow-2xl border border-gray-700/50 ring-1 ring-white/10"
                  style={{
                    top: `${Math.min(
                      contextMenuPosition.y,
                      window.innerHeight - (contextMenuOptions.length * 44 + 16)
                    )}px`,
                    left: `${Math.min(
                      contextMenuPosition.x,
                      window.innerWidth - 240
                    )}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-2">
                    {contextMenuOptions.map((option, index) => (
                      <motion.button
                        key={index}
                        className="group relative flex w-full items-center px-4 py-2.5 text-left"
                        onClick={() => {
                          option.action();
                          setShowContextMenu(false);
                        }}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                        whileTap={{ backgroundColor: "rgba(255,255,255,0.09)" }}
                      >
                        {option.icon && (
                          <span className="mr-3 text-gray-400 group-hover:text-white">
                            {option.icon}
                          </span>
                        )}
                        <span className="flex-1 text-sm font-medium text-gray-200 group-hover:text-white">
                          {option.label}
                        </span>
                        {option.shortcut && (
                          <span className="ml-auto text-xs text-gray-500 group-hover:text-gray-400">
                            {option.shortcut}
                          </span>
                        )}
                        {option.danger && (
                          <span className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </Portal>
          )}

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
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#1a237e]/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                  {/* Header */}
                  <div className="relative flex items-center justify-between p-6 border-b border-gray-700/50">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                      Import Spotify Playlist
                    </h2>
                    <button
                      className="group p-2 rounded-full hover:bg-gray-700/50 transition-all duration-200"
                      onClick={() => setShowSpotifyToDeezerModal(false)}
                    >
                      <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="relative max-h-[80vh] overflow-y-auto custom-scrollbar p-6">
                    <SpotifyToDeezer
                      onClose={() => setShowSpotifyToDeezerModal(false)}
                      onPlaylistImported={async () => {
                        const updatedPlaylists = await getAllPlaylists();
                        setPlaylists(updatedPlaylists);
                        toast.success("Playlist imported successfully!");
                        setShowSpotifyToDeezerModal(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showAddToPlaylistModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
              <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 w-full max-w-md border border-gray-800 shadow-2xl">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#1a237e]/10 flex items-center justify-center flex-shrink-0">
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
                    value={selectedPlaylistForAdd || "Unkown Value"}
                    onChange={(e) => setSelectedPlaylistForAdd(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 text-white border border-gray-700
                            focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none
                            transition-all duration-300 cursor-pointer hover:border-gray-600
                            appearance-none text-base"
                  >
                    <option value="" disabled className="text-gray-400">
                      Select a playlist
                    </option>
                    {playlists.map((pl) => (
                      <option key={pl.name} value={pl.name} className="bg-gray-800 py-2">
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

          {showDeleteConfirmation && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4
                              animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-gradient-to-br from-gray-900/95 via-gray-900/98 to-black/95 rounded-2xl
                              backdrop-blur-xl backdrop-saturate-150 p-8 w-full max-w-sm
                              border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]
                              animate-[slideUp_0.3s_ease-out]
                              hover:border-white/20 transition-all duration-500">
                <div className="flex items-start space-x-5 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0
                                  shadow-lg shadow-red-500/5 border border-red-500/20
                                  animate-[pulse_2s_ease-in-out_infinite]">
                    <Trash2 className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      Delete Playlist
                    </h3>
                    <p className="text-gray-300/90 text-[15px] leading-relaxed">
                      Are you sure you want to delete "
                      <span className="text-white font-medium">
                        {selectedPlaylist?.name}
                      </span>
                      "?
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowDeleteConfirmation(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-700/75 text-gray-200 font-semibold
                                hover:bg-gray-800/30 hover:border-gray-600 active:bg-gray-800/50
                                transition-all duration-300 ease-out"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteConfirmedPlaylist}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600
                                hover:from-red-600 hover:to-red-700 text-white font-semibold
                                shadow-lg shadow-red-500/20 hover:shadow-red-500/30
                                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                                group"
                  >
                    <span className="flex items-center justify-center">
                      Delete
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 
                                            group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

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
                            <Image
                              src={newPlaylistImage}
                              fill
                              alt="Playlist Cover"
                              className="w-full h-full object-cover"
                              priority
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                                        transition-opacity duration-300 flex items-center justify-center"
                            >
                              <p className="text-sm text-white font-medium">Change Image</p>
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
                            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
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
        </div>
      )}
    </>
  );
}
