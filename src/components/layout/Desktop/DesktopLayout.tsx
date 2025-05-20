// src/components/layout/Desktop/DesktopLayout.tsx
import React, { ReactNode } from "react"
import { X } from "lucide-react"
import CustomContextMenu from "../../common/CustomContextMenu"

import Sidebar from "./SideBar"
import TopHeader from "./TopHeader"
import SettingsView from "./SettingsView"
import PlaylistView from "./PlaylistView"
import SearchView from "./SearchView"
import HomeView from "./HomeView"
import QueuePanel from "./QueuePanel"

// app-wide types
import type { Track, Playlist } from "@/lib/types/types"
// desktop-layout–specific types
import type {
  Position,
  ContextMenuOption,
  ViewType,
  AudioQuality,
} from "./types"

interface DesktopLayoutProps {
  // Context menu
  showContextMenu: boolean
  setShowContextMenu: (show: boolean) => void
  contextMenuPosition: Position
  setContextMenuPosition: (pos: Position) => void
  contextMenuOptions: ContextMenuOption[]
  setContextMenuOptions: (opts: ContextMenuOption[]) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  view: ViewType
  setView: (v: ViewType) => void
  playlists: Playlist[]
  setPlaylists: (pl: Playlist[]) => void
  openPlaylist: (p: Playlist) => void
  storePlaylist: (p: Playlist) => Promise<void>
  deletePlaylistByName: (name: string) => Promise<Playlist[]>
  setShowCreatePlaylist: (v: boolean) => void

  // Top header
  greeting: string
  mounted: boolean
  showPwaModal: boolean
  setShowPwaModal: (v: boolean) => void
  showUserMenu: boolean
  setShowUserMenu: (v: boolean) => void
  setShowSpotifyToDeezerModal: (v: boolean) => void

  // Playlist view
  currentPlaylist: Playlist | null
  playlistSearchQuery: string
  setPlaylistSearchQuery: (q: string) => void
  handlePlaylistSearch: (q: string) => void
  playlistSearchResults: Track[]
  setPlaylistSearchResults: (r: Track[]) => void
  addTrackToPlaylist: (t: Track) => void
  handleUnpinPlaylist: (p: Playlist) => void

  // Playback & track management
  setQueue: (tracks: Track[]) => void
  setCurrentTrack: (t: Track) => void
  setIsPlaying: (playing: boolean) => void
  playTrack: (t: Track) => void
  addToQueue: (t: Track) => void
  openAddToPlaylistModal: (t: Track) => void
  toggleLike: (t: Track) => void
  isTrackLiked: (t: Track) => boolean
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void
  shuffleQueue: () => void

  // Download
  downloadPlaylist: (p: Playlist) => Promise<void>
  isDownloading: boolean
  downloadProgress: number

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchType: string
  setSearchType: (t: string) => void
  handleSearch: (q: string) => void
  fetchSearchResults: (q: string) => void
  searchResults: Track[]
  recentSearches: string[]
  setRecentSearches: (arr: string[]) => void

  // Queue panel
  showQueue: boolean
  queue: Track[]
  previousTracks: Track[]
  onQueueItemClick: (track: Track, idx: number) => void

  // Audio settings
  volume: number
  onVolumeChange: (v: number) => void
  audioQuality: AudioQuality
  setAudioQuality: (q: AudioQuality) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeSetting: (key: string, value: any) => Promise<void>

  // Recommendations
  jumpBackIn: Track[]
  recommendedTracks: Track[]

  children?: ReactNode
}

const DesktopLayout: React.FC<DesktopLayoutProps> = (props) => {
  const {
    // context menu
    showContextMenu,
    setShowContextMenu,
    contextMenuPosition,
    setContextMenuPosition,
    contextMenuOptions,
    setContextMenuOptions,

    // sidebar
    sidebarCollapsed,
    setSidebarCollapsed,
    view,
    setView,
    playlists,
    setPlaylists,
    openPlaylist,
    storePlaylist,
    deletePlaylistByName,
    setShowCreatePlaylist,

    // header
    greeting,
    mounted,
    showPwaModal,
    setShowPwaModal,
    showUserMenu,
    setShowUserMenu,
    setShowSpotifyToDeezerModal,

    // playlist view
    currentPlaylist,
    playlistSearchQuery,
    setPlaylistSearchQuery,
    handlePlaylistSearch,
    playlistSearchResults,
    setPlaylistSearchResults,
    addTrackToPlaylist,
    handleUnpinPlaylist,

    // playback & track mgmt
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

    // download
    downloadPlaylist,
    isDownloading,
    downloadProgress,

    // search
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    handleSearch,
    fetchSearchResults,
    searchResults,
    recentSearches,
    setRecentSearches,

    // queue panel
    showQueue,
    queue,
    previousTracks,
    onQueueItemClick,

    // audio settings
    volume,
    onVolumeChange,
    audioQuality,
    setAudioQuality,
    storeSetting,

    // recommendations
    jumpBackIn,
    recommendedTracks,
  } = props

  return (
    <div className="hidden md:flex flex-1 bg-[#0A0A0A] p-2 gap-2 relative">
      {showContextMenu && (
        <CustomContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onClose={() => setShowContextMenu(false)}
          options={contextMenuOptions}
        />
      )}

      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        view={view}
        setView={setView}
        playlists={playlists}
        setPlaylists={setPlaylists}
        openPlaylist={openPlaylist}
        storePlaylist={storePlaylist}
        deletePlaylistByName={deletePlaylistByName}
        setShowCreatePlaylist={setShowCreatePlaylist}
        setContextMenuPosition={setContextMenuPosition}
        setContextMenuOptions={setContextMenuOptions}
        setShowContextMenu={setShowContextMenu}
      />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 bg-gradient-to-b from-gray-900/95 to-black/95 rounded-xl border border-white/[0.02] backdrop-blur-xl">
          <TopHeader
            greeting={greeting}
            mounted={mounted}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            setShowPwaModal={setShowPwaModal}
            setShowSpotifyToDeezerModal={setShowSpotifyToDeezerModal}
            setView={setView}
          />

          <div className="h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar px-6 pb-6">
            {view === "settings" ? (
              <SettingsView
                volume={volume}
                onVolumeChange={onVolumeChange}
                audioQuality={audioQuality}
                setAudioQuality={(q) => {
                  void storeSetting("audioQuality", q)
                  setAudioQuality(q)
                }}
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

      {showPwaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl border border-[#1e3a5f]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#90caf9]">Install App</h2>
              <button
                onClick={() => setShowPwaModal(false)}
                className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-300 mb-4">
              Install this app on your device for the best experience.
            </p>
            <button
              onClick={() => setShowPwaModal(false)}
              className="w-full px-6 py-3 bg-[#1a237e] rounded-lg text-white hover:bg-[#283593] active:scale-95"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <QueuePanel
        showQueue={showQueue}
        queue={queue}
        previousTracks={previousTracks}
        addToQueue={addToQueue}
        openAddToPlaylistModal={openAddToPlaylistModal}
        toggleLike={toggleLike}
        isTrackLiked={isTrackLiked}
        handleContextMenu={handleContextMenu}
        onQueueItemClick={onQueueItemClick}
      />
    </div>
  )
}

export default DesktopLayout
