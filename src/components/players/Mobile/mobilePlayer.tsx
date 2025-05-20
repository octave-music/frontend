// src/components/player/Mobile/MobilePlayer.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useAnimation } from "framer-motion";
import Image from "next/image"; // Keep for direct use if any, or ensure subcomponents handle it
import { toast } from "react-toastify";
import {
  Heart, Play, Pause, SkipBack, SkipForward, ChevronDown, Music, Download, Share2,
  Radio, Plus, Library, Shuffle, Repeat, Repeat1, Mic2, ListMusic, ArrowLeft,
  MoreHorizontal, Cast, Airplay, Ban, Crown, Fan, CircleDollarSign, Share, Star,
  Flag, AlertCircle, Lock, UserPlus, Guitar
} from "lucide-react"; // Keep for MoreOptionsMenu or direct use

import { Track, Lyric } from "@/lib/types/types"; // Adjust path
import { AudioQuality, RepeatMode } from "./types";
import { ProcessedLyric } from "@/lib/hooks/useAutoScrollLyrics";

// Import new components
import MobileSeekbar from "./MobileSeekbar";
import MobileQualityBadge from "./MobileQualityBadge";
import MobileActionButton from "./MobileActionButton"; // Import MoreOptionItem type
import MobilePlayerMini from "./MobilePlayerMini";
import MobilePlayerExpandedHeader from "./MobilePlayerExpandedHeader";
import MobilePlayerQueueView from "./MobilePlayerQueueView";
import MobilePlayerLyricsView from "./MobilePlayerLyricsView";
import MobilePlayerExpandedArtworkInfo from "./MobilePlayerExpandedArtworkInfo";
import MobilePlayerExpandedMainControls from "./MobilePlayerExpandedMainControls";
import MobileAudioQualityMenu from "./MobileAudioQualityMenu";
import MobileMoreOptionsMenu, { type MoreOptionItem } from "./MobileMoreOptionsMenu";
// fmtTime is now a utility, import if needed directly or assume subcomponents use it
// import { fmtTime } from "@/lib/utils/fmtTime";


// Props for the main MobilePlayer component remain the same
interface MobilePlayerProps {
  currentTrack: Track | null; // Allow null for initial state
  isPlaying: boolean;
  previousTracks: Track[];
  lyricsLoading: boolean;
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
  togglePlay: () => void;
  skipTrack: () => void | Promise<void>;
  previousTrack: () => void;
  downloadTrack: (track: Track) => Promise<void>;
  seekPosition: number;
  duration: number;
  handleSeek: (time: number) => void;
  isLiked: boolean;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleLike: () => void;
  removeFromQueue: (index: number) => void;
  lyrics: Lyric[];
  currentLyricIndex: number;
  showLyrics: boolean; // State for if lyrics *view* is active
  toggleLyricsView: () => void; // Action to toggle lyrics *view* state
  shuffleOn: boolean;
  shuffleQueue: () => void;
  queue: Track[];
  currentTrackIndex: number; // Index of currentTrack in queue
  onQueueItemClick: (track: Track, index: number) => void;
  setIsPlayerOpen: (isOpen: boolean) => void; // To notify parent (e.g., App layout)
  listenCount: number;
  audioQuality: AudioQuality;
  isDataSaver: boolean;
  changeAudioQuality: (quality: AudioQuality) => Promise<void>;
}


const MobilePlayer: React.FC<MobilePlayerProps> = (props) => {
  const {
    currentTrack, isPlaying, previousTracks, lyricsLoading, setQueue, togglePlay,
    skipTrack: propsSkipTrack, previousTrack: propsPreviousTrack, downloadTrack,
    seekPosition, duration, handleSeek, isLiked, repeatMode, setRepeatMode,
    toggleLike, removeFromQueue, lyrics, currentLyricIndex, showLyrics,
    toggleLyricsView, shuffleOn, shuffleQueue, queue, currentTrackIndex,
    onQueueItemClick, setIsPlayerOpen, listenCount, audioQuality, isDataSaver,
    changeAudioQuality,
  } = props;

  const [isExpanded, setIsExpanded] = useState(false); // Player expanded state
  const [showMoreOptionsSheet, setShowMoreOptionsSheet] = useState(false);
  const [showAudioMenuSheet, setShowAudioMenuSheet] = useState(false);
  const [showQueueSheet, setShowQueueSheet] = useState(false); // For full screen queue
  // showLyrics prop from parent now dictates if the lyrics *view* is active.
  // If lyrics are active, neither queue nor main artwork info is shown.

  const [miniPlayerTouchStartY, setMiniPlayerTouchStartY] = useState<number | null>(null);
  const [dominantColor, setDominantColor] = useState<string | null>("#18181b"); // Dark default

  // Lyrics scroll management
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingLyricsRef = useRef(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null); // For the lyrics container itself
  const [userScrollingLyrics, setUserScrollingLyrics] = useState<boolean>(false);

  const [canShowExtraActionButtons, setCanShowExtraActionButtons] = useState(true); // For expanded player actions
  const [artworkScaleFactor, setArtworkScaleFactor] = useState(1); // For responsive scaling of artwork area

  const framerMiniPlayerControls = useAnimation(); // For mini player drag animations

  // Precompute lyric intervals (moved from original render body)
  const processedLyrics = useMemo<ProcessedLyric[]>(() => {
    return lyrics.map((lyric: Lyric, i: number) => ({
      ...lyric,
      endTime: lyrics[i + 1]?.time || duration,
    }));
  }, [lyrics, duration]);

  const currentLyricLineProgress = useMemo(() => {
    if (currentLyricIndex === -1 || !processedLyrics[currentLyricIndex] || duration === 0) return 0;
    const currentL = processedLyrics[currentLyricIndex];
    const start = currentL.time;
    const end = currentL.endTime; // Already calculated in processedLyrics
    const segmentDuration = end - start;
    if (segmentDuration <= 0) return 0;
    const elapsed = seekPosition - start;
    return Math.min(Math.max(elapsed / segmentDuration, 0), 1);
  }, [currentLyricIndex, processedLyrics, seekPosition, duration]);


  const handleUserLyricsScroll = useCallback(() => {
    if (isAutoScrollingLyricsRef.current) return;
    setUserScrollingLyrics(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrollingLyrics(false);
      // Optionally re-trigger auto-scroll after timeout if needed
    }, 3000);
  }, []);

  useEffect(() => {
    if (!userScrollingLyrics && showLyrics && isExpanded && lyricsContainerRef.current && currentLyricIndex >= 0) {
      const container = lyricsContainerRef.current;
      // Query for the active line based on a data attribute or specific class if possible
      // For simplicity, using children, but more robust selection is better
      const activeLine = container.children[currentLyricIndex] as HTMLElement;

      if (activeLine) {
        isAutoScrollingLyricsRef.current = true;
        const offsetTop = activeLine.offsetTop;
        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // Scroll to center the active line
        const scrollPos = offsetTop - (containerHeight / 2) + (activeLine.offsetHeight / 2);

        // Only scroll if the line is not already reasonably centered
        if (Math.abs(containerScrollTop - scrollPos) > activeLine.offsetHeight) {
            container.scrollTo({
                top: scrollPos,
                behavior: "smooth",
            });
        }
        
        setTimeout(() => {
          isAutoScrollingLyricsRef.current = false;
        }, 700); // Slightly longer to account for smooth scroll
      }
    }
  }, [userScrollingLyrics, showLyrics, isExpanded, currentLyricIndex, lyricsContainerRef]);


  useEffect(() => {
    if (!currentTrack?.album.cover_medium) {
      setDominantColor("#18181b"); // Dark zinc as default
      return;
    }
    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img: HTMLImageElement = new (window.Image as any)();
    img.crossOrigin = "Anonymous";
    img.src = currentTrack.album.cover_medium;
    img.onload = () => {
      if (isCancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) { setDominantColor("#18181b"); return; }
        canvas.width = 1; canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        setDominantColor(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        console.error("Error getting dominant color:", e);
        setDominantColor("#18181b");
      }
    };
    img.onerror = () => !isCancelled && setDominantColor("#18181b");
    return () => { isCancelled = true; };
  }, [currentTrack?.album.cover_medium]);

  useEffect(() => {
    const handleResize = () => {
      setCanShowExtraActionButtons(window.innerWidth > 380 && window.innerHeight > 650); // Adjusted thresholds
      // Artwork scaling logic
      const baselineWidth = 375; const baselineHeight = 667;
      const scaleW = window.innerWidth / baselineWidth;
      const scaleH = window.innerHeight / baselineHeight;
      setArtworkScaleFactor(Math.min(scaleW, scaleH, 1));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const moreOptionsSheetItems = useMemo<MoreOptionItem[]>(() => [
    { icon: Heart, label: "Like", active: isLiked, onClick: toggleLike, color: isLiked ? 'text-purple-400' : undefined },
    // { icon: Ban, label: "Dislike", onClick: () => console.log("Dislike action") },
    { icon: Share2, label: "Share", onClick: () => console.log("Share action") },
    { icon: UserPlus, label: "Artist", onClick: () => console.log("Go to artist") },
    { icon: Radio, label: "Radio", onClick: () => console.log("Start radio") },
    { icon: Library, label: "Add to...", onClick: () => console.log("Add to playlist modal") },
    { icon: Music, label: "Lyrics", active: showLyrics, onClick: () => { setShowQueueSheet(false); toggleLyricsView(); }},
    { icon: Download, label: "Download", onClick: () => currentTrack && downloadTrack(currentTrack) },
    { icon: Lock, label: "Quality", onClick: () => setShowAudioMenuSheet(true) },
    // { icon: Flag, label: "Report", onClick: () => console.log("Report action") },
  ], [isLiked, toggleLike, showLyrics, toggleLyricsView, currentTrack, downloadTrack]);

  const visibleActionButtons = useMemo<MoreOptionItem[]>(() => {
    if (!canShowExtraActionButtons || !currentTrack) return [];
    return [
      { icon: Heart, label: "Like", active: isLiked, onClick: toggleLike, color: isLiked ? 'text-purple-400' : undefined },
      { icon: Plus, label: "Add", onClick: () => console.log("Add to playlist modal") },
      { icon: Download, label: "Download", onClick: () => downloadTrack(currentTrack!) },
    ];
  }, [canShowExtraActionButtons, currentTrack, isLiked, toggleLike, downloadTrack]);

  const handlePlayerExpand = () => {
    setIsExpanded(true);
    setIsPlayerOpen(true); // Notify parent
  };
  const handlePlayerCollapse = () => {
    setIsExpanded(false);
    // Optional: Delay notifying parent to allow animation if player visibility is tied to this
    // setTimeout(() => setIsPlayerOpen(false), 300); 
    setIsPlayerOpen(false); // Notify parent
  };

  const backTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handlePreviousTrackWithDoubleClick = useCallback(() => {
    if (backTapTimerRef.current) {
      clearTimeout(backTapTimerRef.current);
      backTapTimerRef.current = null;
      propsPreviousTrack();
    } else {
      backTapTimerRef.current = setTimeout(() => {
        handleSeek(0);
        backTapTimerRef.current = null;
      }, 300);
    }
  }, [propsPreviousTrack, handleSeek]);

  const forwardTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSkipTrackWithDoubleClick = useCallback(() => {
    if (forwardTapTimerRef.current) {
        clearTimeout(forwardTapTimerRef.current);
        forwardTapTimerRef.current = null;
        propsSkipTrack(); // Double tap: skip track
    } else {
        forwardTapTimerRef.current = setTimeout(() => {
            // Single tap: go to end of track (or skip if close to end)
            const timeLeft = duration - seekPosition;
            if (timeLeft <= 5 && duration > 0) { // Skip if less than 5s left
                propsSkipTrack();
            } else if (duration > 0) {
                handleSeek(duration - 0.01); // Go to almost end
            }
            forwardTapTimerRef.current = null;
        }, 300);
    }
  }, [propsSkipTrack, duration, seekPosition, handleSeek]);


  const handleMiniPlayerDragEnd = (info: PanInfo) => {
    const threshold = 80; // Adjusted threshold
    if (info.offset.x > threshold) {
      framerMiniPlayerControls.start({ x: "100%", opacity: 0, transition: { duration: 0.2 } }).then(() => {
        propsPreviousTrack();
        framerMiniPlayerControls.set({ x: "-100%", opacity: 0 });
        framerMiniPlayerControls.start({ x: 0, opacity: 1, transition: { duration: 0.2 } });
      });
    } else if (info.offset.x < -threshold) {
      framerMiniPlayerControls.start({ x: "-100%", opacity: 0, transition: { duration: 0.2 } }).then(() => {
        propsSkipTrack();
        framerMiniPlayerControls.set({ x: "100%", opacity: 0 });
        framerMiniPlayerControls.start({ x: 0, opacity: 1, transition: { duration: 0.2 } });
      });
    } else {
      framerMiniPlayerControls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    }
  };
  const handleMiniPlayerTouchStart = (e: React.TouchEvent) => setMiniPlayerTouchStartY(e.touches[0].clientY);
  const handleMiniPlayerTouchMove = (e: React.TouchEvent) => {
    if (miniPlayerTouchStartY !== null) {
      const deltaY = miniPlayerTouchStartY - e.touches[0].clientY;
      if (deltaY > 40) { // Adjusted threshold
        handlePlayerExpand();
        setMiniPlayerTouchStartY(null);
      }
    }
  };
  const handleMiniPlayerTouchEnd = () => setMiniPlayerTouchStartY(null);
  
  const handleToggleRepeatMode = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  // If no current track, render nothing or a placeholder
  if (!currentTrack) {
    // Optionally, you could return a minimal placeholder if the player is "open" but no track
    // For now, returning null if no track.
    return null; 
  }

  return (
    // This outer div is the main container for the player, either mini or expanded
    // It's positioned at the bottom of the screen
    <div className="fixed bottom-[calc(var(--mobile-nav-height,3rem)+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40">
      {!isExpanded && (
        <MobilePlayerMini
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isLiked={isLiked}
          dominantColor={dominantColor}
          seekPosition={seekPosition}
          duration={duration}
          framerControls={framerMiniPlayerControls}
          onTogglePlay={togglePlay}
          onSkipTrack={handleSkipTrackWithDoubleClick}
          onPreviousTrack={handlePreviousTrackWithDoubleClick}
          onToggleLike={toggleLike}
          onHandleSeek={handleSeek}
          onExpandPlayer={handlePlayerExpand}
          onDragEnd={handleMiniPlayerDragEnd}
          onTouchStart={handleMiniPlayerTouchStart}
          onTouchMove={handleMiniPlayerTouchMove}
          onTouchEnd={handleMiniPlayerTouchEnd}
        />
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            layoutId="mobile-player"
          >
            {/* Scaled content container */}
            <div
              className="flex flex-col h-full w-full"
              style={{ transform: `scale(${artworkScaleFactor})`, transformOrigin: "top center" }}
            >
              <MobilePlayerExpandedHeader
                onCollapsePlayer={handlePlayerCollapse}
                onShowQueue={() => { toggleLyricsView(); setShowQueueSheet(true); }} // Hide lyrics if showing queue
                onShowMoreOptions={() => setShowMoreOptionsSheet(true)}
                canShowQueueButton={canShowExtraActionButtons}
              />

              {/* Main Content Area: Switches between Artwork/Info, Queue, or Lyrics */}
              <div className="flex-1 flex flex-col min-h-0 w-full"> {/* Ensure this takes up space and allows children to scroll */}
                {showQueueSheet ? (
                  <MobilePlayerQueueView
                    queue={queue}
                    previousTracks={previousTracks}
                    currentTrackId={currentTrack?.id}
                    onCloseQueue={() => setShowQueueSheet(false)}
                    onClearQueue={() => setQueue([])}
                    onQueueItemClick={onQueueItemClick}
                    onRemoveFromQueue={removeFromQueue}
                  />
                ) : showLyrics ? (
                  // Pass the ref to the actual scrollable div inside MobilePlayerLyricsView
                  <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto min-h-0 w-full">
                    <MobilePlayerLyricsView
                        lyrics={processedLyrics}
                        currentLyricIndex={currentLyricIndex}
                        lyricProgress={currentLyricLineProgress}
                        lyricsLoading={lyricsLoading}
                        onCloseLyrics={() => { toggleLyricsView(); /* Optionally close queue if it was a toggle */ setShowQueueSheet(false); }}
                        onSeekToLyricTime={handleSeek}
                        onUserScroll={handleUserLyricsScroll}
                    />
                  </div>
                ) : (
                  // Default Expanded View: Artwork, Info, Main Controls, Action Buttons
                  <div className="flex-1 flex flex-col justify-between min-h-0 w-full"> {/* justify-between to push controls down */}
                    <MobilePlayerExpandedArtworkInfo
                      currentTrack={currentTrack}
                      dominantColor={dominantColor}
                      seekPosition={seekPosition}
                      duration={duration}
                      audioQuality={audioQuality}
                      listenCount={listenCount}
                      onHandleSeek={handleSeek}
                      onShowAudioMenu={() => setShowAudioMenuSheet(true)}
                      onArtworkDragEnd={handleMiniPlayerDragEnd} // Re-using mini-player drag for artwork swipe
                    />
                    <MobilePlayerExpandedMainControls
                      isPlaying={isPlaying}
                      shuffleOn={shuffleOn}
                      repeatMode={repeatMode}
                      onTogglePlay={togglePlay}
                      onSkipTrack={handleSkipTrackWithDoubleClick}
                      onPreviousTrack={handlePreviousTrackWithDoubleClick}
                      onShuffleQueue={shuffleQueue}
                      onToggleRepeatMode={handleToggleRepeatMode}
                    />
                    {/* Extra Action Buttons */}
                    {visibleActionButtons.length > 0 && (
                      <div className="w-full flex flex-wrap justify-center gap-x-6 gap-y-3 pb-2 px-4 shrink-0">
                        {visibleActionButtons.map((btn, i) => (
                          <MobileActionButton
                            key={`action-${i}`}
                            icon={btn.icon}
                            label={btn.label}
                            active={btn.active}
                            onClick={btn.onClick}
                            size="small"
                          />
                        ))}
                         {!canShowExtraActionButtons && /* Show 'More' if fewer buttons displayed */ (
                            <MobileActionButton
                                icon={MoreHorizontal}
                                label="More"
                                onClick={() => setShowMoreOptionsSheet(true)}
                                size="small"
                            />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileAudioQualityMenu
        isOpen={showAudioMenuSheet}
        currentQuality={audioQuality}
        isDataSaverActive={isDataSaver}
        onChangeQuality={changeAudioQuality}
        onClose={() => setShowAudioMenuSheet(false)}
      />
      <MobileMoreOptionsMenu
        isOpen={showMoreOptionsSheet}
        options={moreOptionsSheetItems}
        onClose={() => setShowMoreOptionsSheet(false)}
      />
    </div>
  );
};

export default MobilePlayer;