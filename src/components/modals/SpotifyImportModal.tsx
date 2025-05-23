// src/components/modals/SpotifyImportModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpotifyToDeezer as SpotifyToDeezerComponent } from '@/components/onboarding/SpotifyToDeezer'; // Assuming this is your component

interface SpotifyImportModalProps {
  show: boolean;
  onClose: () => void;
  onPlaylistImported: () => Promise<void>; // Simplified to just a notification
}

export function SpotifyImportModal({ show, onClose, onPlaylistImported }: SpotifyImportModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto flex items-center justify-center p-4" // High z-index
      onClick={onClose} // Click on backdrop closes
    >
      <motion.div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative w-full max-w-xl transform overflow-hidden rounded-xl bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-700/50 shadow-2xl transition-all"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        {/* Optional decorative elements from original if desired */}
        {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" /> */}
        
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-700/50">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Import Spotify Playlist
          </h2>
          <button
            className="p-1.5 rounded-full hover:bg-neutral-700/50 transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 hover:text-white" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto custom-scrollbar p-4 sm:p-6">
          <SpotifyToDeezerComponent
            onClose={onClose}
            onPlaylistImported={async () => {
              await onPlaylistImported(); // Call the passed handler
              // Toast is handled by parent AppCore
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}