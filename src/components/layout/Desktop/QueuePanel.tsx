// src/components/layout/Desktop/QueuePanel.tsx
import React from "react"
import { cn } from "@/lib/utils/utils"
import TrackItem from "../../common/TrackItem"
import type { Track } from "@/lib/types/types"

interface QueuePanelProps {
  showQueue: boolean
  queue: Track[]
  previousTracks: Track[]
  addToQueue: (t: Track) => void
  openAddToPlaylistModal: (t: Track) => void
  toggleLike: (t: Track) => void
  isTrackLiked: (t: Track) => boolean
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void
  onQueueItemClick: (track: Track, idx: number) => void
}

const QueuePanel: React.FC<QueuePanelProps> = ({
  showQueue,
  queue,
  previousTracks,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
  onQueueItemClick,
}) => {
  if (!showQueue) return null

  return (
    <aside className="w-80 h-full bg-gradient-to-b from-gray-900/95 to-black/95 rounded-xl border border-white/[0.02] backdrop-blur-xl">
      <div className="h-full flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4 text-white">Queue</h2>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {queue.length === 0 && previousTracks.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-gray-400">Your queue is empty.</p>
              <button
                className={cn(
                  "w-full px-4 py-2 bg-white/[0.03] text-white rounded-lg",
                  "border border-white/[0.04] text-sm font-medium transition-colors",
                  "hover:bg-white/[0.04]"
                )}
              >
                Add Suggestions
              </button>
            </div>
          ) : (
            <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-full pr-2">
              {previousTracks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Previous Tracks
                  </h3>
                  <div className="space-y-1">
                    {previousTracks.map((track, idx) => (
                      <TrackItem
                        key={`prev-${track.id}`}
                        track={track}
                        index={idx}
                        isPrevious
                        onTrackClick={onQueueItemClick}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {queue.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Up Next
                  </h3>
                  <div className="space-y-1">
                    {queue.map((track, idx) => (
                      <TrackItem
                        key={`queue-${track.id}`}
                        track={track}
                        index={idx}
                        onTrackClick={onQueueItemClick}
                        addToQueue={addToQueue}
                        openAddToPlaylistModal={openAddToPlaylistModal}
                        toggleLike={toggleLike}
                        isLiked={isTrackLiked(track)}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default QueuePanel
