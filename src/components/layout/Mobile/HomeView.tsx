// src/components/mobile/HomeView.tsx
import React from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils/utils"; // Adjust path
import { Track, Playlist } from "@/lib/types/types"; // Adjust path
import TrackItem from "../../common/TrackItem"; // Adjust path

type HomeViewProps = {
  playlists: Playlist[];
  jumpBackIn: Track[];
  recommendedTracks: Track[];
  setPlaylists: (playlists: Playlist[]) => void;
  storePlaylist: (playlist: Playlist) => void;
  // setView: (view: string) => void; // setView is not directly used by HomeView content from props
  playTrack: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  searchResults: Track[]; // Used as a fallback for jumpBackIn
  // For context menu on recommended tracks if needed
  handleContextMenu: ( 
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
  addToQueue: (track: Track) => void; // Add if TrackItem needs it
  openAddToPlaylistModal: (track: Track) => void; // Add if TrackItem needs it

};

const HomeView: React.FC<HomeViewProps> = ({
  playlists,
  jumpBackIn,
  recommendedTracks,
  setPlaylists,
  storePlaylist,
  playTrack,
  toggleLike,
  isTrackLiked,
  searchResults,
  handleContextMenu, // Pass this down
  addToQueue,
  openAddToPlaylistModal,
}) => {
  const pinnedPlaylists = playlists.filter((pl) => pl.pinned);

  return (
    // Removed redundant <section> and px-6, main container has px-4
    // style={{ paddingBottom: "5rem" }} // Padding handled by main scroll container
    <>
      {pinnedPlaylists.length > 0 && (
        <section className="mb-6">
           <h2 className="text-xl font-semibold mb-3">Pinned Playlists</h2>
          <div className="grid grid-cols-2 gap-2">
            {pinnedPlaylists.slice(0, 4).map((pl) => ( // Limit to 4 for mobile view
              <div
                key={pl.name}
                className="flex items-center space-x-3 bg-gray-800 bg-opacity-40 rounded-md p-2 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                onClick={() => { /* TODO: Open playlist - need openPlaylist prop */ }}
              >
                <Image
                  src={pl.image || "/images/defaultPlaylistImage.png"}
                  alt={pl.name || "Playlist Cover"}
                  className="w-10 h-10 rounded-md flex-shrink-0"
                  width={40}
                  height={40}
                />
                <span className="font-medium text-sm flex-1 truncate">{pl.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updatedPlaylists = playlists.map((playlist) =>
                      playlist.name === pl.name
                        ? { ...playlist, pinned: false }
                        : playlist
                    );
                    setPlaylists(updatedPlaylists);
                    void Promise.all(
                      updatedPlaylists.map((playlist) => storePlaylist(playlist))
                    );
                  }}
                  className="ml-auto p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          {jumpBackIn.length > 0 ? "Jump Back In" : "Quick Picks"}
        </h2>
        <div className="relative">
          <div
            className={cn(
              "flex gap-3", // slightly smaller gap for mobile
              "overflow-x-auto",
              "snap-x snap-mandatory",
              "pb-3", // reduced padding bottom
              "no-scrollbar"
            )}
          >
            {(jumpBackIn.length > 0 ? jumpBackIn : searchResults.slice(0, 6)).map( // show up to 6
              (track, idx) => (
                <div
                  key={track.id ? `${track.id}-${idx}` : idx}
                  className={cn(
                    "flex-shrink-0",
                    "w-[150px]", // smaller cards for mobile
                    "snap-start",
                    "group relative",
                    "transition-transform duration-200 ease-out",
                    "hover:scale-[1.02]",
                    "select-none"
                  )}
                >
                  <div className="relative aspect-square mb-2">
                    <Image
                      src={
                        track.album.cover_medium ||
                        "/images/defaultPlaylistImage.png"
                      }
                      alt={track.title || "Album Cover"}
                      className={cn(
                        "w-full h-full",
                        "object-cover rounded-lg", // slightly less rounded
                        "shadow-md", // softer shadow
                        "transition-opacity duration-200",
                        "bg-gray-900"
                      )}
                      width={150}
                      height={150}
                      draggable={false}
                      priority={idx < 3} // Priority for first few images
                    />
                    <div
                      className={cn(
                        "absolute inset-0",
                        "rounded-lg",
                        "flex items-center justify-center",
                        "bg-black/30", // lighter overlay
                        "opacity-0 group-hover:opacity-100",
                        "transition-all duration-200"
                      )}
                    >
                      <button
                        onClick={() => playTrack(track)}
                        className={cn(
                          "p-2.5 rounded-full", // smaller button
                          "bg-purple-600", // use theme color
                          "hover:bg-purple-500",
                          "hover:scale-105",
                          "transform",
                          "transition-all duration-200",
                          "shadow-lg"
                        )}
                      >
                        <Play className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5 px-1">
                    <p className="font-medium text-xs text-gray-100 line-clamp-1">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-1">
                      {track.artist?.name}
                    </p>
                  </div>
                </div>
              )
            )}
             {(jumpBackIn.length === 0 && searchResults.length === 0) && (
                <p className="text-gray-500 text-sm w-full text-center py-4">Nothing to show here yet.</p>
            )}
          </div>
        </div>
      </section>

      <section> {/* Removed flex-1, overflow-y-auto, custom-scrollbar, pb-32 as parent handles scroll */}
        <h2 className="text-xl font-semibold mb-3">Recommended for you</h2>
        <div className="grid grid-cols-1 gap-2"> {/* Mobile: single column list */}
          {recommendedTracks.length > 0 ? (
            recommendedTracks.slice(0,10).map((track, idx) => ( // Show limited items
              <TrackItem
                key={`${track.id}-rec-${idx}`}
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
            <p className="text-gray-400 text-sm py-4">No recommendations available at the moment.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default HomeView;