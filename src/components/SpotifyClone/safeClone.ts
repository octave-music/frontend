// src/components/SpotifyClone/safeClone.ts

export default function safeClone<T>(obj: T): T {
    const cache = new Set();
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            // Circular reference found, discard key
            return undefined;
          }
          cache.add(value);
        }
  
        // Exclude React's Fiber properties
        if (key.startsWith('__react')) return undefined;
  
        // Exclude global objects or anything suspicious
        if (value === window) return undefined;
  
        return value;
      })
    );
  }
  