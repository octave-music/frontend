// src/components/player/Desktop/QueuePanel.tsx
import React, { useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Music2, ListX, ListMusic } from "lucide-react";
import { Track } from "@/lib/types/types"; // Adjust path

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

// --- SoundWave Sub-Component ---
const SoundWave: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
    <div className="flex items-center gap-[1px]">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-white rounded-full"
          initial={{ height: 4 }}
          animate={{
            height: [
              4,
              i % 3 === 0 ? 20 : 12,
              i % 2 === 0 ? 16 : 8, 
              i % 4 === 0 ? 24 : 10,
              4
            ],
            opacity: [0.5, 0.9, 0.7, 0.9, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
            times: [0, 0.2, 0.5, 0.8, 1]
          }}
        />
      ))}
    </div>
  </div>
);

// --- SortableItem Sub-Component ---
interface SortableItemProps {
  id: string | number; // Ensure id matches Track['id']
  track: Track;
  index: number;
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  currentTrackIndex: number;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  track,
  index,
  onQueueItemClick,
  removeFromQueue,
  currentTrackIndex,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${isDragging ? 1.03 : 1})` // Slightly less scale
      : undefined,
    transition: transition || 'transform 0.2s ease-out, box-shadow 0.2s ease-out', // Smoother transition
    zIndex: isDragging ? 999 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)' : undefined,
  };

  const handleTrackClick = () => {
    if (!isDragging) { // Only trigger click if not dragging
      onQueueItemClick(track, index);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout // Animate layout changes
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, delay: index * 0.02 }} // Faster stagger
      className={`group relative rounded-lg transition-all duration-200 mx-4 mb-1.5 ${ // Reduced margin bottom
        index === currentTrackIndex
          ? "bg-gradient-to-r from-purple-800/50 via-blue-800/40 to-purple-800/50 ring-1 ring-purple-500/50" // More prominent active
          : "hover:bg-white/5"
      } ${isDragging ? "bg-neutral-800/90 backdrop-blur-sm" : ""}`}
    >
      <div 
        className={`flex items-center gap-3 p-2.5 relative cursor-pointer ${isDragging ? "shadow-inner" : ""}`} // smaller padding
        onClick={handleTrackClick}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent track click when dragging handle
          className="touch-none flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing" // smaller handle
        >
          <GripVertical className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
        </div>

        <div className="relative flex-shrink-0 w-9 h-9"> {/* Fixed size for image container */}
          {track.album.cover_small ? (
            <Image
              src={track.album.cover_small}
              alt={track.title}
              width={36} // ensure matches container
              height={36}
              className={`rounded-md shadow-md w-full h-full object-cover transition-transform ${isDragging ? "scale-105" : ""}`}
            />
          ) : (
            <div className="w-full h-full rounded-md bg-neutral-700 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-neutral-400" />
            </div>
          )}
          {index === currentTrackIndex && !isDragging && <SoundWave />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-xs truncate ${index === currentTrackIndex ? "text-white" : "text-neutral-200"}`}>
            {track.title}
          </p>
          <p className="text-[11px] text-neutral-400 truncate">{track.artist.name}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent track click
            removeFromQueue(index);
          }}
          className="opacity-0 group-hover:opacity-100 ml-auto p-1.5 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
        >
          <ListX className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};


// --- QueuePanel Main Component ---
export interface QueuePanelProps {
  queue: Track[];
  currentTrack: Track | null; // Allow null
  currentTrackIndex: number;
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
}

const QueuePanel: React.FC<QueuePanelProps> = ({
  queue,
  // currentTrack, // Not directly used in QueuePanel, currentTrackIndex is enough
  currentTrackIndex,
  onQueueItemClick,
  removeFromQueue,
  setQueue,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Increased distance
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((track) => String(track.id) === String(active.id)); // Ensure IDs are strings for comparison
      const newIndex = queue.findIndex((track) => String(track.id) === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        setQueue((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };
  // Ensure track IDs are strings for SortableContext items
  const itemIds = useMemo(() => queue.map(track => String(track.id)), [queue]);


  return (
    <div className="flex flex-col h-full bg-transparent"> {/* Removed gradient, parent handles it */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-neutral-900/80">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Up Next</h2>
            {queue.length > 0 && (
              <span className="text-[11px] text-neutral-400 font-medium px-1.5 py-0.5 rounded-full bg-white/5">
                {queue.length}
              </span>
            )}
          </div>
          {queue.length > 0 && (
            <button
              onClick={() => setQueue([])} // Consider confirmation for clearing queue
              className="px-2.5 py-1 bg-red-700/30 hover:bg-red-700/40 text-red-300 hover:text-red-200 rounded-md transition-colors text-[11px] font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-2 pb-4 scrollbar-hide">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-3 pt-10">
            <ListMusic className="w-10 h-10" />
            <p className="text-xs">Your queue is empty.</p>
            <p className="text-[11px] text-neutral-600">Add some tracks to see them here.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}> {/* Avoid initial animation if not desired */}
                {queue.map((track, index) => (
                  <SortableItem
                    key={String(track.id)} // Ensure key is string
                    id={String(track.id)}   // Ensure id is string
                    track={track}
                    index={index}
                    onQueueItemClick={onQueueItemClick}
                    removeFromQueue={removeFromQueue}
                    currentTrackIndex={currentTrackIndex}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default QueuePanel;