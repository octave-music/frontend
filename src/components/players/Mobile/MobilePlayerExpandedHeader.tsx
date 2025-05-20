// src/components/player/Mobile/MobilePlayerExpandedHeader.tsx
import React from "react";
import { ChevronDown, ListMusic, MoreHorizontal } from "lucide-react";

interface MobilePlayerExpandedHeaderProps {
  onCollapsePlayer: () => void;
  onShowQueue: () => void;
  onShowMoreOptions: () => void;
  canShowQueueButton?: boolean; // To decide if queue button or more button is shown
}

const MobilePlayerExpandedHeader: React.FC<MobilePlayerExpandedHeaderProps> = ({
  onCollapsePlayer, onShowQueue, onShowMoreOptions, canShowQueueButton = true,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 shrink-0"> {/* Smaller padding */}
      <button
        className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors"
        onClick={onCollapsePlayer}
        aria-label="Collapse player"
      >
        <ChevronDown className="w-6 h-6 text-white" />
      </button>
      <div className="flex items-center space-x-1.5">
        {/* <button className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Cast">
          <Cast className="w-5 h-5 text-white/70" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Airplay">
          <Airplay className="w-5 h-5 text-white/70" />
        </button> */}
        {canShowQueueButton ? (
          <button
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={onShowQueue}
            aria-label="Show queue"
          >
            <ListMusic className="w-5 h-5 text-white/70" />
          </button>
        ) : (
          // This combined block was in the original code, keeping it if it was intentional
          <>
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={onShowQueue}
              aria-label="Show queue"
            >
              <ListMusic className="w-5 h-5 text-white/70" />
            </button>
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              onClick={onShowMoreOptions}
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5 text-white/70" />
            </button>
          </>
        )}
         {/* If canShowQueueButton is false, this means the above block is active. If it's true,
             we might still want a "More" button if not all actions fit.
             The original logic for `canShowActions` might need to be more nuanced.
             For now, mirroring the original structure where "More" appears if queue button isn't primary.
         */}
        {!canShowQueueButton && ( /* This seems redundant given the above, review original logic */
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