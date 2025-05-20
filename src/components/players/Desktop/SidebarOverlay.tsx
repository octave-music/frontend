// src/components/player/Desktop/SidebarOverlay.tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, MessageSquareText, Info, ChevronRight, LucideIcon } from "lucide-react";

export type SidebarTab = 'queue' | 'lyrics' | 'details';

interface SidebarOverlayProps {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: SidebarTab;
  setActiveTab: React.Dispatch<React.SetStateAction<SidebarTab>>;
  tabsConfig?: Array<{
    id: SidebarTab;
    label: string;
    icon: LucideIcon; // Ensure this matches type
  }>;
  queuePanelSlot: React.ReactNode;
  lyricsPanelSlot: React.ReactNode;
  detailsPanelSlot: React.ReactNode;
}

const DEFAULT_TABS: Array<{ id: SidebarTab; label: string; icon: LucideIcon }> = [
  { id: 'queue', label: 'Queue', icon: ListMusic },
  { id: 'lyrics', label: 'Lyrics', icon: MessageSquareText }, 
  { id: 'details', label: 'Details', icon: Info }
];

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  showSidebar,
  setShowSidebar,
  activeTab,
  setActiveTab,
  tabsConfig = DEFAULT_TABS,
  queuePanelSlot,
  lyricsPanelSlot,
  detailsPanelSlot,
}) => {
  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" // Increased z-index
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "circOut" }}
          onClick={() => setShowSidebar(false)} // Click on backdrop closes
          style={{ pointerEvents: showSidebar ? "auto" : "none" }}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 35, stiffness: 400 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-neutral-900/90 backdrop-blur-xl shadow-2xl flex flex-col border-l border-white/10" // Slightly narrower, custom bg
            onClick={(e) => e.stopPropagation()} // Prevent click bubbling to backdrop
          >
            {/* Header with Tabs */}
            <div className="relative flex items-center justify-center px-4 py-3 border-b border-white/10">
               {/* Close button shifted inside the panel for better UX */}
               <button
                  onClick={() => setShowSidebar(false)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 active:bg-white/5 transition-colors group"
                >
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                </button>
              
              <nav className="flex items-center gap-1">
                {tabsConfig.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      flex items-center gap-1.5 transition-all duration-150
                      hover:bg-white/10 active:bg-white/15
                      ${t.id === activeTab 
                        ? "bg-white/10 text-white shadow-md" 
                        : "text-neutral-400 hover:text-neutral-200"}
                    `}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Panel */}
            <div className="flex-1 overflow-hidden"> {/* Crucial for content scroll */}
              <AnimatePresence mode="wait"> {/* Wait for exit animation before new one enters */}
                <motion.div
                  key={activeTab} // This key is vital for AnimatePresence to detect changes
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full" // Ensure motion.div takes full height for its content to scroll
                >
                  {activeTab === "queue" && queuePanelSlot}
                  {activeTab === "lyrics" && lyricsPanelSlot}
                  {activeTab === "details" && detailsPanelSlot}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidebarOverlay;