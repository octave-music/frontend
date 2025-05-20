// src/components/mobile/LibraryView.tsx
import React from "react";
import Image from "next/image";
import { Plus, Download, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils/utils"; // Adjust path
import { Track, Playlist } from "@/lib/types/types"; // Adjust path

type LibraryViewProps = {
  playlists: Playlist[];
  sidebarCollapsed: boolean; // This prop might be mobile-specific or could be re-evaluated
  setShowCreatePlaylist: (value: boolean) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  storePlaylist: (playlist: Playlist) => void;
  deletePlaylistByName: (name: string) => Promise<Playlist[]>;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist
  ) => void;
  openPlaylist: (playlist: Playlist) => void;
  downloadPlaylist: (playlist: Playlist) => void;
};

const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  sidebarCollapsed,
  setShowCreatePlaylist,
  setPlaylists,
  storePlaylist,
  handleContextMenu,
  openPlaylist,
}) => {
  return (
    // Removed redundant <section> to match HomeView structure (main has px-4)
    // style={{ paddingBottom: "5rem" }} // Padding handled by main scroll container
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Library</h2>
        <button
          className="p-2 rounded-full hover:bg-white/10"
          onClick={() => setShowCreatePlaylist(true)}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
      <div
        className={cn(
          "grid gap-4",
          sidebarCollapsed ? "grid-cols-1" : "grid-cols-1" // On mobile, likely always 1 column
        )}
      >
        {playlists.map((playlist) => (
          <div
            key={playlist.name}
            className={cn(
              "bg-gray-800 bg-opacity-40 rounded-lg flex items-center cursor-pointer relative",
              // sidebarCollapsed logic might need adjustment for mobile context
              sidebarCollapsed ? "p-2 justify-center" : "p-4", 
              playlist.pinned && "border-2 border-blue-900"
            )}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", playlist.name);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedPlaylistName = e.dataTransfer.getData("text/plain");
              const fromIndex = playlists.findIndex(
                (p) => p.name === droppedPlaylistName
              );
              const toIndex = playlists.findIndex(
                (p) => p.name === playlist.name
              );
              if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
              
              const updated = [...playlists];
              const [removed] = updated.splice(fromIndex, 1);
              updated.splice(toIndex, 0, removed);
              setPlaylists(updated);
              void Promise.all(updated.map((pl) => storePlaylist(pl)));
            }}
            onClick={() => openPlaylist(playlist)}
            // Context menu on mobile is often a long press, but here it's a right click simulation
            // For actual mobile, a MoreVertical button is better.
            // onContextMenu={(e) => handleContextMenu(e, playlist)}
            style={{ userSelect: "none" }}
          >
            <Image
              src={playlist.image || "/images/defaultPlaylistImage.png"}
              alt={playlist.name || "Playlist Cover"}
              className={cn(
                "rounded",
                sidebarCollapsed ? "w-10 h-10" : "w-12 h-12 mr-3"
              )}
              width={sidebarCollapsed ? 40 : 48}
              height={sidebarCollapsed ? 40 : 48}
            />
            {/* Simplified for mobile view, assuming sidebarCollapsed might not be relevant or always one way */}
            {!sidebarCollapsed && ( // This condition might need to be re-evaluated for mobile only context
              <>
                <div className="flex-1 min-w-0"> {/* Added for text truncation */}
                    <span className="font-medium text-sm block truncate">{playlist.name}</span>
                    <span className="text-xs text-gray-400">{playlist.tracks.length} songs</span>
                </div>
                {playlist.downloaded && (
                  <Download className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                )}
                <button
                  className="p-1 rounded-full hover:bg-white/20 ml-2 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent playlist click
                    handleContextMenu(e, playlist); // Trigger context menu
                  }}
                >
                  <MoreVertical className="w-5 h-5 text-gray-300" />
                </button>
              </>
            )}
             {/* If sidebarCollapsed is true, maybe show only icon and name under it or a compact view */}
             {sidebarCollapsed && (
                <span className="font-medium text-xs mt-1 text-center truncate w-full">{playlist.name}</span>
             )}
          </div>
        ))}
        {playlists.length === 0 && (
            <p className="text-gray-400 text-center py-10">Your library is empty. Create a playlist to get started!</p>
        )}
      </div>
    </>
  );
};

export default LibraryView;