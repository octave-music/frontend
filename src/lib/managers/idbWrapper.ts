// lib/idbWrapper.ts

// =======================
// Type Declarations
// =======================

import { Track, Playlist } from "../types/types";

interface RecentlyPlayedEntry {
  timestamp: number;
  track: Track;
}

// A helper to safely clone track data:
function safeTrackData(track: Track): Track {
  return JSON.parse(JSON.stringify(track));
}

// For your pointerEvent errors, we do the same for arrays of tracks:
function safeTracksArray(tracks: Track[]): Track[] {
  return tracks.map((t) => JSON.parse(JSON.stringify(t)));
}

const DB_VERSION = 4; // Bump the version if needed to trigger onupgradeneeded
const DB_NAME = "OctaveDB";

export async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("tracks")) {
        db.createObjectStore("tracks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("playlists")) {
        db.createObjectStore("playlists", { keyPath: "name" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("listenCounts")) {
        db.createObjectStore("listenCounts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("recentlyPlayed")) {
        const store = db.createObjectStore("recentlyPlayed", {
          autoIncrement: true,
        });
        store.createIndex("by_timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id" }); // You can use 'id' or any other identifier
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// ================================
// 1) TRACK BLOB (Offline Audio)
// ================================
export async function storeTrackBlob(
  trackId: string,
  blob: Blob
): Promise<void> {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("tracks");
    store.put({ id: trackId, blob });
  });
}

export async function getOfflineBlob(
  trackId: string
): Promise<Blob | undefined> {
  const db = await openIDB();
  return new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction("tracks", "readonly");
    const store = tx.objectStore("tracks");
    const req = store.get(trackId);

    req.onsuccess = () => {
      const result = req.result;
      if (result) {
        resolve(result.blob as Blob);
      } else {
        resolve(undefined);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ================================
// 2) PLAYLISTS
// ================================
export async function storePlaylist(pl: Playlist): Promise<void> {
  // Make sure to store safe data:
  const safePL: Playlist = {
    ...pl,
    tracks: safeTracksArray(pl.tracks),
  };

  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("playlists", "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("playlists");
    store.put(safePL);
  });
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await openIDB();
  return new Promise<Playlist[]>((resolve, reject) => {
    const tx = db.transaction("playlists", "readonly");
    const store = tx.objectStore("playlists");
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result as Playlist[] | undefined;
      resolve(result ?? []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylistByName(name: string): Promise<Playlist[]> {
  const db = await openIDB();
  return new Promise<Playlist[]>((resolve, reject) => {
    const tx = db.transaction("playlists", "readwrite");
    tx.oncomplete = async () => {
      const all = await getAllPlaylists();
      resolve(all);
    };
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("playlists");
    store.delete(name);
  });
}

// ================================
// 3) RECENTLY PLAYED
// ================================
export async function storeRecentlyPlayed(
  track: Track,
  limit = 4
): Promise<Track[]> {
  const db = await openIDB();
  return new Promise<Track[]>((resolve, reject) => {
    const tx = db.transaction("recentlyPlayed", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = async () => {
      const all = await getRecentlyPlayed();
      // filter duplicates
      const unique: Track[] = [];
      for (const t of all) {
        if (!unique.find((u) => u.id === t.id)) {
          unique.push(t);
        }
      }
      resolve(unique.slice(0, limit));
    };

    const store = tx.objectStore("recentlyPlayed");
    // store a safe copy
    store.add({
      timestamp: Date.now(),
      track: safeTrackData(track),
    } as RecentlyPlayedEntry);
  });
}

export async function getRecentlyPlayed(): Promise<Track[]> {
  const db = await openIDB();
  return new Promise<Track[]>((resolve, reject) => {
    const tx = db.transaction("recentlyPlayed", "readonly");
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("recentlyPlayed");
    const idx = store.index("by_timestamp");

    const results: Track[] = [];
    const req = idx.openCursor(null, "prev");
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        const entry = cursor.value as RecentlyPlayedEntry;
        results.push(entry.track);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// ================================
// 4) LISTEN COUNTS
// ================================
export async function storeListenCount(
  trackId: string,
  count: number
): Promise<void> {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("listenCounts", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore("listenCounts");
    store.put({ id: trackId, count });
  });
}

export async function getListenCounts(): Promise<Record<string, number>> {
  const db = await openIDB();
  return new Promise<Record<string, number>>((resolve, reject) => {
    const tx = db.transaction("listenCounts", "readonly");
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("listenCounts");
    const req = store.getAll();

    req.onsuccess = () => {
      const data = req.result || [];
      const map: Record<string, number> = {};
      data.forEach((item: { id: string; count: number }) => {
        map[item.id] = item.count;
      });
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

// ================================
// 5) SETTINGS
// ================================
export async function storeSetting(key: string, value: string): Promise<void> {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore("settings");
    store.put({ key, value });
  });
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await openIDB();
  return new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    tx.onerror = () => reject(tx.error);

    const store = tx.objectStore("settings");
    const req = store.get(key);

    req.onsuccess = () => {
      if (req.result) {
        resolve(req.result.value as string);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Store the entire queue
export async function storeQueue(queue: Track[]): Promise<void> {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore("queue");
    store.clear(); // Clear old queue
    queue.forEach((track) => store.put(safeTrackData(track))); // Add all tracks to queue
  });
}

// Retrieve the stored queue
export async function getQueue(): Promise<Track[]> {
  const db = await openIDB();
  return new Promise<Track[]>((resolve, reject) => {
    const tx = db.transaction("queue", "readonly");
    const store = tx.objectStore("queue");
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Clear the queue
export async function clearQueue(): Promise<void> {
  const db = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore("queue");
    store.clear();
  });
}

// Recommended Tracks:

export async function storeRecommendedTracks(tracks: Track[]) {
  await storeSetting("recommendedTracks", JSON.stringify(tracks));
}

export async function getRecommendedTracks(): Promise<Track[] | null> {
  const data = await getSetting("recommendedTracks");
  return data ? (JSON.parse(data) as Track[]) : null;
}
