// src/components/layout/Desktop/HomeView.tsx
import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils/utils"
import { X, Play } from "lucide-react"
import TrackItem from "../../common/TrackItem"
import type { Playlist, Track } from "@/lib/types/types"

interface HomeViewProps {
  playlists: Playlist[]
  openPlaylist: (pl: Playlist) => void
  handleUnpinPlaylist: (pl: Playlist) => void
  jumpBackIn: Track[]
  playTrack: (t: Track) => void
  recommendedTracks: Track[]
  addToQueue: (t: Track) => void
  openAddToPlaylistModal: (t: Track) => void
  toggleLike: (t: Track) => void
  isTrackLiked: (t: Track) => boolean
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void
}

const HomeView: React.FC<HomeViewProps> = ({
  playlists,
  openPlaylist,
  handleUnpinPlaylist,
  jumpBackIn,
  playTrack,
  recommendedTracks,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}) => {
  const pinnedPlaylists = playlists.filter((pl) => pl.pinned)

  return (
    <>
      {pinnedPlaylists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Pinned Playlists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedPlaylists.map((pl, i) => (
              <div
                key={i}
                onClick={() => openPlaylist(pl)}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer",
                  "bg-white/[0.03] hover:bg-white/[0.04] border border-white/[0.04]",
                  "transition-all duration-200"
                )}
              >
                <Image
                  src={pl.image || "/images/defaultPlaylistImage.png"}
                  alt={pl.name}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                  priority
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white truncate">
                    {pl.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {pl.tracks.length} tracks
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnpinPlaylist(pl)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white/[0.08] transition-all"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jump Back In */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Jump Back In</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {jumpBackIn.map((track, i) => (
            <div key={i} className="group relative flex flex-col">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                <Image
                  src={track.album.cover_medium || "/images/defaultSongImage.png"}
                  alt={track.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  onClick={() => playTrack(track)}
                  className={cn(
                    "absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-500 text-white",
                    "flex items-center justify-center transform translate-y-4 opacity-0",
                    "group-hover:translate-y-0 group-hover:opacity-100",
                    "transition-all duration-200 hover:scale-105 hover:bg-green-400"
                  )}
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <p className="font-medium text-sm text-white line-clamp-1">
                  {track.title}
                </p>
                <p className="text-sm text-gray-400 line-clamp-1">
                  {track.artist.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-white">
          Recommended for you
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
          {recommendedTracks.length > 0 ? (
            recommendedTracks.map((track, idx) => (
              <TrackItem
                key={track.id}
                track={track}
                index={idx}
                onTrackClick={playTrack}
                addToQueue={addToQueue}
                openAddToPlaylistModal={openAddToPlaylistModal}
                toggleLike={toggleLike}
                isLiked={isTrackLiked(track)}
                onContextMenu={(e) => handleContextMenu(e, track)}
              />
            ))
          ) : (
            <p className="text-gray-400">No recommendations available.</p>
          )}
        </div>
      </section>
    </>
  )
}

export default HomeView
