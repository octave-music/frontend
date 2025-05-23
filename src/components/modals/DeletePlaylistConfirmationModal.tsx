// src/components/modals/DeletePlaylistConfirmationModal.tsx
import React from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeletePlaylistConfirmationModalProps {
  show: boolean;
  playlistName: string | null;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function DeletePlaylistConfirmationModal({ 
  show, 
  playlistName, 
  onClose, 
  onConfirmDelete 
}: DeletePlaylistConfirmationModalProps) {
  if (!show || !playlistName) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4" // High z-index
      onClick={onClose} // Click on backdrop closes
    >
      <motion.div
        className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-xl
                   p-6 sm:p-7 w-full max-w-sm
                   border border-neutral-700/50 shadow-xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4 mb-5">
          <div
            className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0
                       border border-red-500/25 shadow-md shadow-red-500/10"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
              Delete Playlist
            </h3>
            <p className="text-neutral-300/90 text-sm leading-normal">
              Are you sure you want to delete "
              <span className="font-medium text-white/90">{playlistName}</span>
              "? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-neutral-700 text-neutral-200 text-sm font-medium
                       hover:bg-neutral-700/30 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
                onConfirmDelete();
                // onClose(); // Parent AppCore will close after confirmation
            }}
            className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-600 to-rose-600
                       hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold
                       shadow-md shadow-red-500/20 hover:shadow-red-500/25
                       transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] group"
          >
            <span className="flex items-center justify-center">
              Delete
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}