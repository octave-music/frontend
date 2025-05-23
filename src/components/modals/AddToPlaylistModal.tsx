// src/components/modals/AddToPlaylistModal.tsx
import React, { useState, useEffect } from 'react';
import { FolderPlus, ChevronDown, ListMusic, ArrowRight } from 'lucide-react';
import { Playlist, Track } from '@/lib/types/types';

interface AddToPlaylistModalProps {
  show: boolean;
  trackToAdd: Track | null; // The track being added
  playlists: Playlist[]; // List of user's playlists
  onClose: () => void;
  onAddToSelectedPlaylist: (track: Track, playlistName: string) => void; // Handler
}

export function AddToPlaylistModal({ 
  show, 
  trackToAdd,
  playlists, 
  onClose, 
  onAddToSelectedPlaylist 
}: AddToPlaylistModalProps) {
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<string>("");

  useEffect(() => {
    // Reset selected playlist when modal opens or track changes
    if (show) {
      setSelectedPlaylistName("");
    }
  }, [show]);

  if (!show || !trackToAdd) return null;

  const handleSubmit = () => {
    if (selectedPlaylistName && trackToAdd) {
      onAddToSelectedPlaylist(trackToAdd, selectedPlaylistName);
      // onClose(); // Parent will call onClose after action
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"> {/* High z-index */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-800 rounded-xl p-5 sm:p-6 w-full max-w-md border border-neutral-700 shadow-xl">
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
            <FolderPlus className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Add to Playlist
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              Add "{trackToAdd.title}" to a playlist
            </p>
          </div>
        </div>
        <div className="relative mb-5">
          <select
            value={selectedPlaylistName}
            onChange={(e) => setSelectedPlaylistName(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-neutral-800 text-white border border-neutral-700
                       focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none
                       transition-colors duration-200 cursor-pointer hover:border-neutral-600
                       appearance-none text-sm"
            aria-label="Select playlist"
          >
            <option value="" disabled className="text-neutral-500">
              Choose a playlist...
            </option>
            {playlists
              .filter(p => p.name !== "Liked Songs") // Optionally exclude "Liked Songs"
              .map((pl) => (
              <option key={pl.name} value={pl.name} className="bg-neutral-800 py-1">
                {pl.name}
              </option>
            ))}
          </select>
          <ListMusic className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-neutral-700 text-neutral-300 text-sm font-medium
                      hover:bg-neutral-700/30 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPlaylistName}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600
                      hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium
                      transition-all duration-200 hover:scale-[1.01] disabled:opacity-60
                      disabled:hover:scale-100 disabled:cursor-not-allowed group"
          >
            <span className="flex items-center justify-center">
              Add
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}