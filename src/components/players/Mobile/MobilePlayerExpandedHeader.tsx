// src/components/player/Mobile/MobilePlayerExpandedHeader.tsx
import React from "react";
import { ChevronDown, ListMusic, MoreHorizontal } from "lucide-react"; // Removed Cast, Airplay as they weren't used in the final logic

interface MobilePlayerExpandedHeaderProps {
  onCollapsePlayer: () => void;
  onShowQueue: () => void;
  onShowMoreOptions: () => void;
  showMoreButtonInHeader: boolean; // New prop to control "More" button visibility
}

const MobilePlayerExpandedHeader: React.FC<MobilePlayerExpandedHeaderProps> = ({
  onCollapsePlayer, onShowQueue, onShowMoreOptions, showMoreButtonInHeader,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 shrink-0">
      <button
        className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors"
        onClick={onCollapsePlayer}
        aria-label="Collapse player"
      >
        <ChevronDown className="w-6 h-6 text-white" />
      </button>
      <div className="flex items-center space-x-1.5">
        {/* Always show Queue button */}
        <button
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          onClick={onShowQueue}
          aria-label="Show queue"
        >
          <ListMusic className="w-5 h-5 text-white/70" />
        </button>
        {/* Conditionally show More Options button in header */}
        {showMoreButtonInHeader && (
             <button
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                onClick={onShowMoreOptions}
                aria-label="More options"
            >
                <MoreHorizontal className="w-5 h-5 text-white/70" />
            </button>
        )}
      </div>
    </div>
  );
};
export default MobilePlayerExpandedHeader;