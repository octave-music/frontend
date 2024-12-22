// src/components/SpotifyClone/DesktopPlayer/DesktopSidebar.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

import QueueTab from './QueueTab';
import LyricsTab from './LyricsTab';
import DetailsTab from './DetailsTab';

import { ListMusic, Music2, Info } from 'lucide-react';
import { Track, Lyric } from '@/lib/types';

interface DesktopSidebarProps {
  showSidebar: boolean;
  onClose: () => void;

  // tabs
  currentTab: 'queue' | 'lyrics' | 'details';
  setTab: (tab: 'queue' | 'lyrics' | 'details') => void;

  // queue data
  queue: Track[];
  currentTrackIndex: number;
  currentTrack?: Track | null;
  removeFromQueue: (index: number) => void;
  onQueueItemClick: (track: Track, index: number) => void;
  clearQueue: () => void;

  // lyrics data
  lyrics: Lyric[];
  currentLyricIndex: number;
  duration: number;
  seekPosition: number;
  handleSeek: (time: number) => void;

  // details data
  listenCount: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  audioQualityIcon: JSX.Element;
  audioQuality: string;
  audioQualityDesc: string;
  onCycleAudioQuality: () => void;
}

const TABS = [
  { id: 'queue', label: 'Queue', icon: ListMusic },
  { id: 'lyrics', label: 'Lyrics', icon: Music2 },
  { id: 'details', label: 'Details', icon: Info },
] as const;

export default function DesktopSidebar({
  showSidebar,
  onClose,
  currentTab,
  setTab,

  queue,
  currentTrackIndex,
  currentTrack,
  removeFromQueue,
  onQueueItemClick,
  clearQueue,

  lyrics,
  currentLyricIndex,
  duration,
  seekPosition,
  handleSeek,

  listenCount,
  volume,
  onVolumeChange,
  isMuted,
  toggleMute,
  audioQualityIcon,
  audioQuality,
  audioQualityDesc,
  onCycleAudioQuality,
}: DesktopSidebarProps) {
  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 z-50"
        >
          <motion.div
            id="sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 40, stiffness: 400 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[500px] bg-neutral-900 border-l border-white/10"
          >
            <div className="h-full flex flex-col">
              {/* HEADER: Tab buttons + Close */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id as typeof currentTab)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                        t.id === currentTab
                          ? 'bg-white/20 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <t.icon className="w-5 h-5" />
                      {t.label}
                    </button>
                  ))}
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CONTENT (Tabs) */}
              <div className="flex-1 overflow-hidden">
                <SimpleBar style={{ maxHeight: '100%' }} className="h-full">
                  {currentTab === 'queue' && (
                    <QueueTab
                      queue={queue}
                      currentTrackIndex={currentTrackIndex}
                      currentTrackId={currentTrack?.id}
                      removeFromQueue={removeFromQueue}
                      onQueueItemClick={onQueueItemClick}
                      clearQueue={clearQueue}
                    />
                  )}
                  {currentTab === 'lyrics' && (
                    <LyricsTab
                      lyrics={lyrics}
                      currentLyricIndex={currentLyricIndex}
                      seekPosition={seekPosition}
                      duration={duration}
                      handleSeek={handleSeek}
                    />
                  )}
                  {currentTab === 'details' && currentTrack && (
                    <DetailsTab
                      currentTrack={currentTrack}
                      duration={duration}
                      listenCount={listenCount}
                      isMuted={isMuted}
                      volume={volume}
                      onVolumeChange={onVolumeChange}
                      onCycleAudioQuality={onCycleAudioQuality}
                      audioQualityIcon={audioQualityIcon}
                      audioQuality={audioQuality}
                      audioQualityDesc={audioQualityDesc}
                      toggleMute={toggleMute}
                    />
                  )}
                </SimpleBar>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
