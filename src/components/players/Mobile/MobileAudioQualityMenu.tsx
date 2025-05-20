// src/components/player/Mobile/MobileAudioQualityMenu.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify"; // Assuming you use react-toastify
import { AudioQuality } from "./types"; // Adjust path

interface MobileAudioQualityMenuProps {
  isOpen: boolean;
  currentQuality: AudioQuality;
  isDataSaverActive: boolean;
  onChangeQuality: (quality: AudioQuality) => Promise<void>;
  onClose: () => void;
}

const qualityOptionsDetails: Record<AudioQuality, { label: string; description: string }> = {
    MAX: { label: "Max", description: "Lossless (up to 24-bit/192kHz)" },
    HIGH: { label: "High", description: "CD Quality (16-bit/44.1kHz)" },
    NORMAL: { label: "Normal", description: "Standard (up to 320kbps)" },
    DATA_SAVER: { label: "Data Saver", description: "Basic (up to 128kbps)" },
};


const MobileAudioQualityMenu: React.FC<MobileAudioQualityMenuProps> = ({
  isOpen, currentQuality, isDataSaverActive, onChangeQuality, onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[60]" // Ensure high z-index
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close when backdrop is clicked
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-md rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside sheet
          >
            <div className="p-4 max-h-[70vh] overflow-y-auto"> {/* Max height and scroll */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                Audio Quality
              </h3>
              {(Object.keys(qualityOptionsDetails) as AudioQuality[]).map((qual) => {
                const details = qualityOptionsDetails[qual];
                const isDisabled = isDataSaverActive && qual !== "DATA_SAVER";
                return (
                  <button
                    key={qual}
                    className={`w-full flex items-center justify-between p-3.5 rounded-lg mb-1.5 transition-colors
                                ${currentQuality === qual ? "bg-purple-600/20" : "hover:bg-white/5"}
                                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={async () => {
                      if (isDisabled) {
                        toast.info( // Using info toast
                          "Data Saver is ON. To change quality, turn off Data Saver or select an offline quality setting."
                        );
                        return;
                      }
                      onClose(); // Close menu immediately for responsiveness
                      try {
                        await onChangeQuality(qual);
                        toast.success(`Audio quality set to ${details.label}`);
                      } catch (err) {
                        console.error("Failed to change audio quality:", err);
                        toast.error("Couldn't change audio quality.");
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <div className="text-left">
                      <p className={`font-medium ${currentQuality === qual ? 'text-purple-400' : 'text-white'}`}>
                        {details.label}
                      </p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {details.description}
                      </p>
                    </div>
                    {qual === currentQuality && (
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                  </button>
                );
              })}
              <button
                className="w-full py-3.5 text-white/70 hover:text-white transition-colors mt-3 text-center text-sm"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileAudioQualityMenu;