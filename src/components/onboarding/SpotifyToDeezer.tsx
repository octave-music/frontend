import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Loader2, Music2 } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { storePlaylist } from "@/lib/managers/idbWrapper"; 
import { Playlist, Track } from "@/lib/types/types"; 

// Types
interface DeezerTrack {
  id: string;
  title: string;
  preview: string;
  artist: {
    name: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
  };
  album: {
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
}

interface ConvertedPlaylist {
  playlist_name: string;
  tracks: DeezerTrack[];
}

const API_BASE_URL = "https://api.octave.gold/api/convertPlaylist";

async function convertSpotifyToOctave(playlistUrl: string): Promise<ConvertedPlaylist> {
  const response = await fetch(`${API_BASE_URL}?url=${encodeURIComponent(playlistUrl)}`);
  if (!response.ok) {
    throw new Error("Failed to convert playlist");
  }
  return response.json();
}

interface SpotifyToDeezerProps {
  onClose: () => void;
  onPlaylistImported: () => void;
}

export const SpotifyToDeezer: React.FC<SpotifyToDeezerProps> = ({ onClose, onPlaylistImported }) => {
  const [playlistUrl, setPlaylistUrl] = useState<string>("");
  const [convertedPlaylist, setConvertedPlaylist] = useState<ConvertedPlaylist | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConversion = async () => {
    if (!playlistUrl.includes("spotify.com/playlist/")) {
      toast.error("Please enter a valid Spotify playlist URL");
      return;
    }

    setLoading(true);
    try {
      const converted = await convertSpotifyToOctave(playlistUrl);
      setConvertedPlaylist(converted);
      toast.success("Playlist converted successfully!");
    } catch (err) {
      console.error("Conversion error:", err);
      toast.error("Failed to convert playlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!convertedPlaylist) return;

    try {
      const octavePlaylist: Playlist = {
        name: convertedPlaylist.playlist_name || "Imported Spotify Playlist",
        image: convertedPlaylist.tracks[0]?.album.cover_xl || "/images/defaultPlaylistImage.png",
        tracks: convertedPlaylist.tracks.map((track): Track => ({
          id: track.id.toString(),
          title: track.title,
          artist: { name: track.artist.name },
          album: {
            title: track.album.title,
            cover_medium: track.album.cover_medium,
            cover_small: track.album.cover_small,
            cover_big: track.album.cover_big,
            cover_xl: track.album.cover_xl
          }
        }))
      };

      await storePlaylist(octavePlaylist);
      toast.success("Playlist imported successfully!");
      onPlaylistImported();
      onClose();
    } catch (err) {
      console.error("Migration error:", err);
      toast.error("Failed to import playlist");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black px-4 py-8">
      <div className="w-full max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-3xl font-bold text-center mb-8 text-white bg-clip-text">
          Spotify to Octave Conversion
        </div>

        {!convertedPlaylist ? (
          <div className="text-center py-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Music2 className="w-full h-full text-green-400 animate-pulse" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full px-4 py-3 bg-gray-800/50 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 outline-none transition-all duration-200"
              />
            </div>

            <button
              onClick={handleConversion}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Convert Playlist</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={convertedPlaylist.tracks[0]?.album.cover_xl || "/images/defaultPlaylistImage.png"}
              alt={convertedPlaylist.playlist_name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              priority
            />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <h3 className="text-xl font-bold text-white">{convertedPlaylist.playlist_name}</h3>
                <p className="text-gray-200">{convertedPlaylist.tracks.length} tracks</p>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
              {convertedPlaylist.tracks.map((track) => (
                <div 
                  key={track.id} 
                  className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <Image
                    src={track.album.cover_small}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="rounded"
                    priority
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{track.title}</p>
                    <p className="text-gray-400 text-sm truncate">{track.artist.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleMigrate}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              <Music2 className="w-5 h-5" />
              <span>Import to Octave</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyToDeezer;