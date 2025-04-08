/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Cog,
  Clock,
  Play,
  Shuffle,
  Plus,
  Download,
  LogOut,
  ChevronLeft,
  X,
  MoreVertical,
  Music,
  User,
  ChevronRight,
  Volume2,
  Check,
  Wifi,
  Shield,
  Bell,
  Beaker,
} from "lucide-react";
import Image from "next/image";

// Hooks & Utilities
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/utils";

// Components
import TrackItem from "../common/TrackItem";

// Types
import { Track, Playlist, Lyric, ContextMenuOption } from "@/lib/types/types";

type RepeatMode = "off" | "all" | "one";
type AudioQuality = "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER";

type MobileLayoutProps = {
  greeting: string;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (value: boolean | ((prev: boolean) => boolean)) => void;
  showPwaModal: boolean;
  setShowPwaModal: (value: boolean) => void;
  view: string;
  currentPlaylist: Playlist | null;
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (value: boolean) => void;
  shuffleQueue: () => void;
  downloadPlaylist: (playlist: Playlist) => void;
  isDownloading: boolean;
  downloadProgress: number;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (query: string) => void;
  playlistSearchResults: Track[];
  handlePlaylistSearch: (query: string) => void;
  addTrackToPlaylist: (track: Track) => void;
  playTrack: (track: Track) => void;
  queue: Track[];
  previousTracks: Track[];
  removeFromQueue: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  showLyrics: boolean;
  toggleLyricsView: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Track[];
  handleSearch: (query: string) => void;
  isPlayerOpen: boolean;
  setView: (view: string) => void;
  mounted: boolean;
  lyrics: Lyric[];
  currentLyricIndex: number;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  seekPosition: number;
  duration: number;
  listenCount: number;
  searchType: string;
  setIsSearchOpen: (value: boolean) => void;
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
  setPlaylistSearchResults: (tracks: Track[]) => void;
  setShowSearchInPlaylistCreation: (value: boolean) => void;
  setShowCreatePlaylist: (value: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  storePlaylist: (playlist: Playlist) => void;
  deletePlaylistByName: (name: string) => Promise<Playlist[]>;
  jumpBackIn: Track[];
  recommendedTracks: Track[];
  toggleLikeMobile: (track: Track) => void;
  setIsPlayerOpen: (value: boolean) => void;
  setContextMenuPosition: (position: { x: number; y: number }) => void;
  setContextMenuOptions: (options: ContextMenuOption[]) => void;
  setShowContextMenu: (value: boolean) => void;
  isSearchOpen: boolean;
  setSearchType: (type: string) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  openPlaylist: (playlist: Playlist) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  togglePlay: () => void;
  skipTrack: () => void;
  previousTrackFunc: () => void;
  handleSeek: (position: number) => void;
  shuffleOn: boolean;
  changeAudioQuality: (
    quality: AudioQuality
  ) => Promise<void>; // or a synchronous function if you prefer
};

/* =================================
   1. HEADER COMPONENTS
   ================================= */
const SettingsMenu: React.FC<{
  showSettingsMenu: boolean;
  setShowSettingsMenu: (v: boolean | ((p: boolean) => boolean)) => void;
  setView: (v: string) => void;
  setShowPwaModal: (v: boolean) => void;
}> = ({ showSettingsMenu, setShowSettingsMenu, setView, setShowPwaModal }) => {
  if (!showSettingsMenu) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl z-10 border border-gray-700">
      <button
        className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
         transition-colors duration-200 group rounded-t-lg"
        onClick={() => {
          setView("settings");
          setShowSettingsMenu(false);
        }}
      >
        <Cog className="w-5 h-5 mr-3" />
        Settings
      </button>
      <button
        className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
           transition-colors duration-200 group rounded-t-lg"
        onClick={() => {
          setShowSettingsMenu(false);
          const dp = (window as any).deferredPrompt;
          if (dp) {
            dp.prompt();
            void dp.userChoice.then(() => {
              (window as any).deferredPrompt = undefined;
            });
          } else {
            setShowPwaModal(true);
          }
        }}
      >
        <Download className="w-4 h-4 mr-3 text-[#90caf9] group-hover:text-white" />
        Install App
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
  );
};

const PwaModal: React.FC<{
  showPwaModal: boolean;
  setShowPwaModal: (v: boolean) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
}> = ({ showPwaModal, setShowPwaModal, storeSetting }) => {
  if (!showPwaModal) return null;

  return (
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
          On desktop, you can install the PWA by clicking the &quot;Install
          App&quot; button in the URL bar if supported, or pressing the
          &quot;Install&quot; button. On Android, tap the three dots in Chrome
          and select &quot;Add to Home screen.&quot; On iOS, use Safari&apos;s
          share button and select &quot;Add to Home Screen.&quot;
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
                void storeSetting("hidePwaPrompt", "true");
                setShowPwaModal(false);
              }}
            />
            <span>Don’t show again</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC<{
  greeting: string;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (v: boolean | ((p: boolean) => boolean)) => void;
  showPwaModal: boolean;
  setShowPwaModal: (v: boolean) => void;
  setView: (v: string) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
}> = ({
  greeting,
  showSettingsMenu,
  setShowSettingsMenu,
  showPwaModal,
  setShowPwaModal,
  setView,
  storeSetting,
}) => (
  <header className="p-4 flex justify-between items-center">
    <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
    <div className="flex space-x-4">
      <div className="relative">
        <button
          className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
          onClick={() => setShowSettingsMenu((p) => !p)}
        >
          <Avatar className="w-full h-full">
            <AvatarImage
              src="https://i.pinimg.com/236x/fb/7a/17/fb7a17e227af3cf2e63c756120842209.jpg"
              alt="User Avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </button>
        <SettingsMenu
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          setView={setView}
          setShowPwaModal={setShowPwaModal}
        />
        <PwaModal
          showPwaModal={showPwaModal}
          setShowPwaModal={setShowPwaModal}
          storeSetting={storeSetting}
        />
      </div>
    </div>
  </header>
);

/* =================================
   2. SETTINGS VIEW
   ================================= */
const SettingsView: React.FC<{
  volume: number;
  onVolumeChange: (v: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (q: AudioQuality) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
}> = ({ volume, onVolumeChange, audioQuality, setAudioQuality, storeSetting }) => {
  return (
    <section
      className="w-full min-h-screen overflow-y-auto px-4 py-6"
      style={{ paddingBottom: "15rem" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <div className="inline-flex items-center space-x-2 bg-purple-600/10 text-purple-400 px-3 py-1.5 rounded-full">
          <User className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Pro Account</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account Section */}
        <button className="w-full bg-gray-800/40 active:bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div className="ml-3 flex-1 text-left">
              <h3 className="text-lg font-semibold text-white">Account</h3>
              <p className="text-sm text-gray-400">Manage account settings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        {/* Playback Section */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg">
              <Music className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-white">Playback</h3>
              <p className="text-sm text-gray-400">Audio settings</p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Volume</span>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">
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
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Audio Quality */}
          <div>
            <span className="text-sm text-gray-300 block mb-2">
              Audio Quality
            </span>
            <div className="grid grid-cols-2 gap-2">
              {["MAX", "HIGH", "NORMAL", "DATA_SAVER"].map((quality) => (
                <button
                  key={quality}
                  onClick={() => {
                    setAudioQuality(quality as AudioQuality);
                    void storeSetting("musicQuality", quality);
                  }}
                  className={`relative p-2.5 rounded-lg border transition-colors ${
                    audioQuality === quality
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-700 bg-gray-800/40 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {quality.replace("_", " ")}
                  </span>
                  {audioQuality === quality && (
                    <Check className="absolute top-1 right-1 w-3 h-3 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Saver Toggle */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-white">Data Saver</h3>
                <p className="text-sm text-gray-400">
                  Currently: {audioQuality}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              icon: Shield,
              title: "Privacy",
              desc: "Privacy settings",
              color: "rose",
            },
            {
              icon: Bell,
              title: "Notifications",
              desc: "Notification preferences",
              color: "orange",
            },
            { icon: Beaker, title: "Beta Features", desc: "Try new features", color: "emerald" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <button
              key={title}
              className="w-full bg-gray-800/40 active:bg-gray-800/60 rounded-lg p-4 text-left"
            >
              <div
                className={`p-2.5 bg-${color}-500/10 text-${color}-400 rounded-lg w-fit mb-2`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* =================================
   3. CATEGORY NAV
   ================================= */
const CategoryNav: React.FC = () => {
  const categories = [
    // "Music",
    "Coming Soon!"
    // "Podcasts & Shows",
    // "Audiobooks",
    // "Live",
    // "New Releases",
  ];

  return (
    <nav className="px-4 mb-4 relative">
      <div className="overflow-x-auto no-scrollbar">
        <ul className="flex whitespace-nowrap gap-2 pb-2">
          {categories.map((category) => (
            <li key={category}>
              <button className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 min-w-max">
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

/* =================================
   4. PLAYLIST VIEW
   ================================= */
const PlaylistView: React.FC<{
  currentPlaylist: Playlist;
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (value: boolean) => void;
  shuffleQueue: () => void;
  downloadPlaylist: (playlist: Playlist) => void;
  isDownloading: boolean;
  downloadProgress: number;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (v: string) => void;
  playlistSearchResults: Track[];
  handlePlaylistSearch: (q: string) => void;
  addTrackToPlaylist: (track: Track) => void;
  playTrack: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
}> = ({
  currentPlaylist,
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  shuffleQueue,
  downloadPlaylist,
  isDownloading,
  downloadProgress,
  playlistSearchQuery,
  setPlaylistSearchQuery,
  playlistSearchResults,
  handlePlaylistSearch,
  addTrackToPlaylist,
  playTrack,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}) => {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
            alt={currentPlaylist.name || "default playlist error alt"}
            className="w-full h-full object-cover"
            fill
            sizes="100vw"
            priority
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
                  <Download className="w-5 h-5" />
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
                    <Image
                      src={
                        track.album.cover_small || "/assets/default-album.jpg"
                      }
                      alt={track.title}
                      className="w-12 h-12 rounded-lg object-cover"
                      width={48}
                      height={48}
                      priority
                    />
                    <div>
                      <p className="font-medium text-white">{track.title}</p>
                      <p className="text-sm text-gray-400">
                        {track.artist.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void addTrackToPlaylist(track)}
                    className="flex items-center space-x-2 bg-[#1a237e]/20 text-green-400
                      hover:bg-[#1a237e] hover:text-white px-4 py-2 rounded-lg
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
              <p className="text-gray-400 mb-4">This playlist is empty</p>
            </div>
          ) : (
            currentPlaylist.tracks.map((track, idx) => (
              <TrackItem
                key={idx}
                track={track}
                index={idx}
                onTrackClick={playTrack}
                addToQueue={() => {}}
                openAddToPlaylistModal={() => {}}
                toggleLike={toggleLike}
                isLiked={isTrackLiked(track)}
                onContextMenu={(e) => handleContextMenu(e, track)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

/* =================================
   5. LIBRARY VIEW
   ================================= */
const LibraryView: React.FC<{
  playlists: Playlist[];
  sidebarCollapsed: boolean;
  setShowCreatePlaylist: (v: boolean) => void;
  setPlaylists: (pl: Playlist[]) => void;
  storePlaylist: (playlist: Playlist) => void;
  deletePlaylistByName: (name: string) => Promise<Playlist[]>;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
  openPlaylist: (p: Playlist) => void;
  downloadPlaylist: (p: Playlist) => void;
}> = ({
  playlists,
  sidebarCollapsed,
  setShowCreatePlaylist,
  setPlaylists,
  storePlaylist,
  deletePlaylistByName,
  handleContextMenu,
  openPlaylist,
  downloadPlaylist,
}) => {
  return (
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
      <div className={cn("grid gap-4", sidebarCollapsed ? "grid-cols-1" : "grid-cols-1")}>
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
              const droppedPlaylistName = e.dataTransfer.getData("text/plain");
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
            <Image
              src={playlist.image || "/images/defaultPlaylistImage.png"}
              alt={playlist.name || "Playlist Cover"}
              className={cn(
                "rounded",
                sidebarCollapsed ? "w-10 h-10" : "w-12 h-12 mr-3"
              )}
              width={sidebarCollapsed ? 40 : 48}
              height={sidebarCollapsed ? 40 : 48}
              priority
            />
            {!sidebarCollapsed && (
              <>
                <span className="font-medium text-sm flex-1">{playlist.name}</span>
                {playlist.downloaded && (
                  <Download className="w-4 h-4 text-green-500 ml-2" />
                )}
                <button
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    const opts: ContextMenuOption[] = [
                      {
                        label: playlist.pinned ? "Unpin Playlist" : "Pin Playlist",
                        action: () => {
                          const updatedPlaylists = playlists.map((pl) =>
                            pl.name === playlist.name
                              ? { ...pl, pinned: !pl.pinned }
                              : pl
                          );
                          setPlaylists(updatedPlaylists);
                          void Promise.all(
                            updatedPlaylists.map((pl) => storePlaylist(pl))
                          );
                        },
                      },
                      {
                        label: "Delete Playlist",
                        action: () => {
                          void deletePlaylistByName(playlist.name).then((nl) =>
                            setPlaylists(nl)
                          );
                        },
                      },
                      {
                        label: "Download Playlist",
                        action: () => downloadPlaylist(playlist),
                      },
                    ];
                    // In a real app, you'd open a context menu using the `opts` array.
                    // For now, you can handle it however suits your app’s flow.
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
  );
};

/* =================================
   6. HOME VIEW
   ================================= */
const HomeView: React.FC<{
  playlists: Playlist[];
  jumpBackIn: Track[];
  recommendedTracks: Track[];
  setPlaylists: (pl: Playlist[]) => void;
  storePlaylist: (p: Playlist) => void;
  setView: (v: string) => void;
  playTrack: (t: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  searchResults: Track[];
}> = ({
  playlists,
  jumpBackIn,
  recommendedTracks,
  setPlaylists,
  storePlaylist,
  setView,
  playTrack,
  toggleLike,
  isTrackLiked,
  searchResults,
}) => {
  const pinnedPlaylists = playlists.filter((pl) => pl.pinned);

  return (
    <>
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-2">
          {pinnedPlaylists.map((pl) => (
            <div
              key={pl.name}
              className="flex items-center space-x-3 bg-gray-800 bg-opacity-40 rounded-md p-2 cursor-pointer hover:bg-gray-600 transition-colors duration-200"
            >
              <Image
                src={pl.image || "/images/defaultPlaylistImage.png"}
                alt={pl.name || "Playlist Cover"}
                className="w-10 h-10 rounded-md"
                width={40}
                height={40}
                priority
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
                    updatedPlaylists.map((playlist) => storePlaylist(playlist))
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
            {(jumpBackIn.length > 0 ? jumpBackIn : searchResults.slice(0, 5)).map(
              (track, idx) => (
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
                    <Image
                      src={
                        track.album.cover_medium ||
                        "/images/defaultPlaylistImage.png"
                      }
                      alt={track.title || "Album Cover"}
                      className={cn(
                        "w-full h-full",
                        "object-cover rounded-xl",
                        "shadow-lg",
                        "transition-opacity duration-200",
                        "bg-gray-900"
                      )}
                      width={180}
                      height={180}
                      draggable={false}
                      priority
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
                          "bg-[#1a237e]",
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
              )
            )}
          </div>
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
                addToQueue={() => {}}
                openAddToPlaylistModal={() => {}}
                toggleLike={toggleLike}
                isLiked={isTrackLiked(track)}
                onContextMenu={() => {}}
              />
            ))
          ) : (
            <p className="text-gray-400">No recommendations available.</p>
          )}
        </div>
      </section>
    </>
  );
};

/* =================================
   7. SEARCH DRAWER
   ================================= */
const SearchDrawer: React.FC<{
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  view: string;
  setView: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  handleSearch: (q: string) => void;
  searchType: string;
  setSearchType: (t: string) => void;
  recentSearches: string[];
  setRecentSearches: (arr: string[]) => void;
  searchResults: Track[];
  playTrack: (t: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
}> = ({
  isSearchOpen,
  setIsSearchOpen,
  view,
  setView,
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchType,
  setSearchType,
  recentSearches,
  setRecentSearches,
  searchResults,
  playTrack,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}) => {
  if (!isSearchOpen || view !== "search") return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 500 }}
      className="fixed inset-0 bg-black z-[10000] flex flex-col"
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length > 3) {
                handleSearch(e.target.value);
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
          {/* Extend if more categories (playlists, artists, etc.) */}
        </div>
      </div>

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white/90">Recent Searches</h3>
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
                    const upd = recentSearches.filter((_, i2) => i2 !== idx);
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
              <p className="text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 gap-4">
                {searchResults.map((res, idx) => (
                  <TrackItem
                    key={res.id}
                    track={res}
                    index={idx}
                    addToQueue={() => {}}
                    openAddToPlaylistModal={() => {}}
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
  );
};

/* =================================
   8. FOOTER NAV
   ================================= */
   const FooterNav = ({ 
    isPlayerOpen, 
    setView, 
    setIsSearchOpen, 
    setSearchQuery 
  }: {
    isPlayerOpen: boolean;
    setView: (v: string) => void;
    setIsSearchOpen: (v: boolean) => void;
    setSearchQuery: (q: string) => void;
  }) => {
    const [isMobileSmall, setIsMobileSmall] = useState(false);
  
    // Check screen size on mount and resize
    useEffect(() => {
      const checkScreenSize = () => {
        setIsMobileSmall(window.innerWidth <= 375); // iPhone SE width
      };
  
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
  
    if (isPlayerOpen) return null;
  
    const navItems = [
      {
        icon: Home,
        label: "Home",
        onClick: () => {
          setView("home");
          setSearchQuery("");
        },
      },
      {
        icon: Search,
        label: "Search",
        onClick: () => {
          setIsSearchOpen(true);
          setView("search");
        },
      },
      {
        icon: Library,
        label: "Library",
        onClick: () => setView("library"),
      },
      {
        icon: Cog,
        label: "Setting",
        onClick: () => setView("settings"),
      },
      // You can add more items here and they'll be scrollable
    ];
  
    return (
      <footer
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex items-center py-3 min-w-full">
              {navItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center flex-1 min-w-[80px] px-2 text-gray-300 hover:text-white transition-colors"
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  {!isMobileSmall && (
                    <span className="text-xs font-medium truncate w-full text-center">
                      {item.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  };
  
/* =================================
   9. MAIN MOBILE LAYOUT
   ================================= */
const MobileLayout: React.FC<MobileLayoutProps> = (props) => {
  const {
    greeting,
    showSettingsMenu,
    setShowSettingsMenu,
    showPwaModal,
    setShowPwaModal,
    view,
    storeSetting,
    // Category Nav
    // Settings
    volume,
    onVolumeChange,
    audioQuality,
    setAudioQuality,
    // Playlist
    currentPlaylist,
    setQueue,
    setCurrentTrack,
    setIsPlaying,
    shuffleQueue,
    downloadPlaylist,
    isDownloading,
    downloadProgress,
    playlistSearchQuery,
    setPlaylistSearchQuery,
    playlistSearchResults,
    handlePlaylistSearch,
    addTrackToPlaylist,
    playTrack,
    toggleLike,
    isTrackLiked,
    handleContextMenu,
    // Library
    sidebarCollapsed,
    setShowCreatePlaylist,
    playlists,
    setPlaylists,
    storePlaylist,
    deletePlaylistByName,
    jumpBackIn,
    recommendedTracks,
    // Home
    searchResults,
    // Search Drawer
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    handleSearch,
    searchType,
    setSearchType,
    recentSearches,
    setRecentSearches,
    // Footer Nav
    isPlayerOpen,
    changeAudioQuality,
    setView,
  } = props;

  return (
    <div className="md:hidden flex flex-col h-[100dvh]">
      {/* Header */}
      <Header
        greeting={greeting}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        showPwaModal={showPwaModal}
        setShowPwaModal={setShowPwaModal}
        setView={setView}
        storeSetting={storeSetting}
      />

      {/* Views */}
      {view === "settings" ? (
        <SettingsView
          volume={volume}
          onVolumeChange={onVolumeChange}
          audioQuality={audioQuality}
          setAudioQuality={async (q) => {
            setAudioQuality(q); 
            await storeSetting("audioQuality", q);
            await changeAudioQuality(q);
            }}
          storeSetting={storeSetting}
        />
      ) : (
        <>
          {view !== "playlist" && view !== "library" && <CategoryNav />}
          <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(4rem+2rem+env(safe-area-inset-bottom))]">
            {view === "playlist" && currentPlaylist ? (
              <PlaylistView
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
                toggleLike={toggleLike}
                isTrackLiked={isTrackLiked}
                handleContextMenu={handleContextMenu}
              />
            ) : view === "library" ? (
              <LibraryView
                playlists={playlists}
                sidebarCollapsed={sidebarCollapsed}
                setShowCreatePlaylist={setShowCreatePlaylist}
                setPlaylists={setPlaylists}
                storePlaylist={storePlaylist}
                deletePlaylistByName={deletePlaylistByName}
                handleContextMenu={handleContextMenu}
                openPlaylist={(p) => {
                  props.openPlaylist(p);
                }}
                downloadPlaylist={downloadPlaylist}
              />
            ) : (
              <HomeView
                playlists={playlists}
                jumpBackIn={jumpBackIn}
                recommendedTracks={recommendedTracks}
                setPlaylists={setPlaylists}
                storePlaylist={storePlaylist}
                setView={setView}
                playTrack={playTrack}
                toggleLike={toggleLike}
                isTrackLiked={isTrackLiked}
                searchResults={searchResults}
              />
            )}
          </main>
        </>
      )}

      <SearchDrawer
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        view={view}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchType={searchType}
        setSearchType={setSearchType}
        recentSearches={recentSearches}
        setRecentSearches={setRecentSearches}
        searchResults={searchResults}
        playTrack={playTrack}
        toggleLike={toggleLike}
        isTrackLiked={isTrackLiked}
        handleContextMenu={handleContextMenu}
      />

      {/* Footer Nav */}
      <FooterNav
        isPlayerOpen={isPlayerOpen}
        setView={setView}
        setIsSearchOpen={setIsSearchOpen}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
};

export default MobileLayout;
