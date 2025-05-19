import { getCachedLyrics, storeCachedLyrics } from "../managers/idbWrapper";
import { Track, Lyric } from "../types/types";

const API_BASE_URL = "https://api.octave.gold";

/** ---------------------------------------------------------
 *  Parse an .lrc string into an ordered Lyric[]
 *  – supports  [mm:ss] , [mm:ss.xx] , [mm:ss.xxx]
 *  – supports multiple time-tags on the same line
 * -------------------------------------------------------- */
function parseLyrics(raw: string): Lyric[] {
  const result: Lyric[] = [];

  // each line may contain 1-N time-tags followed by the text
  raw.split(/\r?\n/).forEach((line) => {
    // grab the lyric text (after the last ])
    const text = line.replace(/^\s*(?:\[[^\]]+])+\s*/, "").trim();
    if (!text) return; // skip empty lines

    // extract ALL [mm:ss(.ms)] tags
    const tagReg = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?]/g;
    let match: RegExpExecArray | null;
    while ((match = tagReg.exec(line)) !== null) {
      const [, mm, ss, msRaw] = match;
      const mins  = parseInt(mm, 10);
      const secs  = parseInt(ss, 10);
      const millis = msRaw ? parseInt(msRaw.padEnd(3, "0"), 10) : 0;
      const time  = parseFloat(((mins * 60) + secs + millis / 1000).toFixed(2));

      result.push({ time, text });
    }
  });

  // fall-back: if no time-tags were found treat as unsynced
  if (result.length === 0) {
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map<Lyric>((t) => ({ time: 0, text: t }));
  }

  // sort just in case tags were out-of-order
  return result.sort((a, b) => a.time - b.time);
}

/** ---------------------------------------------------------
 *  Fetch (or cache-load) lyrics for a track
 * -------------------------------------------------------- */
export const handleFetchLyrics = async (track: Track): Promise<Lyric[]> => {
  try {
    /* 1 ▸ check cache */
    const cached = await getCachedLyrics(track.id);
    if (cached) return parseLyrics(cached);

    /* 2 ▸ hit API */
    const resp = await fetch(`${API_BASE_URL}/api/lyrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: track.title, artist: track.artist.name }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data: {
      success: boolean;
      synced: boolean;
      lyrics: string;
    } = await resp.json();

    if (!data.success || !data.lyrics) return [];

    // cache to IndexedDB for next time (don’t await to avoid blocking UI)
    void storeCachedLyrics(track.id, data.lyrics).catch(console.error);

    return parseLyrics(data.lyrics);
  } catch (err) {
    console.error(
      `[Lyrics][error] ${track.artist.name} – ${track.title}`,
      err,
    );
    return [];
  }
};
