// src/components/player/Mobile/MobileMoreOptionsMenu.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideProps } from "lucide-react"; // Or SVGProps if not all are Lucide

export interface MoreOptionItem {
  icon: React.FC<LucideProps>; // Or SVGProps
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string; // Optional color for the icon
}

interface MobileMoreOptionsMenuProps {
  isOpen: boolean;
  options: MoreOptionItem[];
  onClose: () => void;
}

const MobileMoreOptionsMenu: React.FC<MobileMoreOptionsMenuProps> = ({
  isOpen, options, onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 z-[60]" // Ensure high z-index
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-md rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 max-h-[70vh] overflow-y-auto"> {/* Max height and scroll */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              {/* Optional Title: <h3 className="text-lg font-semibold text-white mb-3 text-center">More Options</h3> */}
              
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 mb-4 pt-2"> {/* Grid for actions */}
                {options.map((item, index) => (
                  <button
                    key={index}
                    className="flex flex-col items-center space-y-1.5 text-center p-1 group"
                    onClick={() => {
                      item.onClick?.();
                      onClose(); // Close menu after action
                    }}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                                 ${item.active ? "bg-purple-600/30" : "bg-white/10 group-hover:bg-white/20"}`}
                    >
                      <item.icon className={`w-5 h-5 ${item.active ? 'text-purple-400' : (item.color || 'text-white/70')}`} />
                    </div>
                    <span className="text-[10px] text-white/70 leading-tight px-0.5">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="w-full py-3.5 text-white/70 hover:text-white transition-colors mt-2 text-center text-sm"
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

export default MobileMoreOptionsMenu;