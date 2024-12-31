/* eslint-disable @next/next/no-img-element */
// Onboarding.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Music, Search } from "lucide-react";
import debounce from "lodash/debounce";
import { getSetting } from "../../lib/managers/idbWrapper";
import { Artist, Track } from "../../lib/types/types";

interface OnboardingProps {
  onComplete: () => void;
  onArtistSelectionComplete: (artists: Artist[]) => void;
  API_BASE_URL: string;
  setRecommendedTracks?: (tracks: Track[]) => void;
}

function OnboardingStep1({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-bl from-[#1e1e2f] via-[#282843] to-[#0d0d14] text-white">
      <div className="relative text-center p-8 bg-gradient-to-br from-black/50 to-black/70 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-full p-4 shadow-md">
            <Music className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400">
          Welcome to Octave
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Your gateway to a world of music tailored just for you. Let's craft
          your ultimate soundtrack together.
        </p>
        <button
          onClick={onComplete}
          className="px-10 py-4 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white rounded-full shadow-xl transform transition-transform hover:translate-y-[-2px]"
        >
          Get Started
        </button>
        <div className="mt-10 flex items-center justify-center space-x-2">
          <div className="h-[2px] w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
          <p className="text-sm text-gray-400">
            A personalized music experience awaits
          </p>
          <div className="h-[2px] w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </div>
    </div>
  );
}

function ArtistSelection({
  onComplete,
  API_BASE_URL,
  setRecommendedTracks,
}: {
  onComplete: (selectedArtists: Artist[]) => void;
  API_BASE_URL: string;
  setRecommendedTracks?: (tracks: Track[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const debouncedFetch = useCallback(
    async (val: string) => {
      if (!val || val.length < 2) {
        setArtistSearchResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/search/artists?query=${encodeURIComponent(val)}`
        );
        const data = await response.json();
        if (data.results) {
          const filtered = data.results.filter(
            (a: Artist) => !selectedArtists.some((sa) => sa.id === a.id)
          );
          setArtistSearchResults(filtered);
        }
      } catch (error) {
        console.error("Artist search error:", error);
        setArtistSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [API_BASE_URL, selectedArtists]
  );

  const fetchArtistSearchResults = useMemo(
    () => debounce(debouncedFetch, 300),
    [debouncedFetch]
  );

  useEffect(() => {
    async function fetchStoredRecommendations() {
      try {
        const storedArtists = await getSetting("favoriteArtists");
        if (storedArtists) {
          const artists: Artist[] = JSON.parse(storedArtists);
          const fetchPromises = artists.map(async (artist) => {
            const response = await fetch(
              `${API_BASE_URL}/api/search/tracks?query=${encodeURIComponent(
                artist.name
              )}`
            );
            const data = await response.json();
            return (data.results || []).slice(0, 5);
          });

          const artistTracks = await Promise.all(fetchPromises);
          const all = artistTracks.flat();
          const shuffled = all.sort(() => Math.random() - 0.5);

          if (setRecommendedTracks) {
            setRecommendedTracks(shuffled);
          }
        }
      } catch (error) {
        console.error("Failed to fetch stored recommended tracks:", error);
      }
    }

    fetchStoredRecommendations();
  }, [API_BASE_URL, setRecommendedTracks]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchArtistSearchResults(val);
  };

  const handleArtistSelect = (artist: Artist) => {
    if (selectedArtists.length >= 5) return;
    setSelectedArtists((prev) => [...prev, artist]);
    setArtistSearchResults((prev) => prev.filter((a) => a.id !== artist.id));
    setSearchTerm("");
  };

  const handleArtistUnselect = (artist: Artist) => {
    setSelectedArtists((prev) => prev.filter((a) => a.id !== artist.id));
  };

  useEffect(() => {
    return () => {
      fetchArtistSearchResults.cancel();
    };
  }, [fetchArtistSearchResults]);

  return (
    <div className="min-h-screen overflow-y-auto custom-scrollbar bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
            Pick Your Vibe
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select up to 5 artists you love and we'll create your perfect
            musical atmosphere
          </p>
        </div>
        <div className="max-w-3xl mx-auto mb-12">
          <div
            className={`relative transform transition-all duration-200 ${
              isSearchFocused ? "scale-105" : "scale-100"
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
                style={{ caretColor: "white" }}
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
            <h2 className="text-2xl font-bold text-white mb-6">
              Selected Artists
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden 
                    transform transition-all duration-300 hover:scale-95"
                  onClick={() => handleArtistUnselect(artist)}
                >
                  <img
                    src={
                      artist.picture_medium || "/images/placeholder-image.png"
                    }
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
            <h2 className="text-2xl font-bold text-white mb-6">
              Search Results
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {artistSearchResults.map((artist) => (
                <div
                  key={artist.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer 
                    transform transition-all duration-300 hover:scale-105"
                  onClick={() => handleArtistSelect(artist)}
                >
                  <img
                    src={
                      artist.picture_medium || "/images/placeholder-image.png"
                    }
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
              <span className="text-2xl font-bold text-purple-400">
                {selectedArtists.length}
              </span>
              <span className="ml-2 text-gray-400">of 5 artists selected</span>
            </p>
            <button
              onClick={() => onComplete(selectedArtists)}
              disabled={selectedArtists.length === 0}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedArtists.length === 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white transform hover:scale-105"
              }`}
            >
              {selectedArtists.length === 0
                ? "Select Artists to Continue"
                : "Complete Selection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Onboarding({
  onComplete,
  onArtistSelectionComplete,
  API_BASE_URL,
  setRecommendedTracks,
}: OnboardingProps) {
  const [step, setStep] = useState(1);

  const handleStep1Complete = useCallback(() => {
    setStep(2);
  }, []);

  if (step === 1) {
    return <OnboardingStep1 onComplete={handleStep1Complete} />;
  }

  if (step === 2) {
    return (
      <ArtistSelection
        onComplete={(artists) => {
          onArtistSelectionComplete(artists);
          onComplete();
        }}
        API_BASE_URL={API_BASE_URL}
        setRecommendedTracks={setRecommendedTracks}
      />
    );
  }

  return null;
}
