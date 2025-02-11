import { getCachedLyrics, storeCachedLyrics } from "../managers/idbWrapper";
import { Track, Lyric } from "../types/types";

const API_BASE_URL = "https://api.octave.gold";

const parseLyrics = (ly: string): Lyric[] => {
  return ly.split("\n").map((l) => {
    const [time, text] = l.split("]");
    const [m, s] = time.replace("[", "").split(":");
    const secs = parseFloat(m) * 60 + parseFloat(s);
    return { time: parseFloat(secs.toFixed(1)), text: text.trim() };
  });
};

export const handleFetchLyrics = async (track: Track): Promise<Lyric[]> => {
  try {
    // Check if lyrics are cached
    const cached = await getCachedLyrics(track.id);
    if (cached) {
      return parseLyrics(cached);
    }
    
    // If not, fetch from server
    const resp = await fetch(`${API_BASE_URL}/api/lyrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: track.title, artist: track.artist.name }),
    });
    const data = await resp.json();
    if (data.success && data.synced) {
      // Cache the lyrics for future use
      await storeCachedLyrics(track.id, data.lyrics);
      return parseLyrics(data.lyrics);
    } else {
      return [];
    }
  } catch (err) {
    console.error("Lyrics error:", err);
    return [];
  }
};
