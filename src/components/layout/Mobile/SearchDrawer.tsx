// src/components/mobile/SearchDrawer.tsx
import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Search, Clock, X } from "lucide-react";
import { Track, Playlist, } from "@/lib/types/types"; // Adjust path
import TrackItem from "../../common/TrackItem"; // Adjust path

type SearchDrawerProps = {
  isSearchOpen: boolean;
  setIsSearchOpen: (value: boolean) => void;
  view: string; // To ensure it only shows when view is 'search'
  setView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  recentSearches: string[];
  setRecentSearches: (searches: string[]) => void;
  searchResults: Track[];
  playTrack: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    evt: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
    item: Track | Playlist // Track | Playlist based on what can be context-menu'd from search
  ) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
};

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  isSearchOpen,
  setIsSearchOpen,
  view,
  setView,
  searchQuery,
  setSearchQuery,
  handleSearch,
  recentSearches,
  setRecentSearches,
  searchResults,
  playTrack,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
  addToQueue,
  openAddToPlaylistModal,
}) => {
  if (!isSearchOpen || view !== "search") return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }} // Adjusted transition
      className="fixed inset-0 bg-black z-[10000] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
        <button
          onClick={() => {
            // Instead of setIsSearchOpen(false) and setView('home') which might be abrupt,
            // consider a dedicated function to "close search" that handles state consistently.
            // For now, matching original:
            setIsSearchOpen(false);
            setView("home"); // Or previous view if that's desired
          }}
          className="p-2"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-semibold">Search</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) handleSearch(searchQuery);
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length > 2) { // Search on 3+ chars
                handleSearch(e.target.value);
              }
            }}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 
              focus:outline-none focus:ring-1 focus:ring-purple-500 pl-12 transition-all 
              duration-200 ease-in-out text-sm" // smaller font
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
        {/* Search type buttons - simplified for mobile if only tracks are primary */}
        {/* <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSearchType("tracks")}
            className={`px-4 py-2 rounded-full text-xs font-medium ${ // smaller text
              searchType === "tracks"
                ? "bg-white text-black"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Tracks
          </button>
          Add other types like Playlists, Artists if supported
        </div> */}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0"> {/* pt-0 to avoid double padding */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold text-white/80">Recent Searches</h3>
              <button
                onClick={() => setRecentSearches([])}
                className="px-3 py-1 text-xs font-medium bg-gray-700 rounded hover:bg-gray-600 text-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1.5">
              {recentSearches.map((query, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md bg-gray-800/70 hover:bg-gray-700/70 transition-colors duration-200"
                >
                  <button
                    onClick={() => {
                      setSearchQuery(query);
                      handleSearch(query);
                    }}
                    className="flex items-center space-x-3 text-left flex-1 min-w-0"
                  >
                    <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate text-sm text-gray-200">{query}</span>
                  </button>
                  <button
                    onClick={() => {
                      const upd = recentSearches.filter((_, i2) => i2 !== idx);
                      setRecentSearches(upd);
                    }}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchQuery && (
          <>
            {searchResults.length === 0 && (
              <div className="text-center py-10">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-3"/>
                <p className="text-gray-400 text-sm">No results for "{searchQuery}"</p>
                <p className="text-gray-500 text-xs mt-1">Try a different search term.</p>
              </div>
            )}
            {searchResults.length > 0 && (
              <div>
                {/* <h2 className="text-md font-semibold mb-3 text-white/80">Results</h2> */}
                <div className="grid grid-cols-1 gap-2">
                  {searchResults.map((res, idx) => (
                    <TrackItem
                      key={`${res.id}-search-${idx}`}
                      track={res}
                      index={idx}
                      addToQueue={addToQueue}
                      openAddToPlaylistModal={openAddToPlaylistModal}
                      toggleLike={toggleLike}
                      isLiked={isTrackLiked(res)}
                      onTrackClick={(t) => {
                        playTrack(t);
                        // Optional: Close search drawer on track play
                        // setIsSearchOpen(false);
                        // setView("home"); // Or back to player view if that's the flow
                      }}
                      onContextMenu={(e) => handleContextMenu(e, res)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SearchDrawer;