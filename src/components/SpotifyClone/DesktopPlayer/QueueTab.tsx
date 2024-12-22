/* eslint-disable @next/next/no-img-element */
// src/components/SpotifyClone/DesktopPlayer/QueueTab.tsx
import React from 'react';
import { ListX } from 'lucide-react';
import { Track } from '@/lib/types'; // or wherever your Track interface lives

interface QueueTabProps {
  queue: Track[];
  currentTrackIndex: number;
  currentTrackId?: string; // optional if you want to highlight
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export default function QueueTab({
  queue,
  currentTrackIndex,
  currentTrackId,
  onQueueItemClick,
  removeFromQueue,
  clearQueue,
}: QueueTabProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Queue</h3>
        <button onClick={clearQueue} className="text-sm text-neutral-400 hover:text-white">
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {queue.map((track, index) => {
          const isCurrentIndex = index === currentTrackIndex;
          const isCurrentId = track.id === currentTrackId; // optional
          return (
            <div
              key={`${track.id}-${index}`}
              onClick={() => onQueueItemClick(track, index)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                isCurrentIndex
                  ? 'bg-green-800/30'
                  : isCurrentId
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <img
                src={track.album.cover_small}
                alt={track.title}
                className="w-10 h-10 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{track.title}</p>
                <p className="text-sm text-neutral-400 truncate">{track.artist.name}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(index);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-neutral-400"
              >
                <ListX className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
