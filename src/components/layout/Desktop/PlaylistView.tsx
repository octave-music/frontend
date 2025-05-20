// src/components/layout/Desktop/PlaylistView.tsx
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import {
  Play,
  Shuffle,
  Download,
  Search,
  X,
  Plus,
  Music,
} from "lucide-react";
import TrackItem from "../../common/TrackItem";
import type { Playlist, Track } from "@/lib/types/types";

interface PlaylistViewProps {
  currentPlaylist: Playlist;
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  shuffleQueue: () => void;
  downloadPlaylist: (playlist: Playlist) => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (query: string) => void;
  handlePlaylistSearch: (query: string) => void;
  playlistSearchResults: Track[];
  setPlaylistSearchResults: (results: Track[]) => void;
  addTrackToPlaylist: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  currentPlaylist,
  setQueue,
  setCurrentTrack,
  setIsPlaying,
  shuffleQueue,
  downloadPlaylist,
  isDownloading,
  downloadProgress,
  playlistSearchQuery,
  setPlaylistSearchQuery,
  handlePlaylistSearch,
  playlistSearchResults,
  setPlaylistSearchResults,
  addTrackToPlaylist,
  toggleLike,
  isTrackLiked,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  handleContextMenu,
}) => {
  return (
    <section className="min-h-screen">
      {/* COVER & PLAY CONTROLS */}
      <div className="h-[45vh] relative rounded-xl mb-8">
        <div className="absolute inset-0">
          <Image
            src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
            alt={currentPlaylist.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            <Image
              src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
              alt={currentPlaylist.name}
              width={180}
              height={180}
              className="rounded-xl shadow-2xl ring-1 ring-white/[0.06]"
              priority
            />

            <div className="flex-1">
              <span className="text-white/80 text-sm font-medium mb-2 tracking-wide">
                PLAYLIST
              </span>
              <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">
                {currentPlaylist.name}
              </h2>
              <p className="text-white/80 text-sm">
                {currentPlaylist.tracks.length} tracks
              </p>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setQueue(currentPlaylist.tracks);
                    setCurrentTrack(currentPlaylist.tracks[0]);
                    setIsPlaying(true);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 rounded-full",
                    "bg-white text-gray-900 text-sm font-medium",
                    "hover:bg-gray-100 active:scale-95 transition-all duration-200"
                  )}
                >
                  <Play className="w-5 h-5" />
                  Play All
                </button>

                <button
                  onClick={shuffleQueue}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full",
                    "bg-white/[0.06] text-white text-sm font-medium",
                    "hover:bg-white/[0.08] active:scale-95 transition-all duration-200"
                  )}
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </button>

                <button
                  onClick={() => downloadPlaylist(currentPlaylist)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-full",
                    "bg-white/[0.06] text-white text-sm font-medium",
                    "hover:bg-white/[0.08] active:scale-95 transition-all duration-200"
                  )}
                >
                  {isDownloading ? (
                    <div className="flex items-center gap-2">
                      <Download
                        className={
                          downloadProgress === 100 ? "text-green-500" : ""
                        }
                      />
                      <span>{downloadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH TO ADD TRACKS */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for songs to add..."
            value={playlistSearchQuery}
            onChange={(e) => setPlaylistSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && playlistSearchQuery.trim()) {
                void handlePlaylistSearch(playlistSearchQuery);
              }
            }}
            className={cn(
              "w-full pl-12 pr-12 py-4 bg-white/[0.03] text-white placeholder-gray-400",
              "rounded-xl border border-white/[0.04]",
              "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20",
              "transition-all duration-200"
            )}
          />
          {playlistSearchQuery && (
            <button
              onClick={() => {
                setPlaylistSearchQuery("");
                setPlaylistSearchResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
          )}
        </div>

        {playlistSearchResults.length > 0 && (
          <div
            className={cn(
              "mt-4 max-w-2xl mx-auto bg-white/[0.03] backdrop-blur-xl rounded-xl",
              "border border-white/[0.04] divide-y divide-white/[0.04] shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-200"
            )}
          >
            {playlistSearchResults.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={track.album.cover_small || "/images/defaultSongImage.png"}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-white">{track.title}</p>
                    <p className="text-sm text-gray-400">
                      {track.artist.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void addTrackToPlaylist(track)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-green-500/20 text-green-400",
                    "hover:bg-green-500 hover:text-white active:scale-95 transition-all duration-200"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXISTING TRACK LIST */}
      <div className="space-y-1 max-w-7xl mx-auto">
        {currentPlaylist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Music className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">This playlist is empty</p>
          </div>
        ) : (
          currentPlaylist.tracks.map((track, idx) => (
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
        )}
      </div>
    </section>
  );
};

export default PlaylistView;
