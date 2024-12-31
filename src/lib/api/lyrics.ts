// lyrics.ts

import { Track, Lyric } from "../types/types";

const API_BASE_URL = "https://mbck.cloudgen.xyz";

/**
 * Parses a raw lyrics string into a structured array of lyrics with time stamps.
 * @param {string} ly - The raw lyrics string.
 * @returns {Lyric[]} Parsed lyrics array.
 */
const parseLyrics = (ly: string): Lyric[] => {
  return ly.split("\n").map((l) => {
    const [time, text] = l.split("]");
    const [m, s] = time.replace("[", "").split(":");
    const secs = parseFloat(m) * 60 + parseFloat(s);
    return { time: parseFloat(secs.toFixed(1)), text: text.trim() };
  });
};

/**
 * Fetches lyrics for a specific track from the server.
 * @param {Track} track - The track for which to fetch lyrics.
 * @returns {Promise<Lyric[]>} The fetched and parsed lyrics array.
 */
export const handleFetchLyrics = async (track: Track): Promise<Lyric[]> => {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/lyrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: track.title, artist: track.artist.name }),
    });

    const data = await resp.json();
    if (data.success && data.synced) {
      return parseLyrics(data.lyrics);
    } else {
      return [];
    }
  } catch (err) {
    console.error("Lyrics error:", err);
    return [];
  }
};
