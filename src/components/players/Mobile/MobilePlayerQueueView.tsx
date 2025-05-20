// src/components/player/Mobile/MobilePlayerQueueView.tsx
import React from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ArrowLeft, ListX, MoreHorizontal, Trash2, ListMusic } from "lucide-react";
import { Track } from "@/lib/types/types"; // Adjust path

interface MobilePlayerQueueViewProps {
  queue: Track[];
  previousTracks: Track[];
  currentTrackId: string | number | undefined;
  onCloseQueue: () => void;
  onClearQueue: () => void;
  onQueueItemClick: (track: Track, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onShowMoreOptionsForTrack?: (track: Track) => void; // Optional: if you want more options per track
}

const QueueItem: React.FC<{
    track: Track;
    isCurrent: boolean;
    onClick: () => void;
    onDragRemove?: () => void; // Optional drag to remove
    onMoreClick?: (e: React.MouseEvent) => void;
    isPrevious?: boolean;
}> = ({ track, isCurrent, onClick, onDragRemove, onMoreClick, isPrevious }) => (
    <motion.div
        className="relative w-full"
        layout // Animate layout changes (e.g., when an item is removed)
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }} // Slide out on remove
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
        <motion.div
            className={`flex items-center space-x-3 p-2.5 rounded-lg w-full transition-colors
                        ${isCurrent ? "bg-white/10" : "hover:bg-white/5"}
                        ${isPrevious ? "opacity-60" : ""}`}
            onClick={onClick}
            drag={onDragRemove ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.3, right: 0 }} // Only allow dragging left slightly
            onDragEnd={(event, info: PanInfo) => {
                if (info.offset.x < -80 && onDragRemove) { // Threshold for removal
                    onDragRemove();
                }
            }}
        >
            <div className="w-10 h-10 relative rounded-md overflow-hidden flex-shrink-0">
                <Image
                    src={track.album.cover_medium || "/images/default-album.png"}
                    alt={track.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrent ? "text-purple-400" : "text-white"}`}>
                    {track.title}
                </p>
                <p className="text-xs text-white/60 truncate">{track.artist.name}</p>
            </div>
            {onMoreClick && !isPrevious && (
                <button
                    className="p-2 -mr-1 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={onMoreClick}
                    aria-label="More options for track"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            )}
        </motion.div>
        {onDragRemove && (
             <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-600 text-white px-4 rounded-r-lg opacity-0 pointer-events-none group-drag-active:opacity-100">
                <Trash2 size={18} />
             </div>
        )}
    </motion.div>
);


const MobilePlayerQueueView: React.FC<MobilePlayerQueueViewProps> = ({
  queue, previousTracks, currentTrackId,
  onCloseQueue, onClearQueue, onQueueItemClick, onRemoveFromQueue, onShowMoreOptionsForTrack
}) => {
  return (
    <motion.div
      className="w-full h-full flex flex-col items-center pt-2 px-3" // Adjusted padding
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4 w-full shrink-0">
        <div className="flex items-center">
          <button
            onClick={onCloseQueue}
            className="p-2 -ml-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Back to player"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-md font-semibold text-white ml-3">Up Next</h2>
        </div>
        {queue.length > 0 && (
            <button
                onClick={onClearQueue}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 text-xs text-red-400 hover:text-red-300"
                aria-label="Clear queue"
            >
                <ListX className="w-3.5 h-3.5" />
                <span>Clear</span>
            </button>
        )}
      </div>

      <div className="w-full flex-1 flex flex-col gap-1.5 overflow-y-auto pb-16 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <AnimatePresence>
          {previousTracks.map((t, i) => (
             <QueueItem
                key={`prev-${t.id}-${i}`}
                track={t}
                isCurrent={false}
                isPrevious
                onClick={() => onQueueItemClick(t, -1 * (previousTracks.length - i))} // Adjust index for previous
             />
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {queue.map((track, index) => (
            <QueueItem
                key={`queue-${track.id}-${index}`}
                track={track}
                isCurrent={track.id === currentTrackId}
                onClick={() => onQueueItemClick(track, index)}
                onDragRemove={() => onRemoveFromQueue(index)}
                onMoreClick={(e) => {
                    e.stopPropagation();
                    if (onShowMoreOptionsForTrack) onShowMoreOptionsForTrack(track);
                }}
            />
          ))}
        </AnimatePresence>
        {queue.length === 0 && previousTracks.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-white/50 py-10">
                <ListMusic size={40} className="mb-3"/>
                <p className="text-sm">Queue is Empty</p>
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default MobilePlayerQueueView;