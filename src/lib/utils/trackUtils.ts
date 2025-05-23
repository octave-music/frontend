/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/utils/trackUtils.ts
import { Track } from '@/lib/types/types';

const DEFAULT_COVER_IMAGE = "/images/defaultPlaylistImage.png"; // Define a constant for the default

export const sanitizeTrackUtil = (track: Track | null | undefined): Track => { // Allow null/undefined input
  if (!track) {
    console.warn("Attempted to sanitize an undefined/null track. Providing fallback.");
    return {
        id: `fallback-${Date.now().toString()}`, // Ensure ID matches Track type (string)
        title: "Unknown Track",
        artist: { name: "Unknown Artist" },
        album: {
            title: "Unknown Album",
            cover_medium: DEFAULT_COVER_IMAGE,
            cover_small: DEFAULT_COVER_IMAGE,  // ADDED
            cover_big: DEFAULT_COVER_IMAGE,    // ADDED
            cover_xl: DEFAULT_COVER_IMAGE      // ADDED
        },
    };
  }

  // Ensure track.id is a string
  const trackId = typeof track.id === 'number' ? String(track.id) : track.id;

  return {
    id: trackId || `unknown-${Date.now().toString()}`,
    title: track.title || "Unknown Title",
    artist: {
      name: track.artist?.name || "Unknown Artist",
    },
    album: {
      title: track.album?.title || "Unknown Album",
      cover_medium: track.album?.cover_medium || DEFAULT_COVER_IMAGE,
      cover_small: track.album?.cover_small || DEFAULT_COVER_IMAGE,
      cover_big: track.album?.cover_big || DEFAULT_COVER_IMAGE, // Use optional chaining and fallback
      cover_xl: track.album?.cover_xl || DEFAULT_COVER_IMAGE,   // Use optional chaining and fallback
    },
    // Ensure all other mandatory fields from Track type have fallbacks if they could be missing
  };
};

export const dedupeTracksByIdUtil = (arr: Track[]): Track[] => {
  if (!Array.isArray(arr)) return []; // Handle cases where arr might not be an array
  const seen = new Map<string, Track>(); // Track ID is string
  for (const t of arr) {
    // It's possible 't' itself could be null/undefined if the input array isn't clean.
    // Sanitize will handle it, but good to be aware.
    const clean = sanitizeTrackUtil(t);
    if (clean.id && !seen.has(clean.id)) { // Ensure clean.id is not empty before setting
      seen.set(clean.id, clean);
    }
  }
  return Array.from(seen.values());
};