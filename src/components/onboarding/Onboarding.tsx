// Onboarding.tsx

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Music, Search } from "lucide-react";
import debounce from "lodash/debounce";
import { getSetting } from "@/lib/managers/idbWrapper";
import { Artist, Track } from "@/lib/types/types";
import Image from "next/image";

interface OnboardingProps {
  onComplete: () => void;
  onArtistSelectionComplete: (artists: Artist[]) => void;
  API_BASE_URL: string;
  setRecommendedTracks?: (tracks: Track[]) => void;
}

function OnboardingStep1({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-bl from-[#0A0E18] via-[#131926] to-[#0A0E18] text-white">
      <div className="w-full max-w-md mx-auto text-center p-6 bg-gradient-to-br from-black/50 to-black/70 backdrop-blur-xl rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-full p-4 shadow-md">
            <Music className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
          Welcome to Octave
        </h1>
        
        <p className="text-base md:text-lg text-gray-300 mb-6 leading-relaxed">
          Your gateway to a world of music tailored just for you. Let's craft your ultimate soundtrack together.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={onComplete}
            className="w-full px-6 py-3 text-base md:text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 hover:from-green-500 hover:to-emerald-500 text-white rounded-full shadow-xl transform transition-transform hover:translate-y-[-2px]"
          >
            Get Started
          </button>
          
          <button
            onClick={onSkip}
            className="w-full px-6 py-3 text-base md:text-lg font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-2">
          <div className="h-[2px] w-10 bg-gradient-to-r from-emerald-500 to-green-500" />
          <p className="text-xs md:text-sm text-gray-400">
            A personalized music experience awaits
          </p>
          <div className="h-[2px] w-10 bg-gradient-to-r from-green-500 to-emerald-500" />
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
    <div className="min-h-screen overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#0A0E18] via-[#131926] to-[#0A0E18]">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-300">
            Pick Your Vibe
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select up to 5 artists you love and we'll create your perfect
            musical atmosphere
          </p>
        </div>
        <div className="max-w-3xl mx-auto mb-12">
          <div className={`relative transform transition-all duration-200 ${
            isSearchFocused ? "scale-105" : "scale-100"
          }`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for your favorite artists..."
                value={searchTerm}
                onChange={handleSearchInput}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full px-6 py-4 text-lg bg-[#131926]/80 backdrop-blur-xl border border-emerald-500/20 
                  rounded-2xl text-white placeholder-gray-400 outline-none focus:ring-2 
                  focus:ring-emerald-500/50 transition-all duration-300"
                style={{ caretColor: "white" }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
                ) : (
                  <Search className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Artists Grid */}
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
                  <Image
                    src={artist.picture_medium || "/images/placeholder-image.png"}
                    alt={artist.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E18]/90 via-[#0A0E18]/40 to-transparent 
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

        {/* Search Results Grid */}
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
                  <Image
                    src={artist.picture_medium || "/images/placeholder-image.png"}
                    alt={artist.name}
                    width={200}  // Adjust based on your actual medium image size
                    height={200}
                    className="w-full h-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E18]/90 via-[#0A0E18]/40 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                    flex flex-col justify-end p-4"
                  >
                    <p className="text-white font-semibold">{artist.name}</p>
                    <p className="text-emerald-400 text-sm">Click to select</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="fixed bottom-0 inset-x-0 bg-[#0A0E18]/90 backdrop-blur-xl border-t border-emerald-500/10">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <p className="text-white">
              <span className="text-2xl font-bold text-emerald-400">
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
                  : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-green-600 hover:to-emerald-600 text-white transform hover:scale-105"
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

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (step === 1) {
    return <OnboardingStep1 onComplete={handleStep1Complete} onSkip={handleSkip} />;
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
