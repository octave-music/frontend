/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";

// Icons
import {
  Home,
  Search,
  Library,
  Bell,
  Cog,
  Clock,
  Play,
  Shuffle,
  Plus,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  MoreVertical,
  Music,
  User,
  Shield,
  Beaker,
  Volume2,
  Check,
  Wifi,
  UploadCloud,
} from "lucide-react";

import TrackItem from "../common/TrackItem";
import CustomContextMenu from "../common/CustomContextMenu"; // You'll need to create this component
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"

// Utilities
import { cn } from "@/lib/utils/utils";
import Image from "next/image";


// Types
import type { Track, Playlist } from "@/lib/types/types";

interface ContextMenuOption {
  label: string;
  action: () => void;
}

interface Position {
  x: number;
  y: number;
}

type AudioQuality = "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER";
type ViewType = "search" | "home" | "playlist" | "settings" | "library";

interface DesktopLayoutProps {
  // Context Menu Props
  showContextMenu: boolean;
  setShowContextMenu: (show: boolean) => void;
  contextMenuPosition: Position;
  setContextMenuPosition: (position: Position) => void;
  contextMenuOptions: ContextMenuOption[];
  setContextMenuOptions: (options: ContextMenuOption[]) => void;

  // Sidebar Props
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  setView: (view: ViewType) => void;
  openPlaylist: (playlist: Playlist) => void;
  storePlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylistByName: (name: string) => Promise<Playlist[]>;

  // Main Content Props
  view: ViewType;
  greeting: string;
  mounted: boolean;
  setShowPwaModal: (show: boolean) => void;
  showPwaModal: boolean;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  setShowSpotifyToDeezerModal: (show: boolean) => void;

  // Playlist View Props
  currentPlaylist: Playlist | null;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (query: string) => void;
  handlePlaylistSearch: (query: string) => void;
  playlistSearchResults: Track[];
  setPlaylistSearchResults: (results: Track[]) => void;
  addTrackToPlaylist: (track: Track) => void;
  setShowSearchInPlaylistCreation: (show: boolean) => void;
  setShowCreatePlaylist: (show: boolean) => void;

  // Track Management Props
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
  shuffleQueue: () => void;

  // Download Management Props
  downloadPlaylist: (playlist: Playlist) => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number;

  // Search Props
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  handleSearch: (query: string) => void;
  fetchSearchResults: (query: string) => void;
  searchResults: Track[];
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;

  // Queue Props
  showQueue: boolean;
  queue: Track[];
  previousTracks: Track[];
  onQueueItemClick: (track: Track, idx: number) => void;

  // Audio Props
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
  // Recommendation Props
  jumpBackIn: Track[];
  recommendedTracks: Track[];

  children?: ReactNode;
  handleUnpinPlaylist: (playlist: Playlist) => void;
}

// DesktopLayout.tsx
const DesktopLayout = ({
  showContextMenu,
  setShowContextMenu,
  contextMenuPosition,
  setContextMenuPosition,
  contextMenuOptions,
  setContextMenuOptions,
  sidebarCollapsed,
  setSidebarCollapsed,
  playlists,
  setPlaylists,
  setView,
  openPlaylist,
  storePlaylist,
  deletePlaylistByName,
  view,
  greeting,
  mounted,
  setShowPwaModal,
  showPwaModal,
  showUserMenu,
  setShowUserMenu,
  setShowSpotifyToDeezerModal,
  currentPlaylist,
  playlistSearchQuery,
  handleUnpinPlaylist,
  setPlaylistSearchQuery,
  handlePlaylistSearch,
  playlistSearchResults,
  setPlaylistSearchResults,
  addTrackToPlaylist,
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  fetchSearchResults,
  searchResults,
  recentSearches,
  setRecentSearches,
  showQueue,
  queue,
  previousTracks,
  onQueueItemClick,
  volume,
  onVolumeChange,
  audioQuality,
  setAudioQuality,
  storeSetting,
  jumpBackIn,
  recommendedTracks,
  setShowCreatePlaylist,
  shuffleQueue,
  downloadPlaylist,
  isDownloading,
  downloadProgress,
}: DesktopLayoutProps) => {
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
          "rounded-r-xl",
          "flex flex-col items-center"
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
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                  <Image 
                    src={pl.image || "/images/defaultPlaylistImage.png"}
                    alt={pl.name}
                    width={sidebarCollapsed ? 40 : 48}
                    height={sidebarCollapsed ? 40 : 48}
                    className="rounded-md object-cover shadow-md"
                    priority
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
                          You can install this as a PWA on desktop or mobile. If
                          your browser supports it, you’ll see an install icon
                          in the address bar or you can use the button above.
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
                <Avatar className="w-full h-full">
                  <AvatarImage src="https://i.pinimg.com/236x/fb/7a/17/fb7a17e227af3cf2e63c756120842209.jpg" alt="User Avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
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
              <Image
                src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
                alt={currentPlaylist.name || "Playlist cover"}
                fill
                className="object-cover"
                priority
              />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/80 to-gray-900"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-12">
                <div className="max-w-7xl mx-auto">
                  <div className="flex items-end space-x-6">
                  <Image
                    src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
                    alt={currentPlaylist.name || "Playlist cover"}
                    width={192}
                    height={192}
                    className="object-cover rounded-xl shadow-2xl"
                    priority
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
                    className="w-[60rem] pl-12 pr-12 py-4 bg-gray-800/30 text-white placeholder-gray-400
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
                        <Image
                          src={track.album.cover_small || "/assets/default-album.jpg"}
                          alt={track.title}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
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
                    <p className="text-gray-400 mb-4">This playlist is empty</p>
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
              <h2 className="text-2xl font-bold mb-4">Pinned Playlists 📌</h2>
              <div className="grid grid-cols-3 gap-4">
                {playlists
                  .filter((pl) => pl.pinned) // Ensure only pinned playlists are displayed
                  .map((pl, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 bg-opacity-40 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => openPlaylist(pl)}
                  >
                    <div className="flex items-center">
                    <Image
                      src={pl.image || "/images/defaultPlaylistImage.png"}
                      alt={pl.name || "Playlist Image"}
                      width={64}
                      height={64}
                      className="rounded mr-4 object-cover"
                    />
                    <span className="font-medium text-white">{pl.name}</span>
                    </div>
                    <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the openPlaylist
                      handleUnpinPlaylist(pl);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    aria-label="Unpin Playlist"
                    >
                    <X className="w-5 h-5" />
                    </button>
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
                    <Image
                      src={track.album.cover_medium || "/images/defaultSongImage.png"}
                      alt={track.title || "No Track Found"}
                      fill
                      className={cn(
                        "object-cover",
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
                  <p className="text-gray-400">No recommendations available.</p>
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

export default DesktopLayout;
