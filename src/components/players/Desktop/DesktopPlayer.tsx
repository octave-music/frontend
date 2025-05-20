// src/components/player/Desktop/DesktopPlayer.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Track, Lyric } from "@/lib/types/types";
import { AudioQuality, RepeatMode } from "./types"; // Adjust path} // Adjust path

// Import hooks and utility
import { useAutoScrollLyrics } from "@/lib/hooks/useAutoScrollLyrics"; // Adjust path

// Import child components
import DesktopSeekbar from "./DesktopSeekbar";
import LyricsPanel from "./LyricsPanel";
import QueuePanel from "./QueuePanel"; // Export QueuePanelProps if needed elsewhere
import DetailsPanel from "./DetailsPanel";
import SidebarOverlay, { SidebarTab } from "./SidebarOverlay";
import DesktopPlayerControls from "./DesktopPlayerControls";
import DesktopPlayerMinimized from "./DesktopPlayerMinimized";

// Props for the main DesktopPlayer component remain the same
export interface DesktopPlayerProps {
  currentTrack: Track | null; // Allow null
  isPlaying: boolean;
  lyricsLoading: boolean;
  previousTracks: Track[]; // Keep if used by logic within DesktopPlayer, otherwise can be removed if only for previousTrack fn
  previousTrack: () => void; // This is the direct function call
  togglePlay: () => void;
  skipTrack: () => void | Promise<void>;
  seekPosition: number;
  duration: number;
  handleSeek: (time: number) => void;
  isLiked: boolean; // Liked state for the current track
  toggleLike: () => void; // Action to toggle like for the current track
  lyrics: Lyric[];
  currentLyricIndex: number;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  shuffleOn: boolean;
  shuffleQueue: () => void;
  queue: Track[];
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
  onQueueItemClick: (track: Track, index: number) => void;
  volume: number;
  onVolumeChange: (newVolume: number) => void;
  listenCount: number;
  downloadTrack: (track: Track) => void;
  showLyrics: boolean; // For lyrics panel visibility and button state
  toggleLyricsView: () => void; // To toggle the state for lyrics visibility
  currentTrackIndex: number;
  removeFromQueue: (index: number) => void;
  audioQuality: AudioQuality;
  isDataSaver: boolean; // Or derive from audioQuality
  changeAudioQuality: (quality: AudioQuality) => Promise<void>;
}


export default function DesktopPlayer(props: DesktopPlayerProps) {
  const {
    currentTrack, isPlaying, lyricsLoading, previousTrack: propsPreviousTrack, togglePlay,
    skipTrack, seekPosition, duration, handleSeek, isLiked, toggleLike, lyrics,
    currentLyricIndex, repeatMode, setRepeatMode, shuffleOn, shuffleQueue, queue,
    setQueue, onQueueItemClick, volume, onVolumeChange, listenCount, downloadTrack,
    showLyrics, toggleLyricsView, currentTrackIndex, removeFromQueue, audioQuality,
    isDataSaver, changeAudioQuality
  } = props;

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>("queue");
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(false);
  
  const backClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DOUBLE_CLICK_DELAY = 300;

  const handleBackButtonClick = useCallback(() => {
    if (backClickTimerRef.current) {
      clearTimeout(backClickTimerRef.current);
      backClickTimerRef.current = null;
      propsPreviousTrack(); // Double click: previous track
    } else {
      backClickTimerRef.current = setTimeout(() => {
        handleSeek(0); // Single click: restart current track
        backClickTimerRef.current = null;
      }, DOUBLE_CLICK_DELAY);
    }
  }, [handleSeek, propsPreviousTrack]);

  const {
    lyricsRef,
    userScrolling,
    handleUserScroll,
    lyricProgress,
    processedLyrics,
  } = useAutoScrollLyrics(
    showLyrics && showSidebar && activeSidebarTab === 'lyrics', // Only active if lyrics tab is shown in sidebar
    currentLyricIndex,
    lyrics,
    duration,
    seekPosition
  );

  const handleToggleRepeatMode = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleToggleMute = () => {
    onVolumeChange(volume === 0 ? 0.7 : 0); // Assuming 0.7 is a default non-mute volume
  };
  
  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error("Error attempting to exit full-screen mode:", err));
      }
    }
  };

  const handleOpenSidebar = (tab: SidebarTab) => {
    setActiveSidebarTab(tab);
    setShowSidebar(true);
  };


  // Effect to close sidebar if player becomes collapsed
  useEffect(() => {
    if (isPlayerCollapsed && showSidebar) {
      setShowSidebar(false);
    }
  }, [isPlayerCollapsed, showSidebar]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95 backdrop-blur-lg border-t border-white/10 shadow-2xl z-50">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4"> {/* Responsive padding */}
          {isPlayerCollapsed ? (
            <DesktopPlayerMinimized
              seekPosition={seekPosition}
              duration={duration}
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onSkipTrack={skipTrack}
              onPreviousTrack={handleBackButtonClick}
              onHandleSeek={handleSeek}
              onSetCollapsed={setIsPlayerCollapsed}
            />
          ) : (
            <>
              <DesktopSeekbar
                progress={duration > 0 ? seekPosition / duration : 0}
                handleSeek={handleSeek}
                duration={duration}
              />
              <DesktopPlayerControls
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                isLiked={isLiked}
                shuffleOn={shuffleOn}
                repeatMode={repeatMode}
                showLyrics={showLyrics && activeSidebarTab === 'lyrics' && showSidebar} // For button highlight
                volume={volume}
                listenCount={listenCount}
                onTogglePlay={togglePlay}
                onSkipTrack={skipTrack}
                onPreviousTrack={handleBackButtonClick}
                onToggleLike={toggleLike}
                onShuffleQueue={shuffleQueue}
                onToggleRepeatMode={handleToggleRepeatMode}
                onToggleLyricsView={toggleLyricsView} // This toggles the underlying state
                onToggleFullScreen={handleToggleFullScreen}
                onVolumeChange={onVolumeChange}
                onToggleMute={handleToggleMute}
                onOpenSidebar={handleOpenSidebar}
                onSetCollapsed={setIsPlayerCollapsed}
              />
            </>
          )}
        </div>
      </div>

      <SidebarOverlay
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        activeTab={activeSidebarTab}
        setActiveTab={setActiveSidebarTab}
        // tabsConfig can be passed if different from default
        queuePanelSlot={
          <QueuePanel
            queue={queue}
            currentTrack={currentTrack}
            currentTrackIndex={currentTrackIndex}
            onQueueItemClick={onQueueItemClick}
            removeFromQueue={removeFromQueue}
            setQueue={setQueue}
          />
        }
        lyricsPanelSlot={
          <LyricsPanel
            currentTrack={currentTrack}
            lyricsLoading={lyricsLoading}
            currentLyricIndex={currentLyricIndex}
            handleSeek={handleSeek}
            lyricsRef={lyricsRef}
            handleUserScroll={handleUserScroll}
            processedLyrics={processedLyrics}
            lyricProgress={lyricProgress}
            userScrolling={userScrolling}
          />
        }
        detailsPanelSlot={
          <DetailsPanel
            currentTrack={currentTrack}
            duration={duration}
            listenCount={listenCount}
            volume={volume}
            onVolumeChange={onVolumeChange}
            audioQuality={audioQuality}
            changeAudioQuality={changeAudioQuality}
            isDataSaver={isDataSaver}
            downloadTrack={downloadTrack}
            isLikedCurrentTrack={isLiked} // Pass down the liked state for the current track
            toggleLikeCurrentTrack={toggleLike} // Pass down the toggle like action
          />
        }
      />
    </>
  );
}