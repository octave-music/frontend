/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode } from "react";
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

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils/utils";

// Common Components
import TrackItem from "../common/TrackItem";
import CustomContextMenu from "../common/CustomContextMenu";

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
  // Context Menu
  showContextMenu: boolean;
  setShowContextMenu: (show: boolean) => void;
  contextMenuPosition: Position;
  setContextMenuPosition: (position: Position) => void;
  contextMenuOptions: ContextMenuOption[];
  setContextMenuOptions: (options: ContextMenuOption[]) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  playlists: Playlist[];
  setPlaylists: (playlists: Playlist[]) => void;
  setView: (view: ViewType) => void;
  openPlaylist: (playlist: Playlist) => void;
  storePlaylist: (playlist: Playlist) => Promise<void>;
  deletePlaylistByName: (name: string) => Promise<Playlist[]>;

  // Main Content
  view: ViewType;
  greeting: string;
  mounted: boolean;
  setShowPwaModal: (show: boolean) => void;
  showPwaModal: boolean;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  setShowSpotifyToDeezerModal: (show: boolean) => void;

  // Playlist View
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

  // Track Management
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

  // Download Management
  downloadPlaylist: (playlist: Playlist) => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  handleSearch: (query: string) => void;
  fetchSearchResults: (query: string) => void;
  searchResults: Track[];
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;

  // Queue
  showQueue: boolean;
  queue: Track[];
  previousTracks: Track[];
  onQueueItemClick: (track: Track, idx: number) => void;

  // Audio
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void;
  storeSetting: (key: string, value: any) => Promise<void>;

  // Recommendations
  jumpBackIn: Track[];
  recommendedTracks: Track[];
  handleUnpinPlaylist: (playlist: Playlist) => void;

  children?: ReactNode;
}

const DesktopLayout = ({
  // Context Menu
  showContextMenu,
  setShowContextMenu,
  contextMenuPosition,
  setContextMenuPosition,
  contextMenuOptions,
  setContextMenuOptions,

  // Sidebar
  sidebarCollapsed,
  setSidebarCollapsed,
  playlists,
  setPlaylists,
  setView,
  openPlaylist,
  storePlaylist,
  deletePlaylistByName,

  // Main Content
  view,
  greeting,
  mounted,
  setShowPwaModal,
  showPwaModal,
  showUserMenu,
  setShowUserMenu,
  setShowSpotifyToDeezerModal,

  // Playlist View
  currentPlaylist,
  playlistSearchQuery,
  setPlaylistSearchQuery,
  handlePlaylistSearch,
  playlistSearchResults,
  setPlaylistSearchResults,
  addTrackToPlaylist,
  setShowCreatePlaylist,
  handleUnpinPlaylist,

  // Track Management
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
  shuffleQueue,

  // Download Management
  downloadPlaylist,
  isDownloading,
  downloadProgress,

  // Search
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  fetchSearchResults,
  searchResults,
  recentSearches,
  setRecentSearches,

  // Queue
  showQueue,
  queue,
  previousTracks,
  onQueueItemClick,

  // Audio
  volume,
  onVolumeChange,
  audioQuality,
  setAudioQuality,
  storeSetting,

  // Recommendations
  jumpBackIn,
  recommendedTracks,
}: DesktopLayoutProps) => {
  return (
    <div className="hidden md:flex flex-1 bg-[#0A0A0A] p-2 gap-2 relative">
      {/* Context Menu */}
      {showContextMenu && (
        <CustomContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onClose={() => setShowContextMenu(false)}
          options={contextMenuOptions}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "relative h-full bg-gradient-to-b from-gray-900/95 to-black/95",
          "transition-all duration-300 ease-in-out rounded-xl shadow-xl",
          "border border-white/[0.02] backdrop-blur-xl",
          sidebarCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {/* Collapse/Expand Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "absolute -right-2.5 top-6 w-5 h-10 flex items-center justify-center",
            "bg-white/[0.03] rounded-full border border-white/[0.02]",
            "hover:bg-white/[0.06] transition-all duration-200 backdrop-blur-xl"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex flex-col h-full">
          <div className="flex flex-col gap-1 p-3">
            {[
              { icon: Home, label: "Home", action: () => setView("home") },
              { icon: Search, label: "Search", action: () => setView("search") },
            ].map((item) => {
              const isActive = view === item.label.toLowerCase();
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    "group relative flex items-center px-3 py-2.5 rounded-lg",
                    "hover:bg-white/[0.06] transition-all duration-200",
                    sidebarCollapsed ? "justify-center" : "justify-start",
                    isActive && "bg-white/[0.08]"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-white" : "text-gray-400",
                      "transition-colors"
                    )}
                  />
                  {!sidebarCollapsed && (
                    <span
                      className={cn(
                        "ml-3 text-sm font-medium",
                        isActive ? "text-white" : "text-gray-400"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-white/[0.04] mx-3" />

          {/* Your Library */}
          <div className="flex flex-col flex-1 min-h-0 p-3">
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "flex items-center gap-3",
                  sidebarCollapsed && "mx-auto"
                )}
              >
                <Library className="w-5 h-5 text-gray-400" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium text-gray-400">
                    Your Library
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Playlists */}
            <div className="overflow-y-auto flex-1 pr-1 -mr-1 custom-scrollbar">
              <div className="space-y-1">
                {playlists.map((pl) => (
                  <div
                    key={pl.name}
                    onClick={() => openPlaylist(pl)}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                      "hover:bg-white/[0.06] transition-colors duration-200",
                      pl.pinned && "bg-white/[0.03]",
                      sidebarCollapsed && "justify-center"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Image
                        src={pl.image || "/images/defaultPlaylistImage.png"}
                        alt={pl.name}
                        width={sidebarCollapsed ? 40 : 44}
                        height={sidebarCollapsed ? 40 : 44}
                        className="rounded-md object-cover"
                        priority
                      />
                      {pl.downloaded && (
                        <div className="absolute -top-1 -right-1 bg-green-500/90 rounded-full p-0.5">
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
                          <p className="text-xs text-gray-500 truncate">
                            {pl.tracks.length} tracks
                          </p>
                        </div>

                        <button
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/[0.08] transition-all"
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
                                  void Promise.all(
                                    updated.map((item) => storePlaylist(item))
                                  );
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
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
      <div className="flex-1 bg-gradient-to-b from-gray-900/95 to-black/95 rounded-xl border border-white/[0.02] backdrop-blur-xl">
      {/* HEADER */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
              {greeting}
            </h1>
            <div className="relative flex items-center gap-2">
              {/* Install PWA Button */}
              {mounted &&
                !(
                  window.matchMedia &&
                  window.matchMedia("(display-mode: standalone)").matches
                ) && (
                  <button
                    onClick={() => {
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
                    className={cn(
                      "flex items-center gap-2",
                      "bg-indigo-600/90 text-white px-4 py-2 rounded-full",
                      "text-sm font-medium transition-all duration-200",
                      "hover:bg-indigo-700/90 active:scale-95"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-9 h-9 rounded-full ring-2 ring-white/[0.06] overflow-hidden transition-transform active:scale-95"
                >
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src="https://i.pinimg.com/236x/fb/7a/17/fb7a17e227af3cf2e63c756120842209.jpg"
                      alt="User"
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </button>

                {showUserMenu && (
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-56 bg-gray-900/95",
                      "backdrop-blur-xl rounded-xl border border-white/[0.02]",
                      "shadow-xl divide-y divide-white/[0.04]",
                      "animate-in fade-in slide-in-from-top-2 duration-200"
                    )}
                  >
                    <button
                      onClick={() => {
                        setView("settings");
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Cog className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => setShowSpotifyToDeezerModal(true)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Migrate Playlists</span>
                    </button>

                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT SWITCHER */}
          <div className="h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar px-6 pb-6">
          {view === "settings" ? (
              <SettingsView
                volume={volume}
                onVolumeChange={onVolumeChange}
                audioQuality={audioQuality}
                setAudioQuality={setAudioQuality}
                storeSetting={storeSetting}
              />
            ) : view === "playlist" && currentPlaylist ? (
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
                handlePlaylistSearch={handlePlaylistSearch}
                playlistSearchResults={playlistSearchResults}
                setPlaylistSearchResults={setPlaylistSearchResults}
                addTrackToPlaylist={addTrackToPlaylist}
                toggleLike={toggleLike}
                isTrackLiked={isTrackLiked}
                playTrack={playTrack}
                addToQueue={addToQueue}
                openAddToPlaylistModal={openAddToPlaylistModal}
                handleContextMenu={handleContextMenu}
              />
            ) : view === "search" ? (
              <SearchView
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchType={searchType}
                setSearchType={setSearchType}
                handleSearch={handleSearch}
                fetchSearchResults={fetchSearchResults}
                searchResults={searchResults}
                recentSearches={recentSearches}
                setRecentSearches={setRecentSearches}
                playTrack={playTrack}
                addToQueue={addToQueue}
                openAddToPlaylistModal={openAddToPlaylistModal}
                toggleLike={toggleLike}
                isTrackLiked={isTrackLiked}
                handleContextMenu={handleContextMenu}
              />
            ) : (
              <HomeView
                playlists={playlists}
                openPlaylist={openPlaylist}
                handleUnpinPlaylist={handleUnpinPlaylist}
                jumpBackIn={jumpBackIn}
                playTrack={playTrack}
                recommendedTracks={recommendedTracks}
                addToQueue={addToQueue}
                openAddToPlaylistModal={openAddToPlaylistModal}
                toggleLike={toggleLike}
                isTrackLiked={isTrackLiked}
                handleContextMenu={handleContextMenu}
              />
            )}
          </div>
        </div>
      </main>

      {/* PWA Modal */}
      {showPwaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999999] transition-all duration-300 animate-fadeIn">
          <div className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl border border-[#1e3a5f] animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#90caf9]">Install App</h2>
              <button
                onClick={() => setShowPwaModal(false)}
                className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                Install this app on your device for the best experience:
              </p>

              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#90caf9] rounded-full" />
                  Faster access to your music
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#90caf9] rounded-full" />
                  Offline playback support
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#90caf9] rounded-full" />
                  Native app-like experience
                </li>
              </ul>

              <p className="text-sm text-gray-400">
                Look for the install icon in your browser's address bar or use
                the install button above.
              </p>
            </div>

            <button
              onClick={() => setShowPwaModal(false)}
              className="mt-6 w-full px-6 py-3 bg-[#1a237e] text-white rounded-lg transition-all duration-300 hover:bg-[#283593] active:scale-95"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Queue Section */}
      {showQueue && (
          <aside className="w-80 h-full bg-gradient-to-b from-gray-900/95 to-black/95 rounded-xl border border-white/[0.02] backdrop-blur-xl">
          <div className="h-full flex flex-col p-4">
            <h2 className="text-xl font-bold mb-4 text-white">Queue</h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {queue.length === 0 && previousTracks.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400">Your queue is empty.</p>
              <button
                className={cn(
                  "w-full px-4 py-2 bg-white/[0.03] text-white rounded-lg",
                  "border border-white/[0.04] text-sm font-medium transition-colors",
                  "hover:bg-white/[0.04]"
                )}
              >
                Add Suggestions
              </button>
            </div>
          ) : (
            <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-full pr-2">
              {previousTracks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Previous Tracks
                  </h3>
                  <div className="space-y-1">
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
                </div>
              )}

              {queue.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Up Next
                  </h3>
                  <div className="space-y-1">
                    {queue.map((track, idx) => (
                      <TrackItem
                        key={`queue-${track.id}`}
                        track={track}
                        index={idx}
                        onTrackClick={onQueueItemClick}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};

export default DesktopLayout;


// SETTINGS VIEW
function SettingsView({
  volume,
  onVolumeChange,
  audioQuality,
  setAudioQuality,
  storeSetting,
}: {
  volume: number;
  onVolumeChange: (v: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (q: AudioQuality) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
}) {
  return (
    <section
      className="max-w-4xl mx-auto pb-32"
    >      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <div className="flex items-center space-x-2 bg-purple-600/10 text-purple-400 px-4 py-2 rounded-full">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Pro Account</span>
        </div>
      </div>
      <div className="space-y-6">
        {/* Account */}
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

        {/* Playback */}
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
            {/* Default Volume */}
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
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className={cn(
                  "w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full",
                  "[&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-purple-400 [&::-webkit-slider-thumb]:transition-colors"
                )}
              />
            </div>

            {/* Audio Quality */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                Audio Quality
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["MAX", "HIGH", "NORMAL", "DATA_SAVER"].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      void storeSetting("musicQuality", quality);
                      setAudioQuality(quality as AudioQuality);
                    }}
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all duration-200",
                      audioQuality === quality
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                    )}
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
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Saver */}
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
                <p className="text-gray-400">Currently set to: {audioQuality}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div
                className={cn(
                  "w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4",
                  "peer-focus:ring-purple-500/25 rounded-full peer",
                  "peer-checked:after:translate-x-full peer-checked:after:border-white",
                  "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full",
                  "after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"
                )}
              ></div>
            </label>
          </div>
        </div>

        {/* Extra Setting Cards */}
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
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// PLAYLIST VIEW
function PlaylistView({
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
  handlePlaylistSearch,
  playlistSearchResults,
  setPlaylistSearchResults,
  addTrackToPlaylist,
  toggleLike,
  isTrackLiked,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  handleContextMenu,
}: {
  currentPlaylist: Playlist;
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  shuffleQueue: () => void;
  downloadPlaylist: (playlist: Playlist) => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (query: string) => void;
  handlePlaylistSearch: (query: string) => void;
  playlistSearchResults: Track[];
  setPlaylistSearchResults: (results: Track[]) => void;
  addTrackToPlaylist: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
}) {
  return (
    <section className="min-h-screen">
      <div className="h-[45vh] relative rounded-xl mb-8">
        <div className="absolute inset-0">
          <Image
            src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
            alt={currentPlaylist.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-6">
              <Image
                src={
                  currentPlaylist.image || "/images/defaultPlaylistImage.png"
                }
                alt={currentPlaylist.name}
                width={180}
                height={180}
                className="rounded-xl shadow-2xl ring-1 ring-white/[0.06]"
                priority
              />

              <div className="flex-1">
                <span className="text-white/80 text-sm font-medium mb-2 tracking-wide">
                  PLAYLIST
                </span>
                <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">
                  {currentPlaylist.name}
                </h2>
                <p className="text-white/80 text-sm">
                  {currentPlaylist.tracks.length} tracks
                </p>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => {
                      setQueue(currentPlaylist.tracks);
                      setCurrentTrack(currentPlaylist.tracks[0]);
                      setIsPlaying(true);
                    }}
                    className={cn(
                      "flex items-center gap-2",
                      "bg-white text-gray-900 px-8 py-3 rounded-full",
                      "text-sm font-medium transition-all duration-200",
                      "hover:bg-gray-100 active:scale-95"
                    )}
                  >
                    <Play className="w-5 h-5" />
                    <span>Play All</span>
                  </button>

                  <button
                    onClick={shuffleQueue}
                    className={cn(
                      "flex items-center gap-2",
                      "bg-white/[0.06] text-white px-6 py-3 rounded-full",
                      "text-sm font-medium transition-all duration-200",
                      "hover:bg-white/[0.08] active:scale-95"
                    )}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={() => downloadPlaylist(currentPlaylist)}
                    className={cn(
                      "flex items-center gap-2",
                      "bg-white/[0.06] text-white px-6 py-3 rounded-full",
                      "text-sm font-medium transition-all duration-200",
                      "hover:bg-white/[0.08] active:scale-95"
                    )}
                  >
                    {isDownloading ? (
                      <div className="flex items-center gap-2">
                        <Download
                          className={
                            downloadProgress === 100 ? "text-green-500" : ""
                          }
                        />
                        <span>{downloadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
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

      {/* SEARCH & TRACKS */}
      <div className="max-w-7xl mx-auto">
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
              className={cn(
                "w-full pl-12 pr-12 py-4 bg-white/[0.03] text-white placeholder-gray-400",
                "rounded-xl border border-white/[0.04] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
                "transition-all duration-200"
              )}
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

          {/* Playlist Search Results */}
          {playlistSearchResults.length > 0 && (
            <div
              className={cn(
                "mt-4 max-w-2xl bg-white/[0.03] backdrop-blur-xl rounded-xl",
                "border border-white/[0.04] divide-y divide-white/[0.04] shadow-xl",
                "animate-in fade-in slide-in-from-top-2 duration-200"
              )}
            >
              {playlistSearchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={
                        track.album.cover_small ||
                        "/images/defaultSongImage.png"
                      }
                      alt={track.title}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
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
                    className={cn(
                      "flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg",
                      "text-sm font-medium transition-all duration-200 hover:bg-green-500 hover:text-white active:scale-95"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playlist Tracks */}
        <div className="space-y-1">
          {currentPlaylist.tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Music className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">This playlist is empty</p>
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
  );
}

// SEARCH VIEW
function SearchView({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  fetchSearchResults,
  searchResults,
  recentSearches,
  setRecentSearches,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchType: string;
  setSearchType: (t: string) => void;
  handleSearch: (q: string) => void;
  fetchSearchResults: (q: string) => void;
  searchResults: Track[];
  recentSearches: string[];
  setRecentSearches: (arr: string[]) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
}) {
  return (
    <section className="min-h-screen backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* SEARCH HEADER */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <h1
            className={cn(
              "text-4xl md:text-5xl font-bold text-center",
              "bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text",
              "animate-gradient"
            )}
          >
            Discover Your Music
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) handleSearch(searchQuery);
            }}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors" />
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
                className={cn(
                  "w-full px-14 py-4 rounded-full bg-white/[0.03] backdrop-blur-xl",
                  "text-white placeholder-gray-400 border border-white/[0.04]",
                  "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-[15px]",
                  "transition-all duration-200 hover:bg-white/[0.04]"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    fetchSearchResults("");
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex gap-3">
            <button
              onClick={() => setSearchType("tracks")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                searchType === "tracks"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                  : "bg-white/[0.03] text-white hover:bg-white/[0.04] border border-white/[0.04]"
              )}
            >
              Tracks
            </button>
          </div>
        </div>

        {/* RECENT SEARCHES */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white/90">
                Recent Searches
              </h3>
              <button
                onClick={() => setRecentSearches([])}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500/90 rounded-lg hover:bg-red-600/90 transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid gap-2">
              {recentSearches.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.04] transition-colors"
                >
                  <button
                    onClick={() => {
                      setSearchQuery(q);
                      fetchSearchResults(q);
                    }}
                    className="flex items-center gap-4 text-left"
                  >
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">{q}</span>
                  </button>
                  <button
                    onClick={() => {
                      const upd = recentSearches.filter((_, i2) => i2 !== i);
                      setRecentSearches(upd);
                    }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
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
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
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
  );
}

// HOME VIEW
function HomeView({
  playlists,
  openPlaylist,
  handleUnpinPlaylist,
  jumpBackIn,
  playTrack,
  recommendedTracks,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}: {
  playlists: Playlist[];
  openPlaylist: (pl: Playlist) => void;
  handleUnpinPlaylist: (pl: Playlist) => void;
  jumpBackIn: Track[];
  playTrack: (t: Track) => void;
  recommendedTracks: Track[];
  addToQueue: (t: Track) => void;
  openAddToPlaylistModal: (t: Track) => void;
  toggleLike: (t: Track) => void;
  isTrackLiked: (t: Track) => boolean;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
}) {
  const pinnedPlaylists = playlists.filter((pl) => pl.pinned);

  return (
    <>
      {pinnedPlaylists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Pinned Playlists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedPlaylists.map((pl, i) => (
              <div
                key={i}
                onClick={() => openPlaylist(pl)}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer",
                  "bg-white/[0.03] hover:bg-white/[0.04] border border-white/[0.04]",
                  "transition-all duration-200"
                )}
              >
                <Image
                  src={pl.image || "/images/defaultPlaylistImage.png"}
                  alt={pl.name}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                  priority
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white truncate">
                    {pl.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {pl.tracks.length} tracks
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnpinPlaylist(pl);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white/[0.08] transition-all"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jump Back In */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Jump Back In</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {jumpBackIn.map((track, i) => (
            <div key={i} className="group relative flex flex-col">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                <Image
                  src={track.album.cover_medium || "/images/defaultSongImage.png"}
                  alt={track.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => playTrack(track)}
                  className={cn(
                    "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 text-white",
                    "flex items-center justify-center transform translate-y-4 opacity-0",
                    "group-hover:translate-y-0 group-hover:opacity-100",
                    "transition-all duration-200 hover:scale-105 hover:bg-green-400"
                  )}
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-medium text-sm text-white line-clamp-1">
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

      {/* Recommended for You */}
      <section className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-white">
      Recommended for you
        </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
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
  );
}
