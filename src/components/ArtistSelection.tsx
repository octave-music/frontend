/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import debounce from 'lodash/debounce';

interface Artist {
  id: number;
  name: string;
  picture_medium: string;
}

interface ArtistSelectionProps {
  onComplete: (selectedArtists: Artist[]) => void;
}

const API_BASE_URL = 'https://mbck.cloudgen.xyz'; // same base as your main code

export default function ArtistSelection({ onComplete }: ArtistSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const performArtistSearch = useCallback(
    async (value: string, currentSelectedArtists: Artist[]) => {
      if (value.length > 2) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/search/artists?query=${encodeURIComponent(value)}`
          );
          const data = await response.json();
          // Filter out artists already selected
          const filteredResults = (data.results || []).filter(
            (artist: Artist) => !currentSelectedArtists.some((a) => a.id === artist.id)
          );
          setArtistSearchResults(filteredResults);
        } catch (error) {
          console.error('Error searching artists:', error);
          setArtistSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setArtistSearchResults([]);
      }
    },
    []
  );

  const artistDebouncedSearch = useMemo(() => {
    return debounce((value: string, currentSelectedArtists: Artist[]) => {
      void performArtistSearch(value, currentSelectedArtists);
    }, 300);
  }, [performArtistSearch]);

  useEffect(() => {
    return () => {
      artistDebouncedSearch.cancel();
    };
  }, [artistDebouncedSearch]);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      artistDebouncedSearch(value, selectedArtists);
    },
    [artistDebouncedSearch, selectedArtists]
  );

  const handleArtistSelect = useCallback(
    (artist: Artist) => {
      if (selectedArtists.length < 5) {
        setSelectedArtists((prev) => [...prev, artist]);
        setArtistSearchResults((prev) => prev.filter((a) => a.id !== artist.id));
        setSearchTerm('');
      }
    },
    [selectedArtists.length]
  );

  const handleArtistUnselect = useCallback((artist: Artist) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artist.id));
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto custom-scrollbar bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
            Pick Your Vibe
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select up to 5 artists you love and we&apos;ll create your perfect musical atmosphere
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-12">
          <div
            className={`relative transform transition-all duration-200 ${
              isSearchFocused ? 'scale-105' : 'scale-100'
            }`}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for your favorite artists..."
                value={searchTerm}
                onChange={handleSearchInput}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur-xl border border-white/20 
                  rounded-2xl text-white placeholder-gray-400 outline-none focus:ring-2 
                  focus:ring-purple-500/50 transition-all duration-300"
                style={{ caretColor: 'white' }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
                ) : (
                  <Search className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {selectedArtists.length > 0 && (
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Selected Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden 
                    transform transition-all duration-300 hover:scale-95"
                  onClick={() => handleArtistUnselect(artist)}
                >
                  <img
                    src={artist.picture_medium}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                      flex flex-col justify-end p-4"
                  >
                    <p className="text-white font-semibold">{artist.name}</p>
                    <p className="text-red-400 text-sm">Click to remove</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {artistSearchResults.length > 0 && (
          <div className="max-w-5xl mx-auto pb-20">
            <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {artistSearchResults.map((artist) => (
                <div
                  key={artist.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer 
                    transform transition-all duration-300 hover:scale-105"
                  onClick={() => handleArtistSelect(artist)}
                >
                  <img
                    src={artist.picture_medium}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                      flex flex-col justify-end p-4"
                  >
                    <p className="text-white font-semibold">{artist.name}</p>
                    <p className="text-green-400 text-sm">Click to select</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <p className="text-white">
              <span className="text-2xl font-bold text-purple-400">{selectedArtists.length}</span>
              <span className="ml-2 text-gray-400">of 5 artists selected</span>
            </p>
            <button
              onClick={() => onComplete(selectedArtists)}
              disabled={selectedArtists.length === 0}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedArtists.length === 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white transform hover:scale-105'
              }`}
            >
              {selectedArtists.length === 0 ? 'Select Artists to Continue' : 'Complete Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
