/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/SpotifyClone/DesktopPlayer/DetailsTab.tsx
import React from 'react';
import { Track } from '@/lib/types'; // or your interface location
import {
  Share, Download, Library, Radio, UserPlus, Ban, Star, Flag, AlertCircle,
  Lock, Mic2, Plus, Disc, User, ListX, Cast, Airplay, Guitar, VolumeX, Volume1, Volume2
} from 'lucide-react';
import { formatTimeDesktop } from './utils';

interface DetailsTabProps {
  currentTrack: Track;
  duration: number;
  listenCount: number;
  isMuted: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  onCycleAudioQuality: () => void;
  audioQualityIcon: JSX.Element;
  audioQuality: string;
  audioQualityDesc: string;
  toggleMute: () => void;
  // etc. if you want
}

/**
 * Renders your album cover, "About" info, "Actions" area, 
 * extra buttons, volume, audio quality, etc.
 */
export default function DetailsTab({
  currentTrack,
  duration,
  listenCount,
  isMuted,
  volume,
  onVolumeChange,
  onCycleAudioQuality,
  audioQualityIcon,
  audioQuality,
  audioQualityDesc,
  toggleMute,
}: DetailsTabProps) {
  return (
    <div className="p-4 space-y-6">
      <div>
        <img
          src={currentTrack.album.cover_xl}
          alt={currentTrack.title}
          className="w-full aspect-square rounded-lg object-cover"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{currentTrack.title}</h2>
          <p className="text-neutral-400">{currentTrack.artist.name}</p>
          <p className="text-[#FFD700] text-xs mt-1 flex items-center space-x-1">
            <Guitar className="w-4 h-4 inline-block" />
            <span>Listened {listenCount} times</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex-1 py-2.5 px-4 rounded-full bg-white text-black font-medium hover:bg-neutral-200 transition-colors">
            Add to Playlist
          </button>
          <button className="p-2.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
            <Share className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-medium mb-2">About</h3>
          <div className="space-y-2 text-sm">
            <p className="text-neutral-400">Album • {currentTrack.album.title}</p>
            <p className="text-neutral-400">Duration • {formatTimeDesktop(duration)}</p>
          </div>
        </div>

        {/* Additional icons section */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-medium mb-2">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {/* you can map these out, or keep them inline */}
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <Library className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <Radio className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <UserPlus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <Ban className="w-5 h-5" />
            </button>
            {/* ... etc. */}
            <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
              <Airplay className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Volume control in details tab */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-medium mb-2">Volume</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
            >
              {isMuted ? <VolumeX /> : volume < 0.5 ? <Volume1 /> : <Volume2 />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-white"
            />
          </div>
        </div>

        {/* Audio Quality Info */}
        <div className="pt-4 border-t border-white/10">
          <h3 className="text-white font-medium mb-2">Audio Quality</h3>
          <button
            onClick={onCycleAudioQuality}
            className="inline-flex items-center space-x-2 px-4 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-700 text-white"
          >
            {audioQualityIcon}
            <span>{audioQuality}</span>
          </button>
          <p className="text-sm text-neutral-400 mt-2">{audioQualityDesc}</p>
        </div>
      </div>
    </div>
  );
}
