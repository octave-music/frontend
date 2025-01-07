const LASTFM_API_KEY = "8e1e6d7765dcae40ff84dd4cbf601407";
const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

interface LastFmArtist {
    name: string;
    mbid: string;
    url: string;
    playcount: string;
    listeners: string;
  }
  
  interface LastFmTopArtistsResponse {
    artists: {
      artist: LastFmArtist[];
      '@attr': {
        page: string;
        perPage: string;
        total: string;
        totalPages: string;
      };
    };
  }
  
  export async function getTopArtists(limit = 6): Promise<string[]> {
    try {
      const response = await fetch(
        `${LASTFM_API_BASE}?method=chart.gettopartists&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`
      );
      const data = await response.json() as LastFmTopArtistsResponse;
      return data.artists.artist.map((artist: LastFmArtist) => artist.name);
    } catch (error) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }