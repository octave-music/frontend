/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import {
  Heart,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Music2,
  Info,
  Maximize2,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Share,
  Guitar,
  Crown,
  Star,
  Fan,
  CircleDollarSign,
} from 'lucide-react';

import DesktopSeekbar from './DesktopSeekbar';
import DesktopSidebar from './DesktopSidebar';

// ----- ADJUST THIS IMPORT TO MATCH YOUR PROJECT -----
import type { Track, Lyric } from '@/lib/types'; // or wherever your types are
// e.g.: import type { Track, Lyric } from '../../../types';

// Adjust these to match your actual enumerations
export type AudioQuality = 'MAX' | 'HIGH' | 'NORMAL' | 'DATA_SAVER';
export type RepeatMode = 'off' | 'all' | 'one';

interface DesktopPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  previousTracks: Track[];
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
  togglePlay: () => void;
  skipTrack: () => void | Promise<void>;
  previousTrack: () => void;
  seekPosition: number;
  duration: number;
  handleSeek: (time: number) => void;
  isLiked: boolean;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleLike: () => void;
  lyrics: Lyric[];               // Must match the exact same `Lyric` type used in DesktopSidebar
  currentLyricIndex: number;
  showLyrics: boolean;
  toggleLyricsView: () => void;
  shuffleOn: boolean;
  shuffleQueue: () => void;
  queue: Track[];
  currentTrackIndex: number;
  removeFromQueue: (_index: number) => void;
  onQueueItemClick: (track: Track, index: number) => void;
  setIsPlayerOpen: (_isOpen: boolean) => void;

  volume: number;
  onVolumeChange: (newVolume: number) => void;
  audioQuality: AudioQuality;
  onCycleAudioQuality: () => void;

  listenCount: number;
}

/**
 * Provide typed info for each audioQuality key:
 * - icon: which Lucide icon to display
 * - desc: optional text describing the quality
 */
const audioQualityIcons: Record<
  AudioQuality,
  { icon: React.FC<React.SVGProps<SVGSVGElement>>; desc: string }
> = {
  MAX: {
    icon: Crown,
    desc: 'Highest fidelity (24-bit, 192kHz)',
  },
  HIGH: {
    icon: Star,
    desc: 'High fidelity (16-bit, 44.1kHz)',
  },
  NORMAL: {
    icon: Fan,
    desc: 'Normal (320kbps AAC)',
  },
  DATA_SAVER: {
    icon: CircleDollarSign,
    desc: 'Data Saver (128kbps AAC)',
  },
};

export default function DesktopPlayer({
  currentTrack,
  isPlaying,
  togglePlay,
  skipTrack,
  previousTrack,
  seekPosition,
  duration,
  handleSeek,
  isLiked,
  toggleLike,
  lyrics,
  currentLyricIndex,
  repeatMode,
  setRepeatMode,
  shuffleOn,
  shuffleQueue,
  queue,
  setQueue,
  onQueueItemClick,
  audioQuality,
  onCycleAudioQuality,
  volume,
  onVolumeChange,
  listenCount,
  toggleLyricsView,
  currentTrackIndex,
  removeFromQueue,
  showLyrics,
}: DesktopPlayerProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentTab, setTab] = useState<'queue' | 'lyrics' | 'details'>('queue');

  // If volume is 0, treat as muted:
  const isMuted = volume === 0;

  // Grab the icon and description from the typed object above
  const { icon: AudioQualityIcon, desc: audioQualityDesc } = audioQualityIcons[audioQuality];

  const audioQualityIcon = <AudioQualityIcon className="w-5 h-5" />;

  const toggleMute = () => {
    if (isMuted) {
      onVolumeChange(1);
    } else {
      onVolumeChange(0);
    }
  };

  /**
   * Decide which volume icon to show
   */
  const VolumeIcon = () => {
    if (isMuted) return <VolumeX />;
    if (volume < 0.5) return <Volume1 />;
    return <Volume2 />;
  };

  /**
   * Toggle browser fullscreen
   */
  const enterFullScreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  /**
   * Clear the queue from the sidebar
   */
  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <>
      {/* Main bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-black/60 to-black/90 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-screen-2xl mx-auto px-4">
          {/* DesktopSeekbar */}
          <DesktopSeekbar
            progress={duration > 0 ? seekPosition / duration : 0}
            handleSeek={handleSeek}
            duration={duration}
          />

          <div className="h-20 flex items-center justify-between gap-4">
            {/* LEFT: track cover, title, artist, etc. */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {currentTrack && (
                <>
                  <div className="relative group">
                    <img
                      src={currentTrack.album.cover_medium}
                      alt={currentTrack.title}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                    <button
                      onClick={() => {
                        setShowSidebar(true);
                        setTab('details');
                      }}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Info className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
                    <p className="text-neutral-400 text-sm truncate">{currentTrack.artist.name}</p>
                    <p className="text-[#FFD700] text-xs mt-1 flex items-center space-x-1">
                      <Guitar className="w-4 h-4 inline-block" />
                      <span>{listenCount}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleLike}
                      className={`p-2 rounded-full hover:bg-white/10 ${
                        isLiked ? 'text-green-400' : 'text-neutral-400'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                    <button
                      onClick={enterFullScreen}
                      className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
                      <Share className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* CENTER: playback controls */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={shuffleQueue}
                  className={`p-2 rounded-full hover:bg-white/10 ${
                    shuffleOn ? 'text-green-400' : 'text-neutral-400'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button
                  onClick={previousTrack}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-black" />
                  ) : (
                    <Play className="w-5 h-5 text-black translate-x-0.5" />
                  )}
                </button>
                <button
                  onClick={skipTrack}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setRepeatMode(
                      repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off'
                    )
                  }
                  className={`p-2 rounded-full hover:bg-white/10 ${
                    repeatMode !== 'off' ? 'text-green-400' : 'text-neutral-400'
                  }`}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT: lyrics, queue, audio quality, volume */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <button
                onClick={() => {
                  toggleLyricsView();
                  setShowSidebar(true);
                  setTab('lyrics');
                }}
                className={`p-2 rounded-full hover:bg-white/10 ${
                  showLyrics ? 'text-green-400' : 'text-neutral-400'
                }`}
              >
                <Music2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowSidebar(true);
                  setTab('queue');
                }}
                className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
              >
                <ListMusic className="w-5 h-5" />
              </button>

              <button
                onClick={onCycleAudioQuality}
                className="p-2 rounded-full hover:bg-white/10 text-white flex items-center justify-center"
              >
                {audioQualityIcon}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 min-w-[140px]">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <VolumeIcon />
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
          </div>
        </div>
      </div>

      {/* Sidebar (Queue / Lyrics / Details) */}
      <DesktopSidebar
        showSidebar={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentTab={currentTab}
        setTab={setTab}
        // queue tab
        queue={queue}
        currentTrackIndex={currentTrackIndex}
        currentTrack={currentTrack}
        removeFromQueue={removeFromQueue}
        onQueueItemClick={onQueueItemClick}
        clearQueue={clearQueue}
        // lyrics tab
        lyrics={lyrics}
        currentLyricIndex={currentLyricIndex}
        duration={duration}
        seekPosition={seekPosition}
        handleSeek={handleSeek}
        // details tab
        listenCount={listenCount}
        volume={volume}
        onVolumeChange={onVolumeChange}
        isMuted={isMuted}
        toggleMute={toggleMute}
        audioQualityIcon={audioQualityIcon}
        audioQuality={audioQuality}
        audioQualityDesc={audioQualityDesc}
        onCycleAudioQuality={onCycleAudioQuality}
      />
    </>
  );
}
