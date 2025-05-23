// src/components/modals/CreatePlaylistModal.tsx
import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import { Playlist, Track } from '@/lib/types/types'; // For onConfirmCreate props

interface CreatePlaylistModalProps {
  show: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, image?: string | null, tracks?: Track[]) => Promise<Playlist | null>; // Updated to reflect return
  // If track selection is part of this modal directly, add props for it
  // For now, assuming tracks are passed to onCreatePlaylist from parent if pre-selected
}

export function CreatePlaylistModal({ 
    show, 
    onClose, 
    onCreatePlaylist 
}: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [playlistImage, setPlaylistImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!show) return null;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPlaylistImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const handleCreate = async () => {
    if (!playlistName.trim()) return; // Basic validation
    setIsCreating(true);
    await onCreatePlaylist(playlistName, playlistImage);
    setIsCreating(false);
    // Parent (AppCore or useAppPlaylists) will handle closing and resetting state
    // onClose(); // Optional: close immediately
    // setPlaylistName(""); 
    // setPlaylistImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"> {/* High z-index */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-800 rounded-xl p-5 sm:p-6 w-full max-w-sm border border-neutral-700 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white text-center">
          Create New Playlist
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="playlistName" className="block text-xs font-medium text-neutral-400 mb-1">Playlist Name</label>
            <input
              id="playlistName"
              type="text"
              placeholder="My Awesome Mix"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-700/50 text-white placeholder-neutral-500
                         border border-neutral-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                         transition-colors duration-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Cover Image (Optional)
            </label>
            <label
              htmlFor="playlist-image-upload"
              className="relative flex flex-col items-center justify-center w-full h-36 sm:h-40
                         rounded-lg cursor-pointer overflow-hidden transition-all duration-200
                         bg-neutral-700/30 hover:bg-neutral-700/50
                         border-2 border-dashed border-neutral-600 hover:border-purple-500 group"
            >
              {playlistImage ? (
                <>
                  <Image src={playlistImage} fill alt="Playlist Cover" className="object-cover" priority sizes="160px" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <p className="text-xs text-white font-medium">Change Image</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <div className="w-8 h-8 mb-2 rounded-full bg-neutral-600/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-neutral-300">Drop or click to upload</p>
                </div>
              )}
              <input
                id="playlist-image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 py-2 rounded-lg border border-neutral-600 text-neutral-300 text-sm font-medium
                         hover:bg-neutral-700/30 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!playlistName.trim() || isCreating}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600
                         hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-medium
                         transition-all duration-200 hover:scale-[1.01] disabled:opacity-60
                         disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Playlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}