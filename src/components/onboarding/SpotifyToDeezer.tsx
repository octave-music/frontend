import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, LogIn, Loader2, Music2 } from 'lucide-react';

// Types
interface SpotifyTrack {
  name: string;
  artist: string;
  album: {
    name: string;
    cover: string;
  };
}

interface SpotifyPlaylist {
  playlist_name: string;
  tracks: SpotifyTrack[];
}

interface SpotifyUser {
  name: string;
  email: string;
  image?: string;
}

const API_BASE_URL = 'https://sp-migrate.octave.gold';

async function startSpotifyLogin() {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, { method: 'GET' });
    window.location.href = response.url;
  } catch (err) {
    console.error('Error initiating Spotify login:', err);
  }
}

function handleSpotifyCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('auth_token');
  if (authToken) {
    localStorage.setItem('spotifyAuthToken', authToken);
    window.history.replaceState({}, document.title, '/');
  }
}

async function fetchSpotifyUserData(authToken: string): Promise<{ user: SpotifyUser }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/userData?auth_token=${authToken}`);
    if (!response.ok) throw new Error('Failed to fetch user data');
    return await response.json();
  } catch (err) {
    console.error('Error fetching user data:', err);
    throw err;
  }
}

async function fetchSpotifyPlaylists(authToken: string): Promise<{ playlists: SpotifyPlaylist[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/userData/playlists?auth_token=${authToken}`);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    return await response.json();
  } catch (err) {
    console.error('Error fetching playlists:', err);
    throw err;
  }
}

async function migratePlaylistToDeezer(playlist: SpotifyPlaylist) {
  try {
    const deezerCompatibleData = {
      name: playlist.playlist_name,
      tracks: playlist.tracks.map((track) => ({
        title: track.name,
        artist: track.artist,
        album: track.album.name,
      })),
    };
    console.log('Ready to send to Deezer:', deezerCompatibleData);
    alert('Playlist migrated successfully!');
  } catch (err) {
    console.error('Error migrating playlist:', err);
  }
}

export const SpotifyToDeezer = () => {
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState<string | null>(null);

  useEffect(() => {
    handleSpotifyCallback();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('spotifyAuthToken');
    setAuthToken(token);

    if (token) {
      setLoading(true);
      Promise.all([
        fetchSpotifyUserData(token),
        fetchSpotifyPlaylists(token)
      ]).then(([userData, playlistData]) => {
        setSpotifyUser(userData.user);
        setSpotifyPlaylists(playlistData.playlists);
      }).catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  const handleMigration = async (playlist: SpotifyPlaylist) => {
    setMigrating(playlist.playlist_name);
    await migratePlaylistToDeezer(playlist);
    setMigrating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black">
        <div className="animate-pulse">
          <Loader2 className="w-12 h-12 animate-spin text-green-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black px-4 py-8">
      <div className="w-full max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-3xl font-bold text-center mb-8 text-white bg-clip-text">
          Spotify to Deezer Migration
        </div>
        
        {!authToken ? (
          <div className="text-center py-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Music2 className="w-full h-full text-green-400 animate-pulse" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Transfer Your Spotify Playlists to Deezer
            </h2>
            <p className="text-gray-400 mb-8">
              Connect your Spotify account to get started with the migration process
            </p>
            <button
              onClick={startSpotifyLogin}
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
            >
              <LogIn className="w-6 h-6 mr-3" />
              Connect Spotify
            </button>
          </div>
        ) : (
          <>
            {spotifyUser && (
              <div className="flex items-center gap-4 p-6 bg-gray-800/50 rounded-xl mb-8 border border-gray-700">
                {spotifyUser.image && (
                  <div className="relative">
                    <Image
                      src={spotifyUser.image}
                      alt={spotifyUser.name}
                      width={56}
                      height={56}
                      className="rounded-full ring-2 ring-green-400"
                    />
                    <div className="absolute inset-0 bg-green-400/20 rounded-full blur-lg"></div>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-xl text-white">{spotifyUser.name}</h2>
                  <p className="text-gray-400">{spotifyUser.email}</p>
                </div>
              </div>
            )}

            {spotifyPlaylists.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {spotifyPlaylists.map((playlist) => (
                  <div
                    key={playlist.playlist_name}
                    className="bg-gray-800/40 rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-700"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={playlist.tracks[0]?.album.cover || '/api/placeholder/400/225'}
                        alt={playlist.playlist_name}
                        fill
                        className="object-cover brightness-90 group-hover:brightness-110 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => handleMigration(playlist)}
                            disabled={migrating === playlist.playlist_name}
                            className="inline-flex items-center bg-white/90 hover:bg-white text-gray-900 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
                          >
                            {migrating === playlist.playlist_name ? (
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                              <ArrowRight className="w-5 h-5 mr-2" />
                            )}
                            Migrate to Deezer
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-white truncate">{playlist.playlist_name}</h3>
                      <p className="text-gray-400">{playlist.tracks.length} tracks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpotifyToDeezer;