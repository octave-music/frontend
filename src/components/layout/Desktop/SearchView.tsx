// src/components/layout/Desktop/SearchView.tsx
import React from "react";
import { cn } from "@/lib/utils/utils";
import { Search, X, Clock } from "lucide-react";
import TrackItem from "../../common/TrackItem";
import type { Track } from "@/lib/types/types";

interface SearchViewProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchType: string;
  setSearchType: (t: string) => void;
  handleSearch: (q: string) => void;
  fetchSearchResults: (q: string) => void;
  searchResults: Track[];
  recentSearches: string[];
  setRecentSearches: (arr: string[]) => void;
  playTrack: (track: Track) => void;
  addToQueue: (track: Track) => void;
  openAddToPlaylistModal: (track: Track) => void;
  toggleLike: (track: Track) => void;
  isTrackLiked: (track: Track) => boolean;
  handleContextMenu: (
    e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    track: Track
  ) => void;
}

const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  handleSearch,
  fetchSearchResults,
  searchResults,
  recentSearches,
  setRecentSearches,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isTrackLiked,
  handleContextMenu,
}) => {
  return (
    <section className="min-h-screen backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* SEARCH HEADER */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <h1
            className={cn(
              "text-4xl md:text-5xl font-bold text-center",
              "bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text",
              "animate-gradient"
            )}
          >
            Discover Your Music
          </h1>

          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              if (searchQuery.trim()) handleSearch(searchQuery);
            }}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 group-hover:text-pink-400 transition-colors" />
              <input
                type="text"
                placeholder="Search for songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 3) {
                    fetchSearchResults(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    fetchSearchResults(searchQuery);
                  }
                }}
                className="w-full px-14 py-4 rounded-full bg-white/[0.03] backdrop-blur-xl text-white placeholder-gray-400 border border-white/[0.04] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:bg-white/[0.04]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchSearchResults("");
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex gap-3">
            <button
              onClick={() => setSearchType("tracks")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                searchType === "tracks"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                  : "bg-white/[0.03] text-white hover:bg-white/[0.04] border border-white/[0.04]"
              )}
            >
              Tracks
            </button>
          </div>
        </div>

        {/* RECENT SEARCHES */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white/90">Recent Searches</h3>
              <button
                onClick={() => setRecentSearches([])}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500/90 rounded-lg hover:bg-red-600/90 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="grid gap-2">
              {recentSearches.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.04] transition-colors"
                >
                  <button
                    onClick={() => {
                      setSearchQuery(q);
                      fetchSearchResults(q);
                    }}
                    className="flex items-center gap-4 text-left"
                  >
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">{q}</span>
                  </button>
                  <button
                    onClick={() => {
                      const upd = recentSearches.filter((_, ii) => ii !== i);
                      setRecentSearches(upd);
                    }}
                    className="text-red-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH RESULTS */}
        {searchQuery && (
          <div className="animate-fadeIn">
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">
                  No results found for “{searchQuery}”
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                    Search Results
                  </h2>
                  <span className="text-sm text-purple-400">
                    {searchResults.length} items found
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((r, idx) => (
                    <TrackItem
                      key={r.id}
                      track={r}
                      index={idx}
                      onTrackClick={playTrack}
                      addToQueue={addToQueue}
                      openAddToPlaylistModal={openAddToPlaylistModal}
                      toggleLike={toggleLike}
                      isLiked={isTrackLiked(r)}
                      onContextMenu={(e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) =>
                        handleContextMenu(e, r)
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchView;