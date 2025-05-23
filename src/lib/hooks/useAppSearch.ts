// src/hooks/useAppSearch.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { Track } from '@/lib/types/types';
import { API_BASE_URL } from '../config'; // Create a config file for constants
import { sanitizeTrackUtil, dedupeTracksByIdUtil } from '@/lib/utils/trackUtils';
import { getSetting as getSettingIDB, storeSetting as storeSettingIDB } from '@/lib/managers/idbWrapper';

const MAX_RECENT_SEARCHES = 10;

export function useAppSearch() {
  const [searchQuery, setSearchQueryState] = useState("");
  const [searchResults, setSearchResultsState] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearchesState] = useState<string[]>([]);
  const [searchType, setSearchTypeState] = useState("tracks"); // 'tracks', 'playlists', 'artists'

  // Playlist-specific search (if needed separate from main search)
  const [playlistSearchQuery, setPlaylistSearchQueryState] = useState("");
  const [playlistSearchResults, setPlaylistSearchResultsState] = useState<Track[]>([]);
  const [isPlaylistSearching, setIsPlaylistSearching] = useState(false);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const setPlaylistSearchQuery = useCallback((query: string) => {
    setPlaylistSearchQueryState(query);
  }, []);

  const setSearchType = useCallback((type: string) => {
    setSearchTypeState(type);
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearchesState(prev => {
        const lowerCaseQuery = query.trim().toLowerCase();
        const filtered = prev.filter(s => s.toLowerCase() !== lowerCaseQuery);
        const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
        void storeSettingIDB("recentSearches", JSON.stringify(updated));
        return updated;
    });
  }, []);
  
  const clearRecentSearches = useCallback(() => {
    setRecentSearchesState([]);
    void storeSettingIDB("recentSearches", JSON.stringify([]));
  }, []);

  const fetcher = useCallback(async (query: string, type: string = "tracks", isPlaylistContext: boolean = false) => {
    if (!query.trim() || query.trim().length < 2) { // Minimum 2 chars to search
      isPlaylistContext ? setPlaylistSearchResultsState([]) : setSearchResultsState([]);
      isPlaylistContext ? setIsPlaylistSearching(false) : setIsSearching(false);
      return;
    }

    isPlaylistContext ? setIsPlaylistSearching(true) : setIsSearching(true);
    addRecentSearch(query); // Add to recent searches on actual fetch attempt

    try {
      // Adjust endpoint based on searchType if you have different search APIs
      const endpoint = type === "tracks" ? "tracks" : type; // Example
      const response = await fetch(
        `${API_BASE_URL}/api/search/${endpoint}?query=${encodeURIComponent(query.trim())}`
      );
      if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
      const data = await response.json();

      if (data && Array.isArray(data.results)) {
        const cleaned = dedupeTracksByIdUtil((data.results as Track[]).map(sanitizeTrackUtil));
        isPlaylistContext ? setPlaylistSearchResultsState(cleaned) : setSearchResultsState(cleaned);
      } else {
        isPlaylistContext ? setPlaylistSearchResultsState([]) : setSearchResultsState([]);
      }
    } catch (error) {
      console.error(`Search error (${type}):`, error);
      isPlaylistContext ? setPlaylistSearchResultsState([]) : setSearchResultsState([]);
    } finally {
      isPlaylistContext ? setIsPlaylistSearching(false) : setIsSearching(false);
    }
  }, [addRecentSearch]);

  const debouncedFetchMainSearch = useMemo(() => debounce((q: string, t: string) => fetcher(q, t, false), 350), [fetcher]);
  const debouncedFetchPlaylistSearch = useMemo(() => debounce((q: string) => fetcher(q, "tracks", true), 350), [fetcher]);

  const handleMainSearch = useCallback((query: string) => {
    setSearchQuery(query); // Update input immediately
    debouncedFetchMainSearch(query, searchType);
  }, [setSearchQuery, debouncedFetchMainSearch, searchType]);

  const handlePlaylistContextSearch = useCallback((query: string) => {
    setPlaylistSearchQuery(query); // Update input immediately
    debouncedFetchPlaylistSearch(query);
  }, [setPlaylistSearchQuery, debouncedFetchPlaylistSearch]);
  
  // Load recent searches from IDB on mount
  useEffect(() => {
    getSettingIDB("recentSearches").then(saved => {
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentSearchesState(parsed.slice(0, MAX_RECENT_SEARCHES));
                }
            } catch (e) { console.error("Failed to parse recent searches", e); }
        }
    });
  }, []);

  return {
    searchQuery,
    setSearchQuery, // Direct setter for input control
    searchResults,
    setSearchResults: setSearchResultsState, // Expose direct setter if needed for optimistic updates elsewhere
    isSearching,
    handleMainSearch, // Use this for triggering search
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    searchType,
    setSearchType,

    playlistSearchQuery,
    setPlaylistSearchQuery, // Direct setter
    playlistSearchResults,
    setPlaylistSearchResults: setPlaylistSearchResultsState,
    isPlaylistSearching,
    handlePlaylistContextSearch, // Use this for triggering playlist context search
  };
}