// lib/idbWrapper.ts
import { Track, Playlist } from "../types/types";

const API_BASE_URL = "https://mbck.cloudgen.xyz";
const DB_NAME = "OctaveDB";
const DB_VERSION = 6;

interface RecentlyPlayedEntry {
  timestamp: number;
  track: Track;
}

// Utility functions for safe data handling
function safeClone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Database connection handling
async function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      const stores = {
        tracks: { keyPath: "id" },
        playlists: { keyPath: "name" },
        settings: { keyPath: "key" },
        listenCounts: { keyPath: "id" },
        queue: { keyPath: "id" },
        recentlyPlayed: { autoIncrement: true }
      };

      Object.entries(stores).forEach(([name, config]) => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, config);
          if (name === "recentlyPlayed") {
            store.createIndex("by_timestamp", "timestamp", { unique: false });
          }
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic database operation wrapper
async function dbOperation<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Track blob storage operations
export async function storeTrackBlob(trackId: string, blob: Blob): Promise<void> {
  await dbOperation("tracks", "readwrite", (store) => 
    store.put({ id: trackId, blob, timestamp: Date.now() })
  );
}

export async function getOfflineBlob(trackId: string): Promise<Blob | undefined> {
  const result = await dbOperation<{ blob: Blob } | undefined>(
    "tracks",
    "readonly",
    (store) => store.get(trackId)
  );
  return result?.blob;
}

// Playlist operations
export async function storePlaylist(playlist: Playlist): Promise<void> {
  const safePL = safeClone(playlist);
  await dbOperation("playlists", "readwrite", (store) => store.put(safePL));
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  return dbOperation<Playlist[]>("playlists", "readonly", (store) => 
    store.getAll()
  ) || [];
}

export async function deletePlaylistByName(name: string): Promise<Playlist[]> {
  await dbOperation("playlists", "readwrite", (store) => store.delete(name));
  return getAllPlaylists();
}

// Recently played tracks
export async function storeRecentlyPlayed(
  track: Track,
  limit = 4
): Promise<Track[]> {
  const entry: RecentlyPlayedEntry = {
    timestamp: Date.now(),
    track: safeClone(track)
  };

  await dbOperation("recentlyPlayed", "readwrite", (store) => 
    store.add(entry)
  );

  return getRecentlyPlayed(limit);
}

export async function getRecentlyPlayed(limit = 4): Promise<Track[]> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("recentlyPlayed", "readonly");
    const store = tx.objectStore("recentlyPlayed");
    const index = store.index("by_timestamp");
    
    const results: Track[] = [];
    let count = 0;

    const request = index.openCursor(null, "prev");
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && count < limit) {
        const entry = cursor.value as RecentlyPlayedEntry;
        if (!results.find(t => t.id === entry.track.id)) {
          results.push(entry.track);
          count++;
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Listen count operations
export async function storeListenCount(
  trackId: string,
  count: number
): Promise<void> {
  await dbOperation("listenCounts", "readwrite", (store) => 
    store.put({ id: trackId, count })
  );
}

export async function getListenCounts(): Promise<Record<string, number>> {
  const data = await dbOperation<Array<{ id: string; count: number }>>(
    "listenCounts",
    "readonly",
    (store) => store.getAll()
  );

  return (data || []).reduce((acc, item) => {
    acc[item.id] = item.count;
    return acc;
  }, {} as Record<string, number>);
}

// Settings operations
export async function storeSetting(key: string, value: string): Promise<void> {
  await dbOperation("settings", "readwrite", (store) => 
    store.put({ key, value })
  );
}

export async function getSetting(key: string): Promise<string | null> {
  const result = await dbOperation<{ value: string } | undefined>(
    "settings",
    "readonly",
    (store) => store.get(key)
  );
  return result?.value || null;
}

// Queue operations
export async function storeQueue(queue: Track[]): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.clear();
    queue.forEach((track, index) => {
      store.put({ ...safeClone(track), queueIndex: index });
    });
  });
}

export async function getQueue(): Promise<Track[]> {
  const tracks = await dbOperation<Array<Track & { queueIndex: number }>>(
    "queue",
    "readonly",
    (store) => store.getAll()
  );

  return (tracks || [])
    .sort((a, b) => a.queueIndex - b.queueIndex)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ queueIndex, ...track }) => track);
}

export async function clearQueue(): Promise<void> {
  await dbOperation("queue", "readwrite", (store) => store.clear());
}

// Recommended tracks
export async function storeRecommendedTracks(tracks: Track[]): Promise<void> {
  await storeSetting("recommendedTracks", JSON.stringify(tracks));
}

export async function getRecommendedTracks(): Promise<Track[] | null> {
  const data = await getSetting("recommendedTracks");
  return data ? JSON.parse(data) : null;
}

// Blob validation and refresh
export async function validateBlob(trackId: string): Promise<boolean> {
  try {
    const blob = await getOfflineBlob(trackId);
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function refreshTrackBlob(trackId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/track/${trackId}.mp3`);
  if (!response.ok) throw new Error("Failed to fetch track");

  const blob = await response.blob();
  await storeTrackBlob(trackId, blob);
  return blob;
}
