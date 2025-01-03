import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Loader2, Music2 } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { storePlaylist } from "@/lib/managers/idbWrapper"; 
import { Playlist } from "@/lib/types/types"; 

// Types
interface SpotifyTrack {
  id: string;
  title: string;
  duration: number;
  explicit_content_cover: boolean;
  explicit_content_lyrics: boolean;
  explicit_lyrics: boolean;
  link: string;
  md5_image: string;
  preview: string;
  rank: number;
  readable: boolean;
  title_short: string;
  title_version: string;
  type: string;
  name: string;
  artist: {
    id: string;
    link: string;
    picture: string;
    picture_big: string;
    picture_medium: string;
    picture_small: string;
    picture_xl: string;
    tracklist: string;
    type: string;
    name: string;
  };
  album: {
    id: string;
    title: string;
    cover_big: string;
    cover_medium: string;
    cover_small: string;
    md5_image: string;
    tracklist: string;
    type: string;
    cover_xl: string;
    name: string;
    cover: string;
  };
}

interface SpotifyPlaylist {
  name: string;
  tracks: SpotifyTrack[];
}

const API_BASE_URL = "https://mbck.cloudgen.xyz/api/convertPlaylist";

async function convertSpotifyToOctave(playlistUrl: string) {
  try {
    const response = await fetch(`${API_BASE_URL}?url=${encodeURIComponent(playlistUrl)}`);
    if (!response.ok) throw new Error("Failed to convert playlist");
    return await response.json();
  } catch (err) {
    console.error("Error converting playlist:", err);
    throw err;
  }
}

export const SpotifyToDeezer = () => {
  const [playlistUrl, setPlaylistUrl] = useState<string>("");
  const [octavePlaylist, setOctavePlaylist] = useState<SpotifyPlaylist | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConversion = async () => {
    setLoading(true);
    try {
      const convertedPlaylist = await convertSpotifyToOctave(playlistUrl);
      setOctavePlaylist(convertedPlaylist);
      await storePlaylist(convertedPlaylist);
      toast.success("Playlist converted successfully!");
    } catch (err) {
      toast.error("Failed to convert playlist");
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (octavePlaylist) {
      const playlist: Playlist = {
        name: octavePlaylist.tracks[0]?.album.name || "Unknown Playlist",
        image: octavePlaylist.tracks[0]?.album.cover_xl || "/api/placeholder/400/225",
        tracks: octavePlaylist.tracks.map((track) => ({
          id: track.id.toString(),
          title: track.title,
          artist: {
            id: track.artist.id,
            name: track.artist.name,
            link: track.artist.link,
            picture: track.artist.picture,
            picture_big: track.artist.picture_big,
            picture_medium: track.artist.picture_medium,
            picture_small: track.artist.picture_small,
            picture_xl: track.artist.picture_xl,
            tracklist: track.artist.tracklist,
            type: track.artist.type,
          },
          album: {
            id: track.album.id,
            title: track.album.title,
            cover: track.album.cover,
            cover_big: track.album.cover_big,
            cover_medium: track.album.cover_medium,
            cover_small: track.album.cover_small,
            cover_xl: track.album.cover_xl,
            md5_image: track.album.md5_image,
            tracklist: track.album.tracklist,
            type: track.album.type,
          },
          duration: track.duration,
          explicit_content_cover: track.explicit_content_cover,
          explicit_content_lyrics: track.explicit_content_lyrics,
          explicit_lyrics: track.explicit_lyrics,
          link: track.link,
          md5_image: track.md5_image,
          preview: track.preview,
          rank: track.rank,
          readable: track.readable,
          title_short: track.title_short,
          title_version: track.title_version,
          type: track.type,
        })),
      };
      
      console.log("Migrating playlist:", playlist);
      await storePlaylist(playlist);
      toast.success("Playlist migrated successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black px-4 py-8">
      <div className="w-full max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-3xl font-bold text-center mb-8 text-white bg-clip-text">
          Spotify to Octave Conversion
        </div>

        {!octavePlaylist && (
          <div className="text-center py-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Music2 className="w-full h-full text-green-400 animate-pulse" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Convert Your Spotify Playlist to Octave
            </h2>
            <p className="text-gray-400 mb-8">
              Enter your Spotify playlist URL to get started with the conversion process
            </p>
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Enter Spotify Playlist URL"
              className="w-full px-4 py-2 mb-4 text-gray-900 rounded-full"
            />
            <button
              onClick={handleConversion}
              disabled={loading}
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
              ) : (
                <ArrowRight className="w-6 h-6 mr-3" />
              )}
              Convert Playlist
            </button>
          </div>
        )}

        {octavePlaylist && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-4">Converted Playlist</h3>
            <div className="bg-gray-800/40 rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-700">
              <div className="relative aspect-video">
                <Image
                  src={octavePlaylist.tracks[0]?.album.cover_xl || "/api/placeholder/400/225"}
                  alt={octavePlaylist.name}
                  fill
                  className="object-cover brightness-90 blur-sm group-hover:brightness-110 group-hover:blur-none transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={handleMigrate}
                      className="inline-flex items-center bg-white/90 hover:bg-white text-gray-900 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Migrate to Octave
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg text-white truncate">
                  {octavePlaylist.name}
                </h3>
                <p className="text-gray-400">
                  {octavePlaylist.tracks.length} tracks
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyToDeezer;
