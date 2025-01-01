/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion } from 'framer-motion';
import { Portal } from '@radix-ui/react-portal';
import {
  Search,
  Plus,
  X,
  ChevronRight,
  Music,
  FolderPlus,
  ChevronDown,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { SpotifyToDeezer } from '../onboarding/SpotifyToDeezer';
import { ContextMenuOption, Playlist, Track } from '@/lib/types/types'; // Update the import path as necessary
import TrackItem from ".././common/TrackItem";

interface OtherProps {
    // Context Menu
    showContextMenu: boolean;
    contextMenuOptions: ContextMenuOption[];
    contextMenuPosition: { x: number; y: number };
    setShowContextMenu: (value: boolean) => void;
  
    // Spotify to Deezer Modal
    showSpotifyToDeezerModal: boolean;
    setShowSpotifyToDeezerModal: (value: boolean) => void;
  
    // Add to Playlist Modal
    showAddToPlaylistModal: boolean;
    setShowAddToPlaylistModal: (value: boolean) => void;
    playlists: Playlist[];
    selectedPlaylistForAdd: string | null;
    setSelectedPlaylistForAdd: (value: string | null) => void;
    handleAddToPlaylist: () => void;
  
    // Delete Confirmation Modal
    showDeleteConfirmation: boolean;
    setShowDeleteConfirmation: (value: boolean) => void;
    selectedPlaylist: Playlist | null;
    deleteConfirmedPlaylist: () => void;
  
    // Create Playlist Modal
    showCreatePlaylist: boolean;
    setShowCreatePlaylist: (value: boolean) => void;
    newPlaylistName: string;
    setNewPlaylistName: (value: string) => void;
    createPlaylist: () => void;
    newPlaylistImage: string | null;
    setNewPlaylistImage: (value: string | null) => void;
  
    // Search in Playlist Creation
    showSearchInPlaylistCreation: boolean;
    setShowSearchInPlaylistCreation: (value: boolean) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    searchResults: Track[];
    toggleTrackSelection: (track: Track) => void;
    selectedTracksForNewPlaylist: Track[];
    handleContextMenu: (
        evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement, MouseEvent>, 
        item: Track | Playlist
    ) => void;    
    openAddToPlaylistModal: (track: Track) => void;
  }
  
  const OtherModals: React.FC<OtherProps> = ({
    showContextMenu,
    contextMenuOptions,
    contextMenuPosition,
    setShowContextMenu,
    showSpotifyToDeezerModal,
    setShowSpotifyToDeezerModal,
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
    playlists,
    selectedPlaylistForAdd,
    setSelectedPlaylistForAdd,
    handleAddToPlaylist,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    selectedPlaylist,
    deleteConfirmedPlaylist,
    showCreatePlaylist,
    setShowCreatePlaylist,
    newPlaylistName,
    setNewPlaylistName,
    createPlaylist,
    newPlaylistImage,
    setNewPlaylistImage,
    showSearchInPlaylistCreation,
    setShowSearchInPlaylistCreation,
    searchQuery,
    setSearchQuery,
    searchResults,
    toggleTrackSelection,
    selectedTracksForNewPlaylist,
    handleContextMenu,
    openAddToPlaylistModal,
  }) => {
    return (
      <>
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
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ backgroundColor: 'rgba(255,255,255,0.09)' }}
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
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                  {/* Header */}
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

                  {/* Content */}
                  <div className="relative max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <SpotifyToDeezer />
                  </div>
                </div>
              </div>
            </div>
          )}  

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
                value={selectedPlaylistForAdd || "Unkown Value"}
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
  };
  
  export default OtherModals;