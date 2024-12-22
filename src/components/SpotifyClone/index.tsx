/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  MouseEvent,
  useMemo
} from 'react';
import { motion } from 'framer-motion';
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
  X
} from 'lucide-react';
import debounce from 'lodash/debounce';

import MobilePlayer from '../mobilePlayer';
import DesktopPlayer from './DesktopPlayer/DesktopPlayer';
import TrackItem from './TrackItem';
import CustomContextMenu from './CustomContextMenu';
import OnboardingStep1 from './OnboardingStep1';
import ArtistSelection from './ArtistSelection';

import safeClone from './safeClone'; // Helper for JSON safe clone

/** ------------------------------------------------------------------
 *  Types / Interfaces
 * ------------------------------------------------------------------ */
const API_BASE_URL = 'https://mbck.cloudgen.xyz';

interface Track {
  id: string;
  title: string;
  artist: {
    name: string;
  };
  album: {
    title: string;
    cover_medium: string;
    cover_small: string;
    cover_big: string;
    cover_xl: string;
  };
}

interface Playlist {
  name: string;
  image: string;
  tracks: Track[];
  pinned?: boolean;
  downloaded?: boolean;
}

interface Lyric {
  time: number; // Start time in seconds
  endTime?: number; // End time in seconds
  text: string;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ContextMenuOption {
  label: string;
  action: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Artist {
  id: number;
  name: string;
  picture_medium: string;
}

/** ------------------------------------------------------------------
 *                 getDynamicGreeting
 * ------------------------------------------------------------------ */
function getDynamicGreeting(): string {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const isWinter = currentMonth === 11 || currentMonth <= 1;
  const isSpring = currentMonth >= 2 && currentMonth <= 4;
  const isSummer = currentMonth >= 5 && currentMonth <= 7;
  const isAutumn = currentMonth >= 8 && currentMonth <= 10;

  const isChristmas = currentMonth === 11 && currentDay === 25;
  const isNewYearEve = currentMonth === 11 && currentDay === 31;
  const isHalloween = currentMonth === 9 && currentDay === 31;
  const isValentinesDay = currentMonth === 1 && currentDay === 14;

  if (isChristmas) {
    return "Merry Christmas! Enjoy the holiday season with great music.";
  } else if (isNewYearEve) {
    return "Happy New Year's Eve! Start your celebration with your favorite tunes.";
  } else if (isHalloween) {
    return "Happy Halloween! Create a playlist to set the mood.";
  } else if (isValentinesDay) {
    return "Happy Valentine's Day! Let the music set the tone for today.";
  } else if (currentHour >= 5 && currentHour < 12) {
    if (isWinter) return "Good Morning! A perfect day to cozy up with some music.";
    if (isSpring) return "Good Morning! Start your day fresh with some tunes.";
    if (isSummer) return "Good Morning! Brighten your morning with uplifting tracks.";
    if (isAutumn) return "Good Morning! A crisp day deserves a warm playlist.";
    return "Good Morning! Let's get started with some music.";
  } else if (currentHour >= 12 && currentHour < 17) {
    if (isWinter) return "Good Afternoon! Warm up your day with your favorite music.";
    if (isSpring) return "Good Afternoon! Enjoy the season with refreshing sounds.";
    if (isSummer) return "Good Afternoon! Take a break with some relaxing tracks.";
    if (isAutumn) return "Good Afternoon! Tune into the sounds of the season.";
    return "Good Afternoon! The perfect time for some music.";
  } else if (currentHour >= 17 && currentHour < 21) {
    if (isWinter) return "Good Evening! Wind down with a relaxing playlist.";
    if (isSpring) return "Good Evening! A calm night calls for soothing melodies.";
    if (isSummer) return "Good Evening! Unwind with your favorite songs.";
    if (isAutumn) return "Good Evening! End your day with some mellow tunes.";
    return "Good Evening! Time to relax with some music.";
  } else {
    if (isWinter) return "Good Night! Stay warm and let the music play.";
    if (isSpring) return "Good Night! Drift off with a calming playlist.";
    if (isSummer) return "Good Night! A quiet night for some soft music.";
    if (isAutumn) return "Good Night! Reflect on the day with your favorite tracks.";
    return "Good Night! Time to relax with some music.";
  }
}

/** ------------------------------------------------------------------
 *                 Main SpotifyClone Component
 * ------------------------------------------------------------------ */
export default function SpotifyClone() {
  // State hooks
  const [view, setView] = useState<'home' | 'search' | 'playlist' | 'settings' | 'library'>('home');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [jumpBackIn, setJumpBackIn] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [previousTracks, setPreviousTracks] = useState<Track[]>([]);
  const [shuffleOn, setShuffleOn] = useState<boolean>(false);
  const [savedPosition, setSavedPosition] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [seekPosition, setSeekPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showQueue] = useState<boolean>(false); // we read it, but not toggling
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<Position>({ x: 0, y: 0 });
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<string | null>(null);
  const [showSearchInPlaylistCreation, setShowSearchInPlaylistCreation] = useState<boolean>(false);
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] = useState<Track[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [contextMenuOptions, setContextMenuOptions] = useState<ContextMenuOption[]>([]);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showLyrics, setShowLyrics] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const [listenCount, setListenCount] = useState<number>(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [greeting, setGreeting] = useState<string>(getDynamicGreeting());

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState('tracks');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [audioQuality, setAudioQuality] = useState<'MAX' | 'HIGH' | 'NORMAL' | 'DATA_SAVER'>('HIGH');

  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showArtistSelection, setShowArtistSelection] = useState<boolean>(false);

  const [mounted, setMounted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedAudios = useRef<HTMLAudioElement[]>([]);

  /** ------------------------------------------------------------------
   *  Lifecycle & Effects
   * ------------------------------------------------------------------ */
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      preloadedAudios.current = [new Audio(), new Audio(), new Audio()];
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getDynamicGreeting());
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  /** ------------------------------------------------------------------
   *  safeLocalStorage helpers
   * ------------------------------------------------------------------ */
  const safeLocalStorageGetItem = useCallback((key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }, []); 
  
  const safeLocalStorageSetItem = useCallback((key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }, []); 

  /** ------------------------------------------------------------------
   *  Lyrics: sync with audio
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (lyrics.length > 0 && currentTrack && audioRef.current) {
      const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const currentTime = audioRef.current.currentTime || 0;

        // Find the active lyric line based on current playback time
        const activeIndex = lyrics.findIndex((lyric, index) => {
          const isLastLine = index === lyrics.length - 1;
          const nextLyricTime = isLastLine ? Infinity : lyrics[index + 1].time;
          return currentTime >= lyric.time && currentTime < nextLyricTime;
        });

        // Update only if we found a valid line and it's different from the current one
        if (activeIndex !== -1 && activeIndex !== currentLyricIndex) {
          setCurrentLyricIndex(activeIndex);
        }
      };

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [lyrics, currentTrack, currentLyricIndex]);

  /** ------------------------------------------------------------------
   *  IndexedDB open/store
   * ------------------------------------------------------------------ */
  const openDatabase = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        const fakeDB = {} as IDBDatabase;
        resolve(fakeDB);
        return;
      }

      const request = indexedDB.open('OctaveDB', 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }, []);

  const getOfflineTrack = useCallback(
    async (trackId: string): Promise<string | null> => {
      const db = await openDatabase();
      const transaction = db.transaction('tracks', 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.get(trackId);
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result as { blob: Blob } | undefined;
          if (result && result.blob) {
            const objectURL = URL.createObjectURL(result.blob);
            resolve(objectURL);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    },
    [openDatabase]
  );

  /** ------------------------------------------------------------------
   *  Debounced searching
   * ------------------------------------------------------------------ */
  const fetchSearchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSearchResults(data.results);
        } catch (error) {
          console.error('Error fetching search results:', error);
        }
      }, 300),
    []
  );

  /** ------------------------------------------------------------------
   *  parseLyrics / fetchLyrics
   * ------------------------------------------------------------------ */
  const parseLyrics = (lyricsString: string): Lyric[] => {
    return lyricsString.split('\n').map((line) => {
      const [time, text] = line.split(']');
      const [minutes, seconds] = time.replace('[', '').split(':');
      const timeInSeconds = parseFloat(minutes) * 60 + parseFloat(seconds);
      return {
        time: parseFloat(timeInSeconds.toFixed(1)),
        text: text.trim()
      };
    });
  };

  const fetchLyrics = useCallback(async (track: Track) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: track.title, artist: track.artist.name })
      });
      const data = await response.json();
      if (data.success && data.synced) {
        const parsedLyrics = parseLyrics(data.lyrics);
        setLyrics(parsedLyrics);
      } else {
        setLyrics([]);
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setLyrics([]);
    }
  }, []);

  /** ------------------------------------------------------------------
   *  isTrackLiked
   * ------------------------------------------------------------------ */
  const isTrackLiked = useCallback(
    (track: Track) => {
      const likedSongsPlaylist = playlists.find((p) => p.name === 'Liked Songs');
      return likedSongsPlaylist ? likedSongsPlaylist.tracks.some((t) => t.id === track.id) : false;
    },
    [playlists]
  );

  /** ------------------------------------------------------------------
   *  Preload next tracks
   * ------------------------------------------------------------------ */
  const preloadQueueTracks = useCallback(
    async (queueTracks: Track[]) => {
      const nextTracks = queueTracks.slice(1, 4);
      for (const [index, track] of nextTracks.entries()) {
        const offlineTrack = await getOfflineTrack(track.id);
        const audio = new Audio(offlineTrack || `${API_BASE_URL}/api/track/${track.id}.mp3`);
        audio.preload = 'auto';
        preloadedAudios.current[index] = audio;
      }
    },
    [getOfflineTrack]
  );

  /** ------------------------------------------------------------------
   *  Playback / Audio Source
   * ------------------------------------------------------------------ */
  const playTrackFromSource = useCallback(
    async (track: Track) => {
      const offlineTrack = await getOfflineTrack(track.id);
      if (audioRef.current) {
        audioRef.current.src = offlineTrack || `${API_BASE_URL}/api/track/${track.id}.mp3`;
        if (track.id === currentTrack?.id && savedPosition) {
          audioRef.current.currentTime = savedPosition || 0;
        }
        audioRef.current.oncanplay = () => {
          void audioRef.current?.play();
        };
      }
    },
    [currentTrack?.id, savedPosition, getOfflineTrack]
  );

  /** ------------------------------------------------------------------
   *  Main "Play Track" Flow
   * ------------------------------------------------------------------ */
  const playTrack = useCallback((track: Track) => {
    setQueue((prevQueue) => {
      const filteredQueue = prevQueue.filter((t) => t.id !== track.id);
      return [track, ...filteredQueue];
    });
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (savedPosition && audioRef.current.currentTime === 0) {
        audioRef.current.currentTime = savedPosition;
      }
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, savedPosition]);

  const previousTrackFunc = useCallback(() => {
    setPreviousTracks((prev) => {
      if (prev.length === 0) return prev;
      const [lastTrack, ...rest] = prev;
      setCurrentTrack(lastTrack);
      setQueue((prevQueue) => {
        const filtered = prevQueue.filter((t) => t.id !== lastTrack.id);
        return [lastTrack, ...filtered];
      });
      return rest;
    });
  }, []);

  const skipTrack = useCallback(() => {
    setPreviousTracks((prev) => {
      if (currentTrack) return [currentTrack, ...prev];
      return prev;
    });
    setQueue((prevQueue) => {
      if (prevQueue.length <= 1) return prevQueue;
      const [, ...newQueue] = prevQueue;
      setCurrentTrack(newQueue[0]);
      return newQueue;
    });
  }, [currentTrack]);

  /** ------------------------------------------------------------------
   *  Update "Recently Played"
   * ------------------------------------------------------------------ */
  const updateRecentlyPlayed = useCallback(
    (track: Track) => {
      if (typeof window === 'undefined') return;
      const recentlyPlayed = JSON.parse(safeLocalStorageGetItem('recentlyPlayed') || '[]') as Track[];
      const updatedRecentlyPlayed = [track, ...recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 4);
      safeLocalStorageSetItem('recentlyPlayed', JSON.stringify(updatedRecentlyPlayed));
      setJumpBackIn(updatedRecentlyPlayed);
    },
    [safeLocalStorageGetItem, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  Queue Add / Remove
   * ------------------------------------------------------------------ */
  const addToQueue = useCallback((tracks: Track | Track[]) => {
    setQueue((prevQueue) => {
      const newTracks = Array.isArray(tracks) ? tracks : [tracks];
      const filteredNewTracks = newTracks.filter(
        (newTrack) => !prevQueue.some((existing) => existing.id === newTrack.id)
      );
      return [...prevQueue, ...filteredNewTracks];
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prevQueue) => prevQueue.filter((_, i) => i !== index));
  }, []);

  const onQueueItemClick = useCallback((track: Track, index: number) => {
    if (index < 0) {
      const actualIndex = Math.abs(index + 1);
      setPreviousTracks((prev) => prev.slice(0, actualIndex));
    }
    setCurrentTrack(track);
  }, []);

  /** ------------------------------------------------------------------
   *  Handle Audio End (repeat, skip, etc.)
   * ------------------------------------------------------------------ */
  const handleTrackEnd = useCallback(() => {
    if (typeof window !== 'undefined' && currentTrack) {
      const counts = JSON.parse(safeLocalStorageGetItem('listenCounts') || '{}');
      counts[currentTrack.id] = (counts[currentTrack.id] || 0) + 1;
      safeLocalStorageSetItem('listenCounts', JSON.stringify(counts));
      setListenCount(counts[currentTrack.id]);
    }

    setQueue((prevQueue) => {
      if (prevQueue.length > 1) {
        const [, ...newQueue] = prevQueue;
        setCurrentTrack(newQueue[0]);
        return newQueue;
      }
      setIsPlaying(false);
      return prevQueue;
    });

    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
      return;
    }

    if (repeatMode === 'all') {
      const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
      if (currentIndex === queue.length - 1) {
        setCurrentTrack(queue[0]);
      } else {
        skipTrack();
      }
      return;
    }

    if (queue.length > 1) {
      skipTrack();
    } else {
      setIsPlaying(false);
    }
  }, [currentTrack, queue, repeatMode, skipTrack, safeLocalStorageGetItem, safeLocalStorageSetItem]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === 'one';
    }
  }, [repeatMode]);

  /** ------------------------------------------------------------------
   *  Volume & Audio Quality
   * ------------------------------------------------------------------ */
  const onCycleAudioQuality = useCallback(() => {
    const order: ('MAX' | 'HIGH' | 'NORMAL' | 'DATA_SAVER')[] = ['MAX', 'HIGH', 'NORMAL', 'DATA_SAVER'];
    const currentIndex = order.indexOf(audioQuality);
    const nextIndex = (currentIndex + 1) % order.length;
    const newQuality = order[nextIndex];
    setAudioQuality(newQuality);
    safeLocalStorageSetItem('audioQuality', newQuality);
  }, [audioQuality, safeLocalStorageSetItem]);

  const onVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    safeLocalStorageSetItem('volume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, [safeLocalStorageSetItem]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const handleEnded = () => {
      handleTrackEnd();
    };
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setSeekPosition(audioRef.current.currentTime);
        safeLocalStorageSetItem('seekPosition', audioRef.current.currentTime.toString());
      }
    };
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTrackEnd, safeLocalStorageSetItem]);

  /** ------------------------------------------------------------------
   *  openAddToPlaylistModal
   * ------------------------------------------------------------------ */
  const openAddToPlaylistModal = useCallback((track: Track) => {
    setContextMenuTrack(track);
    // If you want a real modal, you could set showAddToPlaylistModal = true
    // but since ESLint says it's not used, remove it entirely or actually use it.
  }, []);

  /** ------------------------------------------------------------------
   *  addToPlaylist
   * ------------------------------------------------------------------ */
  const addToPlaylist = useCallback(
    (track: Track, playlistName: string) => {
      const updatedPlaylists = playlists.map((p) =>
        p.name === playlistName ? { ...p, tracks: [...p.tracks, track] } : p
      );
      setPlaylists(updatedPlaylists);
      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
    },
    [playlists, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  openPlaylist
   * ------------------------------------------------------------------ */
  const openPlaylist = useCallback((playlist: Playlist) => {
    setCurrentPlaylist(playlist);
    setView('playlist');
  }, []);

  /** ------------------------------------------------------------------
   *  pinPlaylist
   * ------------------------------------------------------------------ */
  const pinPlaylist = useCallback(
    (playlist: Playlist) => {
      const updatedPlaylists = playlists.map((p) =>
        p.name === playlist.name ? { ...p, pinned: !p.pinned } : p
      );
      setPlaylists(updatedPlaylists);
      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
    },
    [playlists, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  downloadTrack
   * ------------------------------------------------------------------ */
  const downloadTrack = useCallback(
    async (track: Track) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/track/${track.id}.mp3`);
        const blob = await response.blob();
        const db = await openDatabase();
        const transaction = db.transaction('tracks', 'readwrite');
        const store = transaction.objectStore('tracks');
        store.put({ id: track.id, blob });
      } catch (error) {
        console.error('Error downloading track:', error);
      }
    },
    [openDatabase]
  );

  /** ------------------------------------------------------------------
   *  toggleLike
   * ------------------------------------------------------------------ */
  const toggleLike = useCallback(
    (track: Track | null = currentTrack) => {
      if (!track) return;

      const likedSongsPlaylist = playlists.find((p) => p.name === 'Liked Songs');
      if (!likedSongsPlaylist) return;

      const updatedPlaylists = playlists.map((p) => {
        if (p.name === 'Liked Songs') {
          const isAlreadyLiked = p.tracks.some((t) => t.id === track.id);
          return {
            ...p,
            tracks: isAlreadyLiked
              ? p.tracks.filter((t) => t.id !== track.id)
              : [...p.tracks, track],
          };
        }
        return p;
      });

      const cleanPlaylists = safeClone(updatedPlaylists);

      setPlaylists(cleanPlaylists);
      safeLocalStorageSetItem('playlists', JSON.stringify(cleanPlaylists));
      setIsLiked((prev) => !prev);
    },
    [currentTrack, playlists, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  deletePlaylist
   * ------------------------------------------------------------------ */
  const deletePlaylist = useCallback(
    (playlist: Playlist) => {
      const updatedPlaylists = playlists.filter((p) => p.name !== playlist.name);
      setPlaylists(updatedPlaylists);
      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
    },
    [playlists, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  handleContextMenu
   *  (We can remove it entirely if we never attach it)
   * ------------------------------------------------------------------ */
  const handleContextMenu = useCallback(
    (e: MouseEvent, item: Track | Playlist) => {
      e.preventDefault();
      const options: ContextMenuOption[] = [
        { label: 'Add to Queue', action: () => addToQueue(item as Track) },
        { label: 'Add to Playlist', action: () => openAddToPlaylistModal(item as Track) },
        { label: 'Add to Liked Songs', action: () => toggleLike(item as Track) },
        { label: 'Download', action: () => downloadTrack(item as Track) }
      ];
      if ('tracks' in item) {
        options.push(
          { label: 'Pin Playlist', action: () => pinPlaylist(item as Playlist) },
          { label: 'Delete Playlist', action: () => deletePlaylist(item as Playlist) }
        );
      }
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuOptions(options);
      setShowContextMenu(true);
    },
    [addToQueue, openAddToPlaylistModal, toggleLike, downloadTrack, pinPlaylist, deletePlaylist]
  );

  /** ------------------------------------------------------------------
   *  Playlist control (play, download, shuffle)
   * ------------------------------------------------------------------ */
  const playPlaylist = useCallback(
    (playlist: Playlist) => {
      setQueue(playlist.tracks);
      setCurrentTrack(playlist.tracks[0]);
      setIsPlaying(true);
    },
    []
  );

  const downloadPlaylist = useCallback(
    async (playlist: Playlist) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      const totalTracks = playlist.tracks.length;
      let downloadedTracks = 0;
      for (const track of playlist.tracks) {
        await downloadTrack(track);
        downloadedTracks++;
        setDownloadProgress((downloadedTracks / totalTracks) * 100);
      }
      playlist.downloaded = true;
      setIsDownloading(false);
    },
    [downloadTrack]
  );

  const smartShuffle = useCallback(
    (playlist: Playlist) => {
      const artistCounts: Record<string, number> = {};
      playlist.tracks.forEach((track) => {
        artistCounts[track.artist.name] = (artistCounts[track.artist.name] || 0) + 1;
      });
      const mostCommonArtist = Object.keys(artistCounts).reduce((a, b) =>
        artistCounts[a] > artistCounts[b] ? a : b
      );
      const filtered = searchResults.filter(
        (track) => track.artist.name === mostCommonArtist && !playlist.tracks.some((t) => t.id === track.id)
      );
      const additionalTracks = filtered.slice(0, 5);
      const newPlaylistTracks = [...playlist.tracks, ...additionalTracks];
      const shuffledTracks = newPlaylistTracks.sort(() => Math.random() - 0.5);
      const updatedPlaylist = { ...playlist, tracks: shuffledTracks };
      const updatedPlaylists = playlists.map((p) => (p.name === playlist.name ? updatedPlaylist : p));
      setPlaylists(updatedPlaylists);
      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
      setCurrentPlaylist(updatedPlaylist);
    },
    [playlists, searchResults, safeLocalStorageSetItem]
  );

  /** ------------------------------------------------------------------
   *  toggleLyricsView
   * ------------------------------------------------------------------ */
  const toggleLyricsView = useCallback(() => {
    setShowLyrics(!showLyrics);
  }, [showLyrics]);

  /** ------------------------------------------------------------------
   *  shuffleQueue
   * ------------------------------------------------------------------ */
  const shuffleQueue = useCallback(() => {
    const shuffledQueue = [...queue];
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
    }
    setQueue(shuffledQueue);
    setShuffleOn(!shuffleOn);
  }, [queue, shuffleOn]);

  /** ------------------------------------------------------------------
   *  createPlaylist
   * ------------------------------------------------------------------ */
  const createPlaylist = useCallback(() => {
    if (newPlaylistName) {
      const newPlaylist: Playlist = {
        name: newPlaylistName,
        image: newPlaylistImage || '/placeholder.svg?height=80&width=80',
        tracks: selectedTracksForNewPlaylist
      };
      const updatedPlaylists = [...playlists, newPlaylist];
      setPlaylists(updatedPlaylists);
      setNewPlaylistName('');
      setNewPlaylistImage(null);
      setSelectedTracksForNewPlaylist([]);
      setShowCreatePlaylist(false);
      setShowSearchInPlaylistCreation(false);
      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
    }
  }, [newPlaylistName, newPlaylistImage, selectedTracksForNewPlaylist, playlists, safeLocalStorageSetItem]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPlaylistImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /** ------------------------------------------------------------------
   *  getMostPlayedArtists & fetchRandomSongs
   * ------------------------------------------------------------------ */
  const getMostPlayedArtists = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    const recentlyPlayed = JSON.parse(safeLocalStorageGetItem('recentlyPlayed') || '[]') as Track[];
    const artistCounts = recentlyPlayed.reduce<Record<string, number>>((acc, track) => {
      acc[track.artist.name] = (acc[track.artist.name] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(artistCounts).sort((a, b) => artistCounts[b] - artistCounts[a]);
  }, [safeLocalStorageGetItem]);

  const fetchRandomSongs = useCallback(
    async (artists: string[]): Promise<Track[]> => {
      const randomSongs: Track[] = [];
      for (const artist of artists) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(artist)}`
          );
          const data = await response.json();
          randomSongs.push(...data.results.slice(0, 5));
        } catch (error) {
          console.error('Error fetching random songs:', error);
        }
      }
      return randomSongs;
    },
    []
  );

  /** ------------------------------------------------------------------
   *  Onboarding
   * ------------------------------------------------------------------ */
  const startOnboarding = useCallback(() => {
    setShowOnboarding(true);
    setOnboardingStep(1);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    safeLocalStorageSetItem('onboardingDone', 'true');
    setShowOnboarding(false);
    setShowArtistSelection(false);
    setOnboardingStep(0);
    setView('home');
  }, [safeLocalStorageSetItem]);

  const handleStep1Complete = useCallback(() => {
    setOnboardingStep(2);
  }, []);

  const handleArtistSelectionComplete = useCallback(
    async (artists: Artist[]) => {
      try {
        audioRef.current?.pause();
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }

        safeLocalStorageSetItem('favoriteArtists', JSON.stringify(artists));
        setShowArtistSelection(false);

        const fetchPromises = artists.map(async (artist) => {
          const response = await fetch(
            `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(artist.name)}`
          );
          const data = await response.json();
          return data.results.slice(0, 5);
        });

        const artistTracks = await Promise.all(fetchPromises);
        const allTracks = artistTracks.flat();
        const shuffledTracks = allTracks.sort(() => Math.random() - 0.5);
        setQueue(shuffledTracks);
        setSearchResults(shuffledTracks);

        if (shuffledTracks.length > 0) {
          setCurrentTrack(shuffledTracks[0]);
          setIsPlaying(false);
        }

        const recentTracks = shuffledTracks.slice(0, 4);
        safeLocalStorageSetItem('recentlyPlayed', JSON.stringify(recentTracks));
        setJumpBackIn(recentTracks);

        if (!playlists.some((p) => p.name === 'Liked Songs')) {
          const updatedPlaylists = [
            ...playlists,
            { name: 'Liked Songs', image: '/images/liked-songs.webp', tracks: [] }
          ];
          setPlaylists(updatedPlaylists);
          safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
        }
      } catch (error) {
        console.error('Error in artist selection completion:', error);
      }
    },
    [playlists, safeLocalStorageSetItem]
  );

  const handleStep2Complete = useCallback(
    (artists: Artist[]) => {
      void handleArtistSelectionComplete(artists).then(() => {
        handleOnboardingComplete();
      });
    },
    [handleArtistSelectionComplete, handleOnboardingComplete]
  );

  /** ------------------------------------------------------------------
   *  Check Onboarding on mount
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const onboardingDone = safeLocalStorageGetItem('onboardingDone');
    if (!onboardingDone) {
      startOnboarding();
    }
  }, [startOnboarding, safeLocalStorageGetItem]);

  /** ------------------------------------------------------------------
   *  Load from LocalStorage
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = safeLocalStorageGetItem('volume');
      if (savedVolume) setVolume(parseFloat(savedVolume));

      const savedShuffleOn = safeLocalStorageGetItem('shuffleOn');
      if (savedShuffleOn) setShuffleOn(JSON.parse(savedShuffleOn));

      const savedPlaylists = JSON.parse(safeLocalStorageGetItem('playlists') || '[]') as Playlist[];
      if (!savedPlaylists.some((p) => p.name === 'Liked Songs')) {
        savedPlaylists.push({ name: 'Liked Songs', image: '/images/liked-songs.webp', tracks: [] });
      }
      setPlaylists(savedPlaylists);
      setJumpBackIn(JSON.parse(safeLocalStorageGetItem('recentlyPlayed') || '[]') as Track[]);

      const savedQueue = JSON.parse(safeLocalStorageGetItem('queue') || '[]') as Track[];
      const savedPos = parseFloat(safeLocalStorageGetItem('savedPosition') || '0');
      const wasPlaying = safeLocalStorageGetItem('wasPlaying') === 'true';
      setQueue(savedQueue);
      setSavedPosition(savedPos);

      if (savedQueue.length > 0) {
        const savedTrack = JSON.parse(safeLocalStorageGetItem('currentTrack') || 'null') as Track;
        if (savedTrack) {
          setCurrentTrack(savedTrack);
          setSeekPosition(savedPos);
          setIsPlaying(wasPlaying);
        }
      }
      const favoriteArtists = JSON.parse(safeLocalStorageGetItem('favoriteArtists') || '[]') as Artist[];
      if (favoriteArtists.length > 0) {
        void fetchSearchResults(favoriteArtists[Math.floor(Math.random() * favoriteArtists.length)].name);
      }
    }
  }, [fetchSearchResults, safeLocalStorageGetItem]);


const handleSearch = useCallback(
  async (query: string) => {
    // Keep local state (searchQuery) in sync
    setSearchQuery(query);

    // If user cleared the input, empty results & bail out
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Update recent searches
    setRecentSearches((prev: string[]) => {
      // Remove this query if it exists
      const filtered = prev.filter((item: string) => item !== query);
      // Insert the new query at the front & limit to 5
      const updated = [query, ...filtered].slice(0, 5);
      safeLocalStorageSetItem('recentSearches', JSON.stringify(updated));
      return updated;
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      // Populate results if success
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      // Optionally clear or handle error state
      setSearchResults([]);
    }
  },
  [
    setSearchQuery,
    setSearchResults,
    setRecentSearches,
    safeLocalStorageSetItem
  ]
);

  /** ------------------------------------------------------------------
   *  Whenever queue changes, store & preload
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorageSetItem('queue', JSON.stringify(queue));
      void preloadQueueTracks(queue);
    }
  }, [queue, preloadQueueTracks, safeLocalStorageSetItem]);

  /** ------------------------------------------------------------------
   *  Whenever currentTrack changes, update local + play
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (currentTrack) {
      void playTrackFromSource(currentTrack); // Handles playback
      setIsPlaying(true); // Ensure play state is updated correctly
      updateRecentlyPlayed(currentTrack); // Updates recently played list
      safeLocalStorageSetItem('currentTrack', JSON.stringify(currentTrack));

      // Ensure toggling likes does not unintentionally modify the queue
      if (!queue.some((t) => t.id === currentTrack.id)) {
        setQueue((prevQueue) => [currentTrack, ...prevQueue.filter((track) => track.id !== currentTrack.id)]);
      }

      setIsLiked(isTrackLiked(currentTrack)); // Check like status
      void fetchLyrics(currentTrack); // Fetch lyrics asynchronously
    }
  }, [currentTrack, queue, playTrackFromSource, updateRecentlyPlayed, safeLocalStorageSetItem, isTrackLiked, fetchLyrics]);

  useEffect(() => {
    if (currentTrack) {
      const counts = JSON.parse(safeLocalStorageGetItem('listenCounts') || '{}');
      setListenCount(counts[currentTrack.id] || 0);
    }
  }, [currentTrack, safeLocalStorageGetItem]);

  /** ------------------------------------------------------------------
   *  Onboarding Screens
   * ------------------------------------------------------------------ */
  if (showOnboarding) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black custom-scrollbar overflow-y-auto">
        {onboardingStep === 1 && <OnboardingStep1 onComplete={handleStep1Complete} />}
        {onboardingStep === 2 && <ArtistSelection onComplete={handleStep2Complete} />}
      </div>
    );
  }

  if (showArtistSelection) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black">
        <ArtistSelection onComplete={handleArtistSelectionComplete} />
      </div>
    );
  }

  /** ------------------------------------------------------------------
   *  Render the UI
   * ------------------------------------------------------------------ */
  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden">
      {/* MOBILE LAYOUT */}
      <div className="md:hidden flex flex-col h-[100dvh]">
        {/* Mobile Header */}
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
          <div className="flex space-x-4">
            <Bell className="w-6 h-6" />
            <Clock className="w-6 h-6" />
            {/* Cog Icon with Dropdown */}
            <div className="relative">
              <button
                className="w-6 h-6 rounded-full flex items-center justify-center"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
              >
                <Cog className="w-6 h-6 text-white" />
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0a1929] rounded-lg shadow-xl z-10 border border-[#1e3a5f] animate-slideIn">
                  {/* Install App Option */}
                  <button
                    className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
                              transition-colors duration-200 group rounded-t-lg"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      const dp = window.deferredPrompt;
                      if (dp) {
                        dp.prompt();
                        dp.userChoice.then(() => {
                          window.deferredPrompt = undefined;
                        });
                      } else {
                        setShowPwaModal(true);
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-3 text-[#90caf9] group-hover:text-white" />
                    Install App
                    <span className="ml-2 bg-[#1a237e] text-xs text-white px-2 py-0.5 rounded-full">New</span>
                  </button>
                  {/* Log Out Option */}
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
              {/* PWA Install Modal */}
              {showPwaModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
                  <div className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl border border-[#1e3a5f] animate-slideIn m-4">
                    <h2 className="text-2xl font-bold text-center mb-6 text-[#90caf9]">Install App</h2>
                    {(() => {
                      const userAgent = navigator.userAgent || navigator.vendor;
                      if (/android/i.test(userAgent)) {
                        return (
                          <div className="space-y-4">
                            <p className="text-gray-300">For the best experience, add the app to your home screen:</p>
                            <ol className="list-decimal ml-6 mt-2 space-y-3 text-gray-300">
                              <li className="transition-colors duration-200 hover:text-white">
                                Open Chrome on your Android device.
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Tap the <strong className="text-[#90caf9]">menu</strong> button (three vertical dots).
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Select <strong className="text-[#90caf9]">Add to Home Screen</strong>.
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Confirm by tapping <strong className="text-[#90caf9]">Add</strong>.
                              </li>
                            </ol>
                          </div>
                        );
                      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
                        return (
                          <div className="space-y-4">
                            <p className="text-gray-300">For the best experience, add the app to your home screen:</p>
                            <ol className="list-decimal ml-6 mt-2 space-y-3 text-gray-300">
                              <li className="transition-colors duration-200 hover:text-white">
                                Open Safari on your iOS device.
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Tap the <strong className="text-[#90caf9]">Share</strong> icon (a square with an arrow).
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Select <strong className="text-[#90caf9]">Add to Home Screen</strong>.
                              </li>
                              <li className="transition-colors duration-200 hover:text-white">
                                Confirm by tapping <strong className="text-[#90caf9]">Add</strong>.
                              </li>
                            </ol>
                          </div>
                        );
                      } else {
                        return <p className="text-gray-300">Your platform does not support manual installation.</p>;
                      }
                    })()}
                    <button
                      onClick={() => setShowPwaModal(false)}
                      className="mt-8 px-6 py-3 bg-[#1a237e] text-white rounded-lg w-full transition-all duration-300 hover:bg-[#283593] focus:outline-none focus:ring-2 focus:ring-[#90caf9] focus:ring-offset-2 focus:ring-offset-[#0a1929] font-semibold shadow-lg hover:shadow-xl active:transform active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav className="px-4 mb-4">
          <ul className="flex space-x-2 overflow-x-auto custom-scrollbar">
            <li>
              <button className="bg-gray-800 rounded-full px-4 py-2 text-sm font-medium">Music</button>
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

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(4rem+2rem+env(safe-area-inset-bottom))]">
          {view === 'playlist' && currentPlaylist ? (
            <section>
              {/* MOBILE PLAYLIST VIEW */}
              <div className="relative h-64 mb-4">
                <img
                  src={currentPlaylist.image}
                  alt={currentPlaylist.name}
                  className="w-full h-full object-cover rounded-lg"
                  style={{ filter: 'blur(5px) brightness(0.5)' }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <h2 className="text-4xl font-bold mb-2">{currentPlaylist.name}</h2>
                  <div className="flex space-x-2">
                    <button
                      className="bg-white text-black rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => playPlaylist(currentPlaylist)}
                    >
                      Play
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={shuffleQueue}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => smartShuffle(currentPlaylist)}
                    >
                      Smart Shuffle
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => downloadPlaylist(currentPlaylist)}
                    >
                      {isDownloading ? (
                        <div className="relative flex items-center">
                          <Download
                            className={`w-4 h-4 mr-2 ${downloadProgress === 100 ? 'text-blue-500' : ''}`}
                          />
                          <span>{Math.round(downloadProgress)}%</span>
                        </div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {currentPlaylist.tracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-gray-400 mb-4">This playlist is empty.</p>
                    <button
                      className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        setShowSearchInPlaylistCreation(true);
                        setCurrentPlaylist(currentPlaylist);
                      }}
                    >
                      Add Songs
                    </button>
                  </div>
                ) : (
                  currentPlaylist.tracks.map((track, index) => (
                    <TrackItem key={index} track={track} />
                  ))
                )}
              </div>
            </section>
          ) : searchQuery ? (
            <section>
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <div
                className="grid gap-4 h-[calc(100vh-40vh)] overflow-y-auto custom-scrollbar"
                style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
              >
                {searchResults.map((track) => (
                  <TrackItem key={track.id} track={track} />
                ))}
              </div>
            </section>
          ) : view === 'library' ? (
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
              <div className="grid grid-cols-1 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.name}
                    className={`bg-gray-800 bg-opacity-40 rounded-lg p-4 flex items-center cursor-pointer relative ${
                      playlist.pinned ? 'border-2 border-blue-900' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', playlist.name);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedPlaylistName = e.dataTransfer.getData('text/plain');
                      const draggedPlaylistIndex = playlists.findIndex((p) => p.name === draggedPlaylistName);
                      const targetPlaylistIndex = playlists.findIndex((p) => p.name === playlist.name);
                      const updatedPlaylists = [...playlists];
                      const [draggedPlaylist] = updatedPlaylists.splice(draggedPlaylistIndex, 1);
                      updatedPlaylists.splice(targetPlaylistIndex, 0, draggedPlaylist);
                      setPlaylists(updatedPlaylists);
                      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
                    }}
                    onClick={() => openPlaylist(playlist)}
                    style={{ userSelect: 'none' }}
                  >
                    <img src={playlist.image} alt={playlist.name} className="w-12 h-12 rounded mr-3" />
                    <span className="font-medium text-sm">{playlist.name}</span>
                    {playlist.downloaded && <Download className="w-4 h-4 text-green-500 ml-2" />}
                    <button
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        const options: ContextMenuOption[] = [
                          { label: 'Pin Playlist', action: () => pinPlaylist(playlist) },
                          { label: 'Delete Playlist', action: () => deletePlaylist(playlist) },
                          { label: 'Download Playlist', action: () => downloadPlaylist(playlist) }
                        ];
                        setContextMenuPosition({ x: e.clientX, y: e.clientY });
                        setContextMenuOptions(options);
                        setShowContextMenu(true);
                      }}
                    >
                      <span className="w-4 h-4 text-white">•••</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="mb-6">
                <div className="grid grid-cols-2 gap-2">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.name}
                      className="flex items-center space-x-3 bg-gray-800 bg-opacity-40 rounded-md p-2 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                    >
                      <img src={playlist.image} alt={playlist.name} className="w-10 h-10 rounded-md" />
                      <span className="font-medium text-sm">{playlist.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlaylist(playlist);
                        }}
                        className="ml-auto p-1 text-red-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="mb-6">
                {jumpBackIn.length > 0 && <h2 className="text-2xl font-bold mb-4">Jump Back In</h2>}
                {jumpBackIn.length > 0 ? (
                  <div className="flex space-x-4 overflow-x-auto custom-scrollbar">
                    {jumpBackIn.map((track, index) => (
                      <motion.div
                        key={index}
                        className="flex-shrink-0 w-40"
                        drag="x"
                        dragConstraints={{ left: -100, right: 100 }}
                        onDragEnd={(event, info) => {
                          if (info.offset.x < -80) {
                            playTrack(track);
                          }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="relative">
                          <img
                            src={track.album.cover_medium}
                            alt={track.title}
                            className="w-40 h-40 object-cover rounded-lg mb-2"
                          />
                          <button
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            onClick={() => playTrack(track)}
                          >
                            <Play className="w-12 h-12 text-white" />
                          </button>
                        </div>
                        <p className="font-medium text-sm text-center">{track.title}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Suggested for you</h2>
                    <div className="flex space-x-4 overflow-x-auto custom-scrollbar">
                      {searchResults.slice(0, 5).map((track, index) => (
                        <div key={index} className="flex-shrink-0 w-40">
                          <div className="relative">
                            <img
                              src={track.album.cover_medium}
                              alt={track.title}
                              className="w-40 h-40 object-cover rounded-lg mb-2"
                            />
                            <button
                              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                              onClick={() => playTrack(track)}
                            >
                              <Play className="w-12 h-12 text-white" />
                            </button>
                          </div>
                          <p className="font-medium text-sm">{track.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
                <div
                  className="grid grid-cols-1 gap-4 h-[calc(100vh-40vh)] overflow-y-auto custom-scrollbar"
                  style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
                >
                  {searchResults.map((track) => (
                    <TrackItem key={track.id} track={track} />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Mobile Footer */}
        {!isPlayerOpen && (
          <footer
            className="bg-black p-4 flex justify-around fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)]"
            style={{
              zIndex: 9999,
              paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))'
            }}
          >
            <button
              className="flex flex-col items-center text-gray-400 hover:text-white"
              onClick={() => {
                setView('home');
                setSearchQuery('');
              }}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button
              className="flex flex-col items-center text-gray-400 hover:text-white"
              onClick={() => {
                setIsSearchOpen(true);
                setView('search');
              }}
            >
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Search</span>
            </button>

            {/* Mobile Search Overlay */}
            {isSearchOpen && view === 'search' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                className="fixed inset-0 bg-black z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setView('home');
                    }}
                    className="p-2"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <h1 className="text-lg font-semibold">Search</h1>
                  <div className="w-10" />
                </div>

                {/* Mobile Search Form */}
                <div className="p-4">
                  <form onSubmit={(e) => e.preventDefault()} className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="What do you want to listen to?"
                      value={searchQuery}
                      onChange={(e) => {
                        const newQuery = e.target.value;
                        setSearchQuery(newQuery);
                        handleSearch(newQuery);
                      }}
                      className="w-full px-4 py-3 rounded-full bg-gray-800 text-white placeholder-gray-500 
                                focus:outline-none focus:ring-2 focus:ring-green-500 pl-12 transition-all 
                                duration-200 ease-in-out"
                    />
                  </form>
                  <div className="flex gap-2 mt-4">
                    {(['tracks'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSearchType(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium 
                          ${
                            searchType === type
                              ? 'bg-white text-black'
                              : 'bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-200'
                          }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Recent Searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white/90">Recent Searches</h3>
                      <button
                        onClick={() => {
                          setRecentSearches([]);
                          safeLocalStorageSetItem('recentSearches', JSON.stringify([]));
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-500 rounded hover:bg-red-600 text-white"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((query, index) => (
                        <div
                          key={index}
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
                              const updatedSearches = recentSearches.filter((_, idx) => idx !== index);
                              setRecentSearches(updatedSearches);
                              safeLocalStorageSetItem('recentSearches', JSON.stringify(updatedSearches));
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

                {/* Mobile Search Results */}
                {searchQuery && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-400">No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold mb-4">Search Results</h2>
                        <div className="grid grid-cols-1 gap-4">
                          {searchResults.map((result) => (
                            <TrackItem
                              key={result.id}
                              track={result}
                              onTrackClick={(track) => {
                                playTrack(track);
                                setIsSearchOpen(false);
                                setView('home');
                              }}
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
              onClick={() => {
                setView('library');
              }}
            >
              <Library className="w-6 h-6" />
              <span className="text-xs mt-1">Your Library</span>
            </button>
          </footer>
        )}

        {/* Mobile Player */}
        {mounted && currentTrack && (
          <MobilePlayer
            currentTrack={currentTrack}
            currentTrackIndex={queue.findIndex((t) => t.id === currentTrack?.id)}
            isPlaying={isPlaying}
            removeFromQueue={removeFromQueue}
            setQueue={setQueue}
            togglePlay={togglePlay}
            skipTrack={skipTrack}
            previousTrack={previousTrackFunc}
            seekPosition={seekPosition}
            duration={duration}
            listenCount={listenCount}
            handleSeek={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setSeekPosition(time);
              }
            }}
            isLiked={isLiked}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            toggleLike={toggleLike}
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

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-1 gap-2 p-2 overflow-y-auto custom-scrollbar">
        {showContextMenu && (
          <CustomContextMenu
            x={contextMenuPosition.x}
            y={contextMenuPosition.y}
            onClose={() => setShowContextMenu(false)}
            options={contextMenuOptions}
          />
        )}
        <aside className="w-64 bg-gradient-to-b from-gray-900 to-black rounded-lg p-4 overflow-y-auto custom-scrollbar">
          <nav className="space-y-4">
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-3 space-y-2">
              <button
                className="flex items-center text-white hover:text-white w-full py-2 px-3 rounded-lg transition-colors duration-200"
                onClick={() => setView('home')}
              >
                <Home className="w-6 h-6 mr-3" />
                Home
              </button>
              <button
                className="flex items-center text-white hover:text-white w-full py-2 px-3 rounded-lg transition-colors duration-200"
                onClick={() => setView('search')}
              >
                <Search className="w-6 h-6 mr-3" />
                Search
              </button>
            </div>
            <div className="bg-gray-800 bg-opacity-40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-white">
                  <Library className="w-6 h-6 mr-3" />
                  Your Library
                </div>
              </div>
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.name}
                    className={`flex items-center space-x-3 bg-gray-800 bg-opacity-40 rounded-md p-2 cursor-pointer hover:bg-gray-600 transition-colors duration-200 ${
                      playlist.pinned ? 'border-2 border-blue-900' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', playlist.name);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedPlaylistName = e.dataTransfer.getData('text/plain');
                      const draggedPlaylistIndex = playlists.findIndex((p) => p.name === draggedPlaylistName);
                      const targetPlaylistIndex = playlists.findIndex((p) => p.name === playlist.name);
                      const updatedPlaylists = [...playlists];
                      const [draggedPlaylist] = updatedPlaylists.splice(draggedPlaylistIndex, 1);
                      updatedPlaylists.splice(targetPlaylistIndex, 0, draggedPlaylist);
                      setPlaylists(updatedPlaylists);
                      safeLocalStorageSetItem('playlists', JSON.stringify(updatedPlaylists));
                    }}
                    onClick={() => openPlaylist(playlist)}
                    style={{ userSelect: 'none' }}
                  >
                    <img src={playlist.image} alt={playlist.name} className="w-10 h-10 rounded-md" />
                    <span className="font-medium text-sm">{playlist.name}</span>
                    {playlist.downloaded && <Download className="w-4 h-4 text-green-500 ml-2" />}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Desktop Main */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] bg-gradient-to-b from-gray-900 to-black rounded-lg p-6">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
            <div className="relative flex items-center">
              {mounted &&
                typeof window !== 'undefined' &&
                !(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) && (
                  <>
                    <button
                      className="bg-[#1a237e] text-white rounded-full px-6 py-2.5 text-sm font-semibold ml-4 
                            transition-all duration-300 hover:bg-[#283593] hover:shadow-lg 
                            focus:outline-none focus:ring-2 focus:ring-[#1a237e] focus:ring-offset-2"
                      onClick={() => {
                        const dp = window.deferredPrompt;
                        if (dp) {
                          dp.prompt();
                          dp.userChoice.then(() => {
                            window.deferredPrompt = undefined;
                          });
                        } else {
                          setShowPwaModal(true);
                        }
                      }}
                    >
                      <span className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Install App
                      </span>
                    </button>
                    {showPwaModal && (
                      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 
                              transition-all duration-300 animate-fadeIn">
                        <div className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl 
                              border border-[#1e3a5f] animate-slideIn">
                          <h2 className="text-2xl font-bold text-center mb-6 text-[#90caf9]">Install App</h2>
                          {/* PWA instructions similarly as above */}
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
                        setView('settings');
                        setShowUserMenu(false);
                      }}
                    >
                      <Cog className="w-5 h-5 mr-3" />
                      Settings
                    </button>
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left"
                      onClick={() => {
                        setShowUserMenu(false);
                      }}
                    >
                      <User className="w-5 h-5 mr-3" />
                      Profile
                    </button>
                    <button
                      className="flex items-center px-6 py-3 text-lg text-gray-300 hover:bg-gray-700 w-full text-left rounded-b-lg"
                      onClick={() => {
                        setShowUserMenu(false);
                      }}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {view === 'settings' ? (
            <section>
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">Account</h3>
                  <p className="text-gray-400">Manage your account settings and set e-mail preferences.</p>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">Playback</h3>
                  <p className="text-gray-400">Customize your playback settings.</p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Default Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value);
                        onVolumeChange(newVolume);
                      }}
                      className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Default Music Quality</label>
                    <select
                      className="w-full p-2 rounded bg-gray-700 text-white"
                      onChange={(e) => {
                        const quality = e.target.value;
                        safeLocalStorageSetItem('musicQuality', quality);
                      }}
                      defaultValue={safeLocalStorageGetItem('musicQuality') || 'high'}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">Privacy</h3>
                  <p className="text-gray-400">Control your privacy settings and data usage.</p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cache Music</label>
                    <input
                      type="checkbox"
                      checked={safeLocalStorageGetItem('cacheMusic') === 'true'}
                      onChange={(e) => {
                        const cacheMusic = e.target.checked;
                        safeLocalStorageSetItem('cacheMusic', cacheMusic.toString());
                      }}
                      className="w-4 h-4 text-green-500 bg-gray-700 rounded border-gray-600 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">Notifications</h3>
                  <p className="text-gray-400">Set your notification preferences.</p>
                </div>
                <div className="bg-gray-800 bg-opacity-40 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-2">Beta Features</h3>
                  <p className="text-gray-400">Toggle beta features on or off.</p>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Enable Beta Features</label>
                    <input
                      type="checkbox"
                      checked={safeLocalStorageGetItem('betaFeatures') === 'true'}
                      onChange={(e) => {
                        const betaFeatures = e.target.checked;
                        safeLocalStorageSetItem('betaFeatures', betaFeatures.toString());
                      }}
                      className="w-4 h-4 text-green-500 bg-gray-700 rounded border-gray-600 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : view === 'playlist' && currentPlaylist ? (
            <section>
              <div className="relative h-64 mb-4">
                <img
                  src={currentPlaylist.image}
                  alt={currentPlaylist.name}
                  className="w-full h-full object-cover rounded-lg"
                  style={{ filter: 'blur(5px) brightness(0.5)' }}
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="flex-grow">
                    <h2 className="text-4xl font-bold mb-2">{currentPlaylist.name}</h2>
                    <p className="text-sm text-gray-300">{currentPlaylist.tracks.length} tracks</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-white text-black rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => playPlaylist(currentPlaylist)}
                    >
                      Play
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={shuffleQueue}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => smartShuffle(currentPlaylist)}
                    >
                      Smart Shuffle
                    </button>
                    <button
                      className="bg-gray-800 text-white rounded-full px-4 py-2 text-sm font-semibold"
                      onClick={() => downloadPlaylist(currentPlaylist)}
                    >
                      {isDownloading ? (
                        <div className="relative">
                          <Download className="w-4 h-4" />
                          <div
                            className="absolute inset-0 rounded-full border-2 border-green-500"
                            style={{
                              clipPath: `circle(${downloadProgress}% at 50% 50%)`
                            }}
                          ></div>
                        </div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {currentPlaylist.tracks.map((track, index) => (
                  <TrackItem key={index} track={track} />
                ))}
              </div>
            </section>
          ) : view === 'search' ? (
            <section className="min-h-screen bg-transparent backdrop-blur-sm px-4 py-6">
              <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Search Header */}
                <div className="flex flex-col space-y-6">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text text-center animate-gradient">
                    Discover Your Music
                  </h1>
                  {/* Search Form */}
                  <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-2xl mx-auto">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors duration-300" />
                      <input
                        type="text"
                        placeholder="Search for songs, artists, or albums..."
                        value={searchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          handleSearch(val);
                        }}
                        className="w-full px-14 py-4 rounded-full bg-black/20 backdrop-blur-lg
                          text-white placeholder-gray-400 border border-purple-500/20
                          focus:outline-none focus:ring-2 focus:ring-purple-500/50
                          text-[15px] transition-all duration-300 hover:bg-black/30"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            handleSearch('');
                          }}
                          className="absolute right-5 top-1/2 transform -translate-y-1/2 text-purple-400 
                            hover:text-pink-400 transition-colors duration-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </form>
                  {/* Filter Pills */}
                  <div className="flex gap-3 justify-center">
                    {(['tracks'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSearchType(type)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300
                          ${
                            searchType === type
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                              : 'bg-black/20 backdrop-blur-lg text-white hover:bg-black/30 border border-purple-500/20'
                          }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Searches */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white/90">Recent Searches</h3>
                      <button
                        onClick={() => {
                          setRecentSearches([]);
                          safeLocalStorageSetItem('recentSearches', JSON.stringify([]));
                        }}
                        className="px-4 py-2 text-sm font-medium bg-red-500 rounded hover:bg-red-600 text-white"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((query, index) => (
                        <div
                          key={index}
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
                              const updatedSearches = recentSearches.filter((_, idx) => idx !== index);
                              setRecentSearches(updatedSearches);
                              safeLocalStorageSetItem('recentSearches', JSON.stringify(updatedSearches));
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

                {/* Search Results */}
                {searchQuery && (
                  <div className="animate-fadeIn">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                            Search Results
                          </h2>
                          <span className="text-sm text-purple-400">{searchResults.length} items found</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.map((result) => (
                            <TrackItem key={result.id} track={result} />
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
              {/* HOME VIEW */}
              {playlists.length > 0 && (
                <section className="mb-8 overflow-y-auto custom-scrollbar">
                  <h2 className="text-2xl font-bold mb-4">Recently played</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {playlists.slice(0, 6).map((playlist, index) => (
                      <div
                        key={index}
                        className="bg-gray-800 bg-opacity-40 rounded-lg p-4 flex items-center cursor-pointer"
                        onClick={() => openPlaylist(playlist)}
                      >
                        <img src={playlist.image} alt={playlist.name} className="w-16 h-16 rounded mr-4" />
                        <span className="font-medium">{playlist.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Jump Back In</h2>
                <div className="grid grid-cols-4 gap-4">
                  {jumpBackIn.map((track, index) => (
                    <div key={index}>
                      <div className="relative">
                        <img
                          src={track.album.cover_medium}
                          alt={track.title}
                          className="w-30 aspect-square object-cover rounded-lg mb-2"
                        />
                        <button
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => playTrack(track)}
                        >
                          <Play className="w-12 h-12 text-white" />
                        </button>
                      </div>
                      <p className="font-medium">{track.title}</p>
                      <p className="text-sm text-gray-400">{track.artist.name}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">Recommended</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result) => (
                    <TrackItem key={result.id} track={result} />
                  ))}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Desktop Sidebar / Queue */}
        {showQueue && (
          <aside className="w-64 bg-gradient-to-b from-gray-900 to-black rounded-lg p-4 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4">Queue</h2>
            {queue.length === 0 ? (
              <div>
                <p className="text-gray-400 mb-4">Your queue is empty.</p>
                <button
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-600 transition-all duration-200"
                  onClick={async () => {
                    const mostPlayedArtists = getMostPlayedArtists();
                    const randomSongs = await fetchRandomSongs(mostPlayedArtists);
                    setQueue(randomSongs);
                  }}
                >
                  Add Suggestions
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((track, index) => (
                  <TrackItem key={index} track={track} showArtist={false} />
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Desktop Player */}
      {mounted && currentTrack && (
        <footer className="hidden md:block">
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
            handleSeek={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setSeekPosition(time);
              }
            }}
            isLiked={isLiked}
            repeatMode={repeatMode}
            setRepeatMode={setRepeatMode}
            toggleLike={toggleLike}
            lyrics={lyrics}
            currentLyricIndex={currentLyricIndex}
            showLyrics={showLyrics}
            toggleLyricsView={toggleLyricsView}
            shuffleOn={shuffleOn}
            shuffleQueue={shuffleQueue}
            queue={queue}
            currentTrackIndex={queue.findIndex((t) => t.id === currentTrack?.id)}
            removeFromQueue={removeFromQueue}
            onQueueItemClick={onQueueItemClick}
            setIsPlayerOpen={setIsPlayerOpen}
            volume={volume}
            onVolumeChange={onVolumeChange}
            audioQuality={audioQuality}
            onCycleAudioQuality={onCycleAudioQuality}
            listenCount={listenCount}
          />
        </footer>
      )}

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 w-full max-w-md border border-gray-800">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
              Create Your Playlist
            </h2>
            <div className="space-y-6">
              {/* Playlist Name */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Give your playlist a name"
                  value={newPlaylistName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPlaylistName(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-gray-800/50 text-white placeholder-gray-400
                           border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500
                           transition-all duration-300 text-lg"
                />
              </div>
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Choose a Cover Image</label>
                <div className="relative group">
                  <label
                    htmlFor="playlist-image"
                    className="relative flex flex-col items-center justify-center w-full aspect-square
                             rounded-xl cursor-pointer overflow-hidden transition-all duration-300
                             bg-gradient-to-br from-gray-800/50 to-gray-900/50
                             group-hover:from-gray-700/50 group-hover:to-gray-800/50
                             border-2 border-dashed border-gray-600 group-hover:border-green-500"
                  >
                    {newPlaylistImage ? (
                      <img
                        src={newPlaylistImage}
                        alt="Playlist Cover"
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Drop your image here</p>
                        <p className="text-xs text-gray-400">or click to browse</p>
                      </div>
                    )}
                    <input id="playlist-image" type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreatePlaylist(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium
                           hover:bg-gray-800/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={createPlaylist}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600
                           hover:from-blue-600 hover:to-blue-700 text-white font-medium
                           transform transition-all duration-300 hover:scale-[1.02]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Songs to Playlist Modal */}
      {showSearchInPlaylistCreation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-8 w-full max-w-2xl border border-gray-800">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
              Add Songs to Your Playlist
            </h2>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search for songs..."
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-gray-800/50 text-white placeholder-gray-400
                         border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500
                         transition-all duration-300"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {searchResults.map((track) => (
                <TrackItem key={track.id} track={track} inPlaylistCreation={true} />
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <p className="text-sm font-medium text-gray-400">
                {selectedTracksForNewPlaylist.length} songs selected
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowSearchInPlaylistCreation(false)}
                  className="px-6 py-3 rounded-xl border border-gray-600 text-gray-300
                           hover:bg-gray-800/50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSearchInPlaylistCreation(false)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600
                           hover:from-green-600 hover:to-green-700 text-white font-medium
                           transform transition-all duration-300 hover:scale-[1.02]"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}