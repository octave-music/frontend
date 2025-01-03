/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/idbWrapper.ts

import { Track, Playlist } from "../types/types";

interface TrackStore {
  id: string;
  blob?: Blob | string;
  totalChunks?: number;
  size?: number;
  type?: string;
  data?: Blob | string;
}

interface ChunkData {
  id: string;
  data: Blob | string;
}


interface RecentlyPlayedEntry {
 timestamp: number;
 track: Track;
}

let dbConnection: IDBDatabase | null = null;

const DB_VERSION = 6;
const DB_NAME = "OctaveDB";

function safeTrackData(track: Track): Track {
 return JSON.parse(JSON.stringify(track));
}

function safeTracksArray(tracks: Track[]): Track[] {
 return tracks.map((t) => safeTrackData(t));
}

function isSafari(): boolean {
 return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

async function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  let db: IDBDatabase;
  try {
    db = await openIDB();
  } catch (error) {
    await recoverFromTransactionError();
    db = await openIDB();
  }
  
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    
    tx.oncomplete = () => {
      resolve(result);
    };
    
    tx.onerror = () => {
      reject(tx.error);
    };
    
    tx.onabort = () => {
      reject(new Error('Transaction aborted'));
    };

    let result: T;
    callback(store)
      .then((value) => {
        result = value;
      })
      .catch(reject);
  });
}

async function recoverFromTransactionError(): Promise<void> {
 if (dbConnection) {
   dbConnection.close();
   dbConnection = null;
 }
 
 await new Promise(resolve => setTimeout(resolve, 100));
 
 try {
   await openIDB();
 } catch (error) {
   throw error;
 }
}

export async function openIDB(): Promise<IDBDatabase> {
 if (dbConnection) {
   return dbConnection;
 }

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
       db.createObjectStore("queue", { keyPath: "id" });
     }
   };

   request.onsuccess = () => {
     dbConnection = request.result;
     
     dbConnection.onclose = () => {
       dbConnection = null;
     };
     
     dbConnection.onerror = () => {
       dbConnection = null;
     };

     resolve(dbConnection);
   };

   request.onerror = () => {
     dbConnection = null;
     reject(request.error);
   };
 });
}

async function storeTrackBlobInChunks(trackId: string, blob: Blob): Promise<void> {
 const CHUNK_SIZE = 1024 * 1024;
 const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
 
 await withTransaction('tracks', 'readwrite', async (store) => {
   await store.put({
     id: trackId,
     totalChunks,
     size: blob.size,
     type: blob.type
   });
 });
 
 for (let i = 0; i < totalChunks; i++) {
   const start = i * CHUNK_SIZE;
   const end = Math.min(start + CHUNK_SIZE, blob.size);
   const chunk = blob.slice(start, end);
   
   if (isSafari()) {
     const base64Chunk = await blobToBase64(chunk);
     await withTransaction('tracks', 'readwrite', async (store) => {
       await store.put({
         id: `${trackId}_chunk_${i}`,
         data: base64Chunk
       });
     });
   } else {
     await withTransaction('tracks', 'readwrite', async (store) => {
       await store.put({
         id: `${trackId}_chunk_${i}`,
         data: chunk
       });
     });
   }
 }
}

export async function storeTrackBlob(trackId: string, blob: Blob): Promise<void> {
 try {
   if (blob.size > 5 * 1024 * 1024) {
     await storeTrackBlobInChunks(trackId, blob);
   } else {
     if (isSafari()) {
       const base64 = await blobToBase64(blob);
       await withTransaction('tracks', 'readwrite', async (store) => {
         await store.put({ id: trackId, blob: base64 });
       });
     } else {
       await withTransaction('tracks', 'readwrite', async (store) => {
         await store.put({ id: trackId, blob });
       });
     }
   }
 } catch (error) {
   throw error;
 }
}

function blobToBase64(blob: Blob): Promise<string> {
 return new Promise<string>((resolve, reject) => {
   const reader = new FileReader();
   reader.onloadend = () => {
     if (typeof reader.result === "string") {
       resolve(reader.result);
     } else {
       reject(new Error("Failed to convert Blob to Base64."));
     }
   };
   reader.onerror = () => reject(new Error("FileReader error during conversion."));
   reader.readAsDataURL(blob);
 });
}

export async function getOfflineBlob(trackId: string): Promise<Blob | undefined> {
  try {
    return await withTransaction('tracks', 'readonly', async (store) => {
      const request = await store.get(trackId);
      const result = (await request).result as TrackStore;

      
      if (result) {
        if (result.totalChunks) {
          const chunks: (Blob | string)[] = [];
          for (let i = 0; i < result.totalChunks; i++) {
            const chunkRequest = await store.get(`${trackId}_chunk_${i}`);
            const chunkData = (await chunkRequest).result as ChunkData;

            chunks.push(chunkData.data);
          }
          
          if (isSafari()) {
            const binaryChunks = chunks.map(chunk => {
              const base64 = (chunk as string).split(",")[1];
              const binary = atob(base64);
              return Uint8Array.from(binary, (char) => char.charCodeAt(0));
            });
            return new Blob(binaryChunks, { type: result.type });
          } else {
            return new Blob(chunks as Blob[], { type: result.type });
          }
        }
        
        if (isSafari() && typeof result.blob === "string") {
          const base64 = result.blob.split(",")[1];
          const binary = atob(base64);
          const array = Uint8Array.from(binary, (char) => char.charCodeAt(0));
          return new Blob([array]);
        } else if (result.blob instanceof Blob) {
          return result.blob;
        }
      }
      return undefined;
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}


export async function storePlaylist(pl: Playlist): Promise<void> {
 try {
   const safePL: Playlist = {
     ...pl,
     tracks: safeTracksArray(pl.tracks),
   };

   await withTransaction('playlists', 'readwrite', async (store) => {
     await store.put(safePL);
   });
 } catch (error) {
   throw error;
 }
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    return await withTransaction('playlists', 'readonly', async (store) => {
      const request = await store.getAll();
      return (await request).result as Playlist[];
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}

export async function deletePlaylistByName(name: string): Promise<Playlist[]> {
 try {
   await withTransaction('playlists', 'readwrite', async (store) => {
     await store.delete(name);
   });
   return await getAllPlaylists();
 } catch (error) {
   throw error;
 }
}

export async function storeRecentlyPlayed(track: Track, limit = 10): Promise<Track[]> {
 try {
   await withTransaction('recentlyPlayed', 'readwrite', async (store) => {
     await store.add({
       timestamp: Date.now(),
       track: safeTrackData(track),
     } as RecentlyPlayedEntry);
   });

   const all = await getRecentlyPlayed();
   const unique: Track[] = [];
   const seen = new Set<string>();
   for (const t of all) {
     if (!seen.has(t.id)) {
       unique.push(t);
       seen.add(t.id);
     }
     if (unique.length >= limit) break;
   }
   return unique;
 } catch (error) {
   throw error;
 }
}

export async function getRecentlyPlayed(): Promise<Track[]> {
  try {
    return await withTransaction('recentlyPlayed', 'readonly', async (store) => {
      const index = store.index("by_timestamp");
      const results: Track[] = [];

      return new Promise<Track[]>((resolve, reject) => {
        const request = index.openCursor(null, "prev");
        
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entry = cursor.value as RecentlyPlayedEntry;
            results.push(entry.track);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}

export async function storeListenCount(trackId: string, count: number): Promise<void> {
 try {
   await withTransaction('listenCounts', 'readwrite', async (store) => {
     await store.put({ id: trackId, count });
   });
 } catch (error) {
   throw error;
 }
}

export async function getListenCounts(): Promise<Record<string, number>> {
  try {
    return await withTransaction('listenCounts', 'readonly', async (store) => {
      const request = await store.getAll();
      const data = (await request).result as Array<{ id: string; count: number }>;
      const map: Record<string, number> = {};
      data.forEach((item) => {
        map[item.id] = item.count;
      });
      return map;
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}

export async function storeSetting(key: string, value: string): Promise<void> {
 try {
   await withTransaction('settings', 'readwrite', async (store) => {
     await store.put({ key, value });
   });
 } catch (error) {
   throw error;
 }
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    return await withTransaction('settings', 'readonly', async (store) => {
      const request = await store.get(key);
      const result = (await request).result as { value: string } | undefined;
      return result ? result.value : null;
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}

export async function storeQueue(queue: Track[]): Promise<void> {
 try {
   await withTransaction('queue', 'readwrite', async (store) => {
     await store.clear();
     for (const track of queue) {
       await store.put(safeTrackData(track));
     }
   });
 } catch (error) {
   throw error;
 }
}
export async function getQueue(): Promise<Track[]> {
  try {
    return await withTransaction('queue', 'readonly', async (store) => {
      return new Promise<Track[]>((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const result = request.result as Track[]; // Properly access the result here
          resolve(result || []); // Return an empty array if the result is null or undefined
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    });
  } catch (error) {
    await recoverFromTransactionError();
    throw error;
  }
}


export async function clearQueue(): Promise<void> {
 try {
   await withTransaction('queue', 'readwrite', async (store) => {
     await store.clear();
   });
 } catch (error) {
   throw error;
 }
}

export async function storeRecommendedTracks(tracks: Track[]): Promise<void> {
 try {
   const serialized = JSON.stringify(tracks);
   await storeSetting("recommendedTracks", serialized);
 } catch (error) {
   throw error;
 }
}

export async function getRecommendedTracks(): Promise<Track[] | null> {
 try {
   const data = await getSetting("recommendedTracks");
   return data ? JSON.parse(data) as Track[] : null;
 } catch (error) {
   throw error;
 }
}