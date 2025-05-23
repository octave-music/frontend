// src/components/mobile/MobileLayout.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Track, Playlist, Lyric, ContextMenuOption } from "@/lib/types/types"; // Adjust path
import type { AudioQuality, RepeatMode } from "./types";

// Import your new components
import Header from "./Header";
import SettingsView from "./SettingsView";
import CategoryNav from "./CategoryNav";
import PlaylistView from "./PlaylistView";
import LibraryView from "./LibraryView";
import HomeView from "./HomeView";
import SearchDrawer from "./SearchDrawer";
import FooterNav from "./FooterNav";

// Keep original MobileLayoutProps
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
  mounted: boolean; // Keep if used for conditional rendering not shown, otherwise can remove
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
  setAudioQuality: (quality: AudioQuality) => void; // The state setter
  storeSetting: (key: string, value: any) => Promise<void>;
  setPlaylistSearchResults: (tracks: Track[]) => void;  
  setShowSearchInPlaylistCreation?: (value: boolean) => void;
  setShowCreatePlaylist: (value: boolean) => void;
  sidebarCollapsed: boolean; // This prop might need reconsideration for mobile
  setSidebarCollapsed: (value: boolean) => void; // This prop might need reconsideration for mobile
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
  toggleLikeMobile: (track: Track) => void; // Is this different from toggleLike?
  setIsPlayerOpen: (value: boolean) => void; // Keep if used by a component not refactored yet
  setContextMenuPosition: (position: { x: number; y: number }) => void; // For custom context menu
  setContextMenuOptions: (options: ContextMenuOption[]) => void; // For custom context menu
  setShowContextMenu: (value: boolean) => void; // For custom context menu
  isSearchOpen: boolean;
  setSearchType: (type: string) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void; // Keep if used
  openPlaylist: (playlist: Playlist) => void;
  currentTrack: Track | null; // For player state, if player UI is part of this layout
  isPlaying: boolean; // For player state
  togglePlay: () => void; // Player control
  skipTrack: () => void; // Player control
  previousTrackFunc: () => void; // Player control
  handleSeek: (position: number) => void; // Player control
  shuffleOn: boolean; // Player state
  changeAudioQuality: (quality: AudioQuality) => Promise<void>; // Effectful change
};

const MobileLayout: React.FC<MobileLayoutProps> = (props) => {
  const {
    greeting, showSettingsMenu, setShowSettingsMenu, showPwaModal, setShowPwaModal,
    view, storeSetting, volume, onVolumeChange, audioQuality, setAudioQuality,
    currentPlaylist, setQueue, setCurrentTrack, setIsPlaying, shuffleQueue,
    downloadPlaylist, isDownloading, downloadProgress, playlistSearchQuery,
    setPlaylistSearchQuery, playlistSearchResults, handlePlaylistSearch,
    addTrackToPlaylist, playTrack, toggleLike, isTrackLiked, handleContextMenu,
    sidebarCollapsed, setShowCreatePlaylist, playlists, setPlaylists, storePlaylist,
    deletePlaylistByName, jumpBackIn, recommendedTracks, searchResults: homeSearchResults, // aliasing to avoid clash
    isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, handleSearch,
    searchType, setSearchType, recentSearches, setRecentSearches, searchResults: drawerSearchResults, // aliasing
    isPlayerOpen, changeAudioQuality, setView, openPlaylist, addToQueue, openAddToPlaylistModal,
  } = props;

  // Consolidate toggleLike logic if toggleLikeMobile is just an alias or specific version
  const resolvedToggleLike = props.toggleLikeMobile || props.toggleLike;


  return (
    <div className="md:hidden flex flex-col h-[100dvh] bg-black text-white"> {/* Ensure base bg and text color */}
      <Header
        greeting={greeting}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        showPwaModal={showPwaModal}
        setShowPwaModal={setShowPwaModal}
        setView={setView}
        storeSetting={storeSetting}
      />

      {view === "settings" ? (
        <SettingsView
          volume={volume}
          onVolumeChange={onVolumeChange}
          audioQuality={audioQuality}
          setAudioQuality={async (q) => { // This is the prop for SettingsView
            setAudioQuality(q); // Calls the setAudioQuality from MobileLayoutProps (the state setter)
            await storeSetting("audioQuality", q); // Store setting for "audioQuality"
            await changeAudioQuality(q); // Call the effectful function
          }}
          storeSetting={storeSetting} // Pass storeSetting for "musicQuality"
        />
      ) : (
        <>
          {/* CategoryNav shown on home, and potentially other views but not playlist/library details */}
          {view !== "playlist" && view !== "library" && view !== "search" && <CategoryNav />}
          
          {/* Main content area with padding and scroll */}
          {/* The pb is crucial to ensure content doesn't hide behind FooterNav */}
          <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[calc(60px+1rem+env(safe-area-inset-bottom))]">
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
                toggleLike={resolvedToggleLike}
                isTrackLiked={isTrackLiked}
                handleContextMenu={handleContextMenu}
              />
            ) : view === "library" ? (
              <LibraryView
                playlists={playlists}
                sidebarCollapsed={sidebarCollapsed} // Review if this prop is needed for mobile
                setShowCreatePlaylist={setShowCreatePlaylist}
                setPlaylists={setPlaylists}
                storePlaylist={storePlaylist}
                deletePlaylistByName={deletePlaylistByName}
                handleContextMenu={handleContextMenu}
                openPlaylist={openPlaylist}
                downloadPlaylist={downloadPlaylist}
              />
            ) : view === "home" ? ( // Explicitly check for home, default otherwise
              <HomeView
                playlists={playlists}
                jumpBackIn={jumpBackIn}
                recommendedTracks={recommendedTracks}
                setPlaylists={setPlaylists}
                storePlaylist={storePlaylist}
                playTrack={playTrack}
                toggleLike={resolvedToggleLike}
                isTrackLiked={isTrackLiked}
                searchResults={homeSearchResults} // Fallback for jump back in
                handleContextMenu={handleContextMenu}
                addToQueue={addToQueue}
                openAddToPlaylistModal={openAddToPlaylistModal}
              />
            ) : null /* Add other views or a default fallback here if necessary */ }
          </main>
        </>
      )}

      <SearchDrawer
        isSearchOpen={isSearchOpen && view === "search"} // Control visibility strictly
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
        searchResults={drawerSearchResults}
        playTrack={playTrack}
        toggleLike={resolvedToggleLike}
        isTrackLiked={isTrackLiked}
        handleContextMenu={handleContextMenu}
        addToQueue={addToQueue}
        openAddToPlaylistModal={openAddToPlaylistModal}
      />

      <FooterNav
        isPlayerOpen={isPlayerOpen}
        view={view}
        setView={setView}
        setIsSearchOpen={setIsSearchOpen}
      />
    </div>
  );
};

export default MobileLayout;