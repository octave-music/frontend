// src/components/mobile/PlaylistView.tsx
import React from "react";
import Image from "next/image";
import { Play, Shuffle, Download, Search, X, Plus, Music } from "lucide-react";
import { Track, Playlist } from "@/lib/types/types"; // Adjust path
import TrackItem from "../../common/TrackItem"; // Adjust path

type PlaylistViewProps = {
  currentPlaylist: Playlist;
  setQueue: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (value: boolean) => void;
  shuffleQueue: () => void;
  downloadPlaylist: (playlist: Playlist) => void;
  isDownloading: boolean;
  downloadProgress: number;
  playlistSearchQuery: string;
  setPlaylistSearchQuery: (query: string) => void;
  playlistSearchResults: Track[];
  handlePlaylistSearch: (query: string) => void;
  addTrackToPlaylist: (track: Track) => void;
  playTrack: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
};

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
  playlistSearchResults,
  handlePlaylistSearch,
  addTrackToPlaylist,
  playTrack,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}) => {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative h-[40vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={currentPlaylist.image || "/images/defaultPlaylistImage.png"}
            alt={currentPlaylist.name || "default playlist error alt"}
            className="w-full h-full object-cover"
            fill
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 backdrop-blur-sm"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">
              {currentPlaylist.name}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 
                  text-white rounded-full px-8 py-3 text-base font-medium
                  transition-all duration-200 hover:bg-opacity-90 shadow-lg"
                onClick={() => {
                  setQueue(currentPlaylist.tracks);
                  setCurrentTrack(currentPlaylist.tracks[0]);
                  setIsPlaying(true);
                }}
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 
                  text-white rounded-full px-6 py-3 backdrop-blur-lg 
                  transition-all duration-300"
                onClick={shuffleQueue}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 
                  text-white rounded-full px-6 py-3 backdrop-blur-lg 
                  transition-all duration-300"
                onClick={() => downloadPlaylist(currentPlaylist)}
              >
                {isDownloading ? (
                  <div className="flex items-center space-x-2">
                    <Download
                      className={`w-5 h-5 ${
                        downloadProgress === 100 ? "text-green-500" : ""
                      }`}
                    />
                    <span>{downloadProgress}%</span>
                  </div>
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-8 py-6" style={{ paddingBottom: "5rem" }}> {/* Added paddingBottom */}
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
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
              className="w-full pl-12 pr-12 py-4 bg-gray-800/30 text-white placeholder-gray-400
                rounded-xl border border-gray-700 focus:border-purple-500
                focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
            />
            {playlistSearchQuery && (
              <button
                onClick={() => {
                  setPlaylistSearchQuery("");
                  // Optionally clear search results here too:
                  // setPlaylistSearchResults([]); 
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            )}
          </div>
          {playlistSearchResults.length > 0 && (
            <div
              className="mt-4 max-w-2xl bg-gray-800/50 backdrop-blur-lg rounded-xl 
                border border-gray-700 overflow-hidden"
            >
              {playlistSearchResults.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-700/50 
                    transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <Image
                      src={
                        track.album.cover_small || "/assets/default-album.jpg"
                      } // Consider a better default
                      alt={track.title}
                      className="w-12 h-12 rounded-lg object-cover"
                      width={48}
                      height={48}
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
                    className="flex items-center space-x-2 bg-[#1a237e]/20 text-green-400
                      hover:bg-[#1a237e] hover:text-white px-4 py-2 rounded-lg
                      transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tracks List */}
        <div className="space-y-2">
          {currentPlaylist.tracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Music className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">This playlist is empty.</p>
              <p className="text-sm text-gray-500">Use the search bar above to add songs.</p>
            </div>
          ) : (
            currentPlaylist.tracks.map((track, idx) => (
              <TrackItem
                key={`${track.id}-${idx}`} // Ensure unique key if ids can repeat in a list
                track={track}
                index={idx}
                onTrackClick={playTrack}
                addToQueue={() => {}} // This seems unused or should be props.addToQueue
                openAddToPlaylistModal={() => {}} // This seems unused or should be props.openAddToPlaylistModal
                toggleLike={toggleLike}
                isLiked={isTrackLiked(track)}
                onContextMenu={(e) => handleContextMenu(e, track)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PlaylistView;