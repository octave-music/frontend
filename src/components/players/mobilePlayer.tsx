/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useEffect,
  useRef,
  SVGProps,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence, PanInfo, useAnimation } from "framer-motion";
import {
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  Music,
  Download,
  Share2,
  Radio,
  Plus,
  Library,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  ListMusic,
  ArrowLeft,
  MoreHorizontal,
  Cast,
  Airplay,
  Ban,
  Crown,
  Fan,
  CircleDollarSign,
  Share,
  Star,
  Flag,
  AlertCircle,
  Lock,
  UserPlus,
  Trash2,
  ListX,
  Guitar,
} from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { motion as m } from "framer-motion"; // optional alias
import { usePalette } from "react-palette";

import { Track, Lyric } from "@/lib/types/types";
import { useAudio } from "@/lib/hooks/useAudio";

type AudioQuality = "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER";
type RepeatMode = "off" | "all" | "one";

interface MobilePlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  previousTracks: Track[];
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
  showLyrics: boolean;
  toggleLyricsView: () => void;
  shuffleOn: boolean;
  shuffleQueue: () => void;
  queue: Track[];
  currentTrackIndex: number;
  onQueueItemClick: (track: Track, index: number) => void;
  setIsPlayerOpen: (isOpen: boolean) => void;
  listenCount: number;
}

interface ProcessedLyric extends Lyric {
  endTime: number;
}

/** Format a time in seconds => mm:ss. */
function formatTimeMobile(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------
   S E E K   B A R
------------------------------------------------------ */
interface SeekbarProps {
  progress: number;
  handleSeek: (time: number) => void;
  isMiniplayer?: boolean;
  duration: number;
}

const Seekbar: React.FC<SeekbarProps> = ({
  progress,
  handleSeek,
  isMiniplayer = false,
  duration,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const [showTooltip, setShowTooltip] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(isNaN(progress) ? 0 : progress);
    }
  }, [progress, isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setShowTooltip(true);
    touchStartRef.current = clientX;
    setLocalProgress(calculateProgress(clientX));
  };

  const handleDragMove = useCallback(
    (clientX: number) => {
      if (isDragging) {
        const newProgress = calculateProgress(clientX);
        setLocalProgress(isNaN(newProgress) ? 0 : newProgress);
      }
    },
    [isDragging, calculateProgress]
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      handleSeek(localProgress * duration);
      setIsDragging(false);
      setShowTooltip(false);
    }
  }, [isDragging, localProgress, duration, handleSeek]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
    };
    const onEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const height = isMiniplayer ? 'h-1' : 'h-2';
  const thumbSize = isMiniplayer ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div 
      className="relative mx-4 py-4 touch-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => !isDragging && setShowTooltip(false)}
    >
      <div
        ref={progressRef}
        className={`relative w-full ${height} cursor-pointer bg-white/20 rounded-full`}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      >
        <motion.div
          className="absolute left-0 top-0 h-full bg-white rounded-full"
          animate={{ width: `${isNaN(localProgress) ? 0 : localProgress * 100}%` }}
          transition={isDragging 
            ? { duration: 0 } 
            : { type: "spring", stiffness: 300, damping: 30 }}
        />

        {!isMiniplayer && (
          <motion.div
            className="absolute"
            style={{
              // Instead of centering at 50%, move it up (adjust "-10px" as needed)
              top: "calc(50% - 10px)",
              left: `calc(${localProgress * 100}%)`,
              x: "-50%",
              touchAction: "none",
              cursor: "grab",
            }}
          >
          <motion.div
            className={`${thumbSize} bg-white rounded-full shadow-lg`}
            animate={{
              scale: isDragging || showTooltip ? 1.2 : 0,
              opacity: isDragging || showTooltip ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      )}
      </div>

      <AnimatePresence>
        {(showTooltip || isDragging) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded"
            style={{ 
              left: `calc(${localProgress * 100}%)`,
              transform: 'translateX(-50%)',
            }}
          >
            {formatTime(localProgress * duration)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
/* ------------------------------------------------------
   Q U A L I T Y   B A D G E
------------------------------------------------------ */
const QualityBadge: React.FC<{
  quality: AudioQuality;
  onClick: () => void;
}> = ({ quality, onClick }) => {
  const icons = {
    MAX: Crown,
    HIGH: Star,
    NORMAL: Fan,
    DATA_SAVER: CircleDollarSign,
  };

  const qualityColors = {
    MAX: "bg-gradient-to-r from-yellow-600 to-yellow-800",
    HIGH: "bg-gradient-to-r from-purple-500 to-purple-700",
    NORMAL: "bg-gradient-to-r from-blue-500 to-blue-700",
    DATA_SAVER: "bg-gradient-to-r from-green-500 to-green-700",
  };

  const Icon = icons[quality];

  return (
    <motion.button
      className={`px-4 py-1 rounded-full text-xs font-medium ${qualityColors[quality]} text-white inline-flex items-center justify-center space-x-1.5`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <Icon className="w-3 h-3" />
      <span>{quality}</span>
    </motion.button>
  );
};

/* ------------------------------------------------------
   A C T I O N   B U T T O N
------------------------------------------------------ */
const ActionButton: React.FC<{
  icon: React.FC<SVGProps<SVGSVGElement>>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon: Icon, label, active, onClick }) => (
  <motion.button
    className="flex flex-col items-center space-y-1"
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center ${
        active ? "bg-[#1a237e]/20 text-green-500" : "bg-white/10 text-white/60"
      } transition-all duration-200 hover:bg-white/20`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-xs text-white/60">{label}</span>
  </motion.button>
);

/* ------------------------------------------------------
   M O B I L E   P L A Y E R
------------------------------------------------------ */
const MobilePlayer: React.FC<MobilePlayerProps> = ({
  currentTrack,
  isPlaying,
  previousTracks,
  setQueue,
  togglePlay,
  skipTrack,
  previousTrack,
  downloadTrack,
  seekPosition,
  duration,
  handleSeek,
  isLiked,
  repeatMode,
  setRepeatMode,
  toggleLike,
  removeFromQueue,
  lyrics,
  currentLyricIndex,
  showLyrics,
  toggleLyricsView,
  shuffleOn,
  shuffleQueue,
  queue,
  currentTrackIndex,
  onQueueItemClick,
  setIsPlayerOpen,
  listenCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showQueueUI, setShowQueueUI] = useState(false);

  const [miniPlayerTouchStartY, setMiniPlayerTouchStartY] = useState<number | null>(
    null
  );
  const [dominantColor, setDominantColor] = useState<string | null>(null);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const [canShowActions, setCanShowActions] = useState(true);
  const [userScrolling, setUserScrolling] = useState<boolean>(false);


  const controls = useAnimation();

  // Access from custom audio hook
  const { audioQuality, isDataSaver, changeAudioQuality } = useAudio();

  const processedLyrics = useMemo<ProcessedLyric[]>(() => {
    return lyrics.map((lyric: Lyric, i: number) => ({
      ...lyric,
      endTime: lyrics[i + 1]?.time || duration,
    }));
  }, [lyrics, duration]);

  const getLyricProgress = (): number => {
    if (currentLyricIndex === -1 || !processedLyrics[currentLyricIndex]) return 0;
    const currentL = processedLyrics[currentLyricIndex];
    const start = currentL.time;
    const end = currentL.endTime || duration;
    const segmentDuration = end - start;
    const elapsed = seekPosition - start;
    return Math.min(Math.max(elapsed / segmentDuration, 0), 1);
  };
  
  const lyricProgress = getLyricProgress();

  const handleUserScroll = (): void => {
    if (isAutoScrollingRef.current) return;
    setUserScrolling(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
    }, 3000);
  };

  useEffect(() => {
    // If userScrolling just ended => auto-scroll to active lyric
    if (!userScrolling && showLyrics && lyricsRef.current) {
      const container = lyricsRef.current;
      const activeLine = container.children[currentLyricIndex] as HTMLElement;
  
      if (activeLine) {
        isAutoScrollingRef.current = true;
        const offsetTop = activeLine.offsetTop;
        const halfContainer = container.clientHeight / 2;
        const halfLine = activeLine.offsetHeight / 2;
        const scrollPos = offsetTop - halfContainer + halfLine - 20;
  
        container.scrollTo({ 
          top: scrollPos, 
          behavior: "smooth" 
        });
  
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 600);
      }
    }
  }, [userScrolling, showLyrics, currentLyricIndex]);
  

  // Extract approximate color from track cover (dominant color)
  useEffect(() => {
    if (!currentTrack.album.cover_medium) {
      setDominantColor("#000000");
      return;
    }
    
    let isCancelled = false;
    
    // Fix the Image constructor typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img: HTMLImageElement = new (window.Image as any)();
    
    img.crossOrigin = "Anonymous";
    img.src = currentTrack.album.cover_medium;
    
    img.onload = () => {
      if (isCancelled) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setDominantColor(`rgb(${r}, ${g}, ${b})`);
    };
    
    img.onerror = () => {
      if (!isCancelled) {
        setDominantColor("#000000");
      }
    };
    
    return () => {
      isCancelled = true;
    };
}, [currentTrack.album.cover_medium]);

  // Adjust show/hide action buttons depending on screen size
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setCanShowActions(window.innerWidth > 400);
      }, 100);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* More Options Items */
  const moreOptionsItems = [
    { icon: Heart, label: "Like", active: isLiked, onClick: toggleLike },
    { icon: Ban, label: "Dislike", onClick: () => console.log("Disliked track") },
    { icon: Share2, label: "Share", onClick: () => console.log("Shared track") },
    { icon: UserPlus, label: "Follow Artist", onClick: () => console.log("Followed Artist") },
    { icon: Radio, label: "Start Radio", onClick: () => console.log("Radio") },
    { icon: Library, label: "Add to Playlist", onClick: () => setShowAddToPlaylistModal(true) },
    { icon: ListMusic, label: "Queue", onClick: () => setShowQueueUI(true) },
    { icon: Share, label: "Copy Link", onClick: () => console.log("Copied link") },
    { icon: Music, label: "Lyrics", active: showLyrics, onClick: toggleLyricsView },
    { icon: Flag, label: "Report", onClick: () => console.log("Reported track") },
    { icon: Download, label: "Download", onClick: () => downloadTrack(currentTrack) },
    { icon: Lock, label: "Audio Quality", onClick: () => setShowAudioMenu(true) },
    { icon: AlertCircle, label: "Song Info", onClick: () => console.log("Song Info displayed") },
    { icon: Mic2, label: "Karaoke Mode", onClick: () => console.log("Karaoke mode started") },
  ];
  

  /* Buttons to show at the bottom (if canShowActions = true) */
  const getVisibleActionButtons = useCallback(() => {
    if (!canShowActions) return [];
    return [
      { icon: Heart, label: "Like", active: isLiked, onClick: toggleLike },
      {
        icon: Plus,
        label: "Add to",
        onClick: () => setShowAddToPlaylistModal(true),
      },
      {
        icon: Download,
        label: "Download",
        onClick: () => downloadTrack(currentTrack),
      },
    ];
  }, [canShowActions, currentTrack, isLiked, toggleLike, downloadTrack]);

  /** Expand or collapse miniplayer => full view. */
  const togglePlayer = () => {
    setIsExpanded(!isExpanded);
    setIsPlayerOpen(!isExpanded);
  };

  const backClickCountRef = useRef(0);
const handleBackClick = useCallback(() => {
  backClickCountRef.current++;
  if (backClickCountRef.current === 1) {
    setTimeout(() => {
      if (backClickCountRef.current === 1) {
        // Single click: reset current song to start.
        handleSeek(0);
      }
      backClickCountRef.current = 0;
    }, 300);
  } else if (backClickCountRef.current === 2) {
    // Double click: go to previous track.
    previousTrack();
    backClickCountRef.current = 0;
  }
}, [handleSeek, previousTrack]);


const forwardClickCountRef = useRef(0);
const handleForwardClick = useCallback(() => {
  forwardClickCountRef.current++;
  if (forwardClickCountRef.current === 1) {
    setTimeout(() => {
      if (forwardClickCountRef.current === 1) {
        // single
        const timeLeft = duration - seekPosition;
        if (timeLeft <= 5) skipTrack();
        else handleSeek(duration);
      }
      forwardClickCountRef.current = 0;
    }, 300);
  } else if (forwardClickCountRef.current === 2) {
    // double
    skipTrack();
    forwardClickCountRef.current = 0;
  }
}, [duration, seekPosition, skipTrack, handleSeek]);

  /** If user tries to drag miniplayer left or right => skip track, etc. */
  const handleMiniPlayerDragEnd = (info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // drag right => previous
      controls.start({ x: "100%", transition: { duration: 0.3 } }).then(() => {
        previousTrack();
        controls.set({ x: "-100%" });
        controls.start({ x: 0, transition: { duration: 0.3 } });
      });
    } else if (info.offset.x < -threshold) {
      // drag left => skip
      controls.start({ x: "-100%", transition: { duration: 0.3 } }).then(() => {
        skipTrack();
        controls.set({ x: "100%" });
        controls.start({ x: 0, transition: { duration: 0.3 } });
      });
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300 } });
    }
  };

  /** If user swipes up => expand the player. */
  const handleMiniPlayerTouchStart = (e: React.TouchEvent) => {
    setMiniPlayerTouchStartY(e.touches[0].clientY);
  };
  const handleMiniPlayerTouchMove = (e: React.TouchEvent) => {
    if (miniPlayerTouchStartY !== null) {
      const deltaY = miniPlayerTouchStartY - e.touches[0].clientY;
      if (deltaY > 50) {
        setIsExpanded(true);
        setIsPlayerOpen(true);
        setMiniPlayerTouchStartY(null);
      }
    }
  };
  const handleMiniPlayerTouchEnd = () => {
    setMiniPlayerTouchStartY(null);
  };

  /** The main cluster of playback controls in expanded mode. */
  const mainControlButtons = (
<div className="w-full flex items-center justify-between mb-8 pl-4 pr-2 sm:px-4">
      <button
        onClick={shuffleQueue}
        className={`p-3 rounded-full ${
          shuffleOn ? "text-green-500" : "text-white/60 hover:bg-white/10"
        }`}
      >
      <Shuffle className="w-6 h-6 xs:w-5 xs:h-5" />
    </button>
      <div className="flex items-center space-x-8">
        <button
          className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
          onClick={handleBackClick}
        >
          <SkipBack className="w-6 h-6 text-white" />
        </button>
        <motion.button
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-black" />
          ) : (
            <Play className="w-8 h-8 text-black ml-1" />
          )}
        </motion.button>
        <button
          className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
          onClick={handleForwardClick}
        >
          <SkipForward className="w-6 h-6 text-white" />
        </button>
      </div>
      <button
        onClick={() => {
          const modes: RepeatMode[] = ["off", "all", "one"];
          const currentIndex = modes.indexOf(repeatMode);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          setRepeatMode(nextMode);
        }}
        className="p-3 rounded-full"
      >
        {repeatMode === "one" ? (
          <Repeat1 className="w-6 h-6 xs:w-5 xs:h-5 text-green-500" />
        ) : (
          <Repeat className={`w-6 h-6 xs:w-5 xs:h-5 ${repeatMode === "all" ? "text-green-500" : "text-white/60"}`} />
        )}

      </button>
    </div>
  );

  return (
    <div className="px-6 flex flex-col items-center">
      {/* Container for miniplayer or expanded player */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-10">
      {/* --- Miniplayer if not expanded --- */}
        {!isExpanded && (
          <motion.div
            className="mx-2 rounded-xl overflow-visible mb-[env(safe-area-inset-bottom)]"            
            style={{
              background: dominantColor
                ? `linear-gradient(to bottom, ${dominantColor}CC, rgba(0,0,0,0.95))`
                : "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => handleMiniPlayerDragEnd(info)}
            animate={controls}
            onClick={() => {
              setIsExpanded(true);
              setIsPlayerOpen(true);
            }}
            onTouchStart={handleMiniPlayerTouchStart}
            onTouchMove={handleMiniPlayerTouchMove}
            onTouchEnd={handleMiniPlayerTouchEnd}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                {/* Artwork + Title */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <motion.div
                    className="relative w-12 h-12 rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={currentTrack.album.cover_medium || ""}
                      alt={currentTrack.title || ""}
                      fill
                      sizes="(max-width: 768px) 48px, 96px"
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {currentTrack.title}
                    </div>
                    <p className="text-white/60 text-sm truncate">
                      {currentTrack.artist.name}
                    </p>
                  </div>
                </div>
                {/* Buttons: back / play / forward / like */}
                <div className="flex items-center space-x-2 justify-center">
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBackClick();
                    }}
                  >
                    <SkipBack className="w-5 h-5 text-white" />
                  </button>
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 xs:w-4 xs:h-4 text-white" />
                    ) : (
                      <Play className="w-5 h-5 xs:w-4 xs:h-4 text-white" />
                    )}

                  </button>
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleForwardClick();
                    }}
                  >
                    <SkipForward className="w-5 h-5 text-white" />
                  </button>
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike();
                    }}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isLiked
                          ? "fill-green-500 text-green-500"
                          : "text-white/60"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Seekbar */}
              <div className="mt-2">
                <Seekbar
                  progress={seekPosition / duration}
                  handleSeek={handleSeek}
                  duration={duration}
                  isMiniplayer
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- Expanded Player --- */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 z-50 flex flex-col"
              style={{
                background: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
            >
              {/* Header: top row */}
              <div className="flex items-center justify-between p-4">
                <button
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  onClick={togglePlayer}
                >
                  <ChevronDown className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Cast className="w-5 h-5 text-white/60" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Airplay className="w-5 h-5 text-white/60" />
                  </button>
                  {canShowActions ? (
                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setShowQueueUI(true)}
                  >
                    <ListMusic className="w-5 h-5 text-white/60" />
                  </button>
                ) : ( 
                  <>
                   <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setShowQueueUI(true)}
                  >
                    <ListMusic className="w-5 h-5 text-white/60" />
                  </button>

                  <button
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setShowMoreOptions(true)}
                  >
                    <MoreHorizontal className="w-5 h-5 text-white/60" />
                  </button>
                  </>
                )}
                </div>
              </div>

              {/* Body content */}
              <div className="px-4 flex-grow flex flex-col items-center">
                {/* If queue open */}
                {showQueueUI ? (
                  <div
                    className="h-[calc(100vh-15vh)] w-full overflow-y-auto custom-scrollbar"
                    style={{
                      paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
                    }}
                  >
                    {/* Example queue UI */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <button
                          onClick={() => setShowQueueUI(false)}
                          className="hover:bg-white/10 p-2 rounded-full transition-colors"
                        >
                          <ArrowLeft className="w-6 h-6 text-white" />
                        </button>
                        <h2 className="text-lg font-semibold text-white ml-4">
                          Up Next
                        </h2>
                      </div>
                      <button
                        onClick={() => setQueue([])}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20"
                      >
                        <ListX className="w-5 h-5 text-white" />
                        <span className="text-sm text-white">Clear Queue</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Show previous tracks */}
                      {previousTracks.map((t, i) => (
                        <motion.div
                          key={`prev-${t.id}-${i}`}
                          className="flex items-center space-x-4 p-2 rounded-lg opacity-50 hover:opacity-70 transition-opacity cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onQueueItemClick(t, -1 * (i + 1))}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                            <Image
                              src={t.album.cover_medium}
                              alt={t.title}
                              fill
                              sizes="(max-width: 768px) 48px, 96px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 font-medium truncate">
                              {t.title}
                            </p>
                            <p className="text-gray-500 text-sm truncate">
                              {t.artist.name}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                      {/* Actual queue */}
                      {queue.map((tr, i) => (
                        <AnimatePresence key={`queue-${tr.id}-${i}`}>
                          <motion.div className="relative">
                            <motion.div
                              className="relative bg-black"
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.2}
                              onDragEnd={(event, info: PanInfo) => {
                                if (info.offset.x < -100) {
                                  removeFromQueue(i);
                                }
                              }}
                            >
                              <div
                                className={`flex items-center space-x-4 p-2 rounded-lg bg-black ${
                                  tr.id === currentTrack.id
                                    ? "bg-white/10"
                                    : "hover:bg-white/10"
                                }`}
                                onClick={() => onQueueItemClick(tr, i)}
                              >
                                <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                                  <Image
                                    src={tr.album.cover_medium}
                                    alt={tr.title}
                                    fill
                                    sizes="(max-width: 768px) 48px, 96px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {tr.title}
                                  </p>
                                  <p className="text-white/60 text-sm truncate">
                                    {tr.artist.name}
                                  </p>
                                </div>
                                <button
                                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMoreOptions(true);
                                  }}
                                >
                                  <MoreHorizontal className="w-5 h-5 text-white/60" />
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        </AnimatePresence>
                      ))}
                    </div>
                  </div>
                ) : showLyrics ? (
                  // --- Lyrics View (Integrated from old code) ---
                  <div
                    className="h-[calc(100vh-10vh)] w-full overflow-y-auto custom-scrollbar"
                    onScroll={handleUserScroll}
                    onTouchMove={handleUserScroll}
                  >
                    <div className="flex items-center mb-6">
                      <button
                        onClick={toggleLyricsView}
                        className="hover:bg-white/10 p-2 rounded-full transition-colors"
                      >
                        <ArrowLeft className="w-6 h-6 text-white" />
                      </button>
                      <h2 className="text-lg font-semibold text-white ml-4">
                        Lyrics
                      </h2>
                    </div>
                    <div
                      className="space-y-6 overflow-y-auto"
                      ref={lyricsRef}
                      style={{ height: "calc(100% - 4rem)", scrollBehavior: "smooth", }}
                    >
                      {processedLyrics.map((ly: ProcessedLyric, idx: number) => {
                        const isActive = idx === currentLyricIndex;
                        if (!isActive) {
                          return (
                            <motion.p
                              key={idx}
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-lg text-center text-white/40 hover:text-white"
                              onClick={() => handleSeek(ly.time)}
                            >
                              {ly.text}
                            </motion.p>
                          );
                        }
                        const letters: string[] = ly.text.split("");
                        const totalLetters = letters.length;
                        const filled = Math.floor(lyricProgress * totalLetters);
                        return (
                          <motion.p
                            key={idx}
                            className="text-lg text-center font-bold text-white"
                            initial="hidden"
                            animate="visible"
                          >
                            {letters.map((letter: string, i2: number) => (
                              <motion.span
                                key={i2}
                                initial={{ color: "rgba(255,255,255,0.4)" }}
                                animate={{
                                  color:
                                    i2 < filled
                                      ? "rgba(255,255,255,1)"
                                      : "rgba(255,255,255,0.4)",
                                }}
                                transition={{
                                  duration: 0.2,
                                  delay: i2 * 0.02,
                                }}
                              >
                                {letter}
                              </motion.span>
                            ))}
                          </motion.p>
                        );
                      })}
                    </div>

                  </div>
                ) :
                (
                  // Normal expanded player
                  <>
                    {/* Artwork background blur */}
                    <div className="relative w-full h-[min(60vw,320px)] flex justify-center items-center mb-8">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${currentTrack.album.cover_medium})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(25px) brightness(1.2) saturate(1.3)",
                          transform: "scale(1.8)",
                          opacity: 0.95,  
                          zIndex: -1,
                        }}
                      />
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(event, info) => handleMiniPlayerDragEnd(info)}
                        className="relative z-10 w-[min(60vw,320px)] h-[min(60vw,320px)]"
                      >
                        <Image
                          src={currentTrack.album.cover_medium || ""}
                          alt={currentTrack.title || ""}
                          fill
                          sizes="(max-width: 768px) 60vw, 320px"
                          className="rounded-lg shadow-xl object-cover"
                          priority
                        />
                      </motion.div>
                    </div>

                    {/* Title + Artist */}
                    <div className="w-full text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {currentTrack.title}
                      </h2>
                      <p className="text-white/60">{currentTrack.artist.name}</p>
                    </div>

                    {/* Audio Quality Badge + Listen Count */}
                    <div className="flex flex-col items-center">
                      <QualityBadge
                        quality={audioQuality}
                        onClick={() => setShowAudioMenu(true)}
                      />
                      <p className="text-[#FFD700] text-xs mt-1 flex items-center space-x-1">
                        <Guitar className="w-4 h-4 inline-block" />
                        <span>Listened {listenCount} times</span>
                      </p>
                    </div>

                    {/* Seekbar */}
                    <div className="w-full mb-8 mt-6 overflow-visible">
                    <Seekbar progress={seekPosition / duration} handleSeek={handleSeek} duration={duration} />
                    <div className="flex justify-between text-sm text-white/60 mt-2 px-6">
                      <span>{formatTimeMobile(seekPosition)}</span>
                      <span>{formatTimeMobile(duration)}</span>
                    </div>
                  </div>



                    {/* Main playback controls */}
                    {mainControlButtons}

                    {/* Extra action buttons */}
                    {getVisibleActionButtons().length > 0 && (
                      <div className="w-full flex flex-wrap justify-center gap-8 mb-4">
                        {getVisibleActionButtons().map((btn, i) => (
                          <ActionButton
                            key={i}
                            icon={btn.icon}
                            label={btn.label}
                            active={btn.active}
                            onClick={btn.onClick}
                          />
                        ))}
                        {/* "More" button for additional actions */}
                        <div className="md:hidden">
                          <ActionButton
                            icon={MoreHorizontal}
                            label="More"
                            onClick={() => setShowMoreOptions(true)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Audio Quality Menu */}
              <AnimatePresence>
                {showAudioMenu && (
                  <motion.div
                    className="fixed inset-0 z-50"
                    style={{
                      background: "rgba(0,0,0,0.8)",
                      pointerEvents: showAudioMenu ? "auto" : "none"
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAudioMenu(false)}
                  >
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 rounded-t-3xl"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-bold text-white mb-4 text-center">
                          Audio Quality
                        </h3>
                        {(["MAX", "HIGH", "NORMAL", "DATA_SAVER"] as AudioQuality[]).map(
                          (qual) => (
                            <button
                              key={qual}
                              className={`w-full flex items-center justify-between p-4 rounded-lg mb-2 transition-all ${
                                audioQuality === qual
                                  ? "bg-white/10"
                                  : "hover:bg-white/5"
                              }`}
                              onClick={async () => {
                                if (isDataSaver && qual !== "DATA_SAVER") {
                                  toast.error(
                                    "Data Saver is ON. Disable it or set to NORMAL/HIGH/MAX offline!"
                                  );
                                  return;
                                }
                                try {
                                  await changeAudioQuality(qual);
                                  toast.success(`Switched to ${qual} Quality`);
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to change audio quality");
                                } finally {
                                  setShowAudioMenu(false);
                                }
                              }}
                            >
                              <div className="flex flex-col items-start justify-center">
                                <p className="text-white font-semibold leading-none">
                                  {qual}
                                </p>
                                <p className="text-sm text-white/60 leading-none mt-1">
                                  {qual === "MAX" &&
                                    "HiFi Plus (24-bit, up to 192kHz)"}
                                  {qual === "HIGH" && "HiFi (16-bit, 44.1kHz)"}
                                  {qual === "NORMAL" && "High (320kbps)"}
                                  {qual === "DATA_SAVER" && "Data Saver (128kbps)"}
                                </p>
                              </div>
                              {qual === audioQuality && (
                                <div className="w-6 h-6 rounded-full bg-[#1a237e] flex items-center justify-center">
                                  <motion.div
                                    className="w-3 h-3 bg-white rounded-full"
                                    layoutId="quality-indicator"
                                  />
                                </div>
                              )}
                            </button>
                          )
                        )}
                        <button
                          className="w-full py-4 text-white/60 hover:text-white transition-all mt-4 text-center"
                          onClick={() => setShowAudioMenu(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* More Options Menu */}
              <AnimatePresence>
                {showMoreOptions && (
                  <motion.div
                    className="fixed inset-0 bg-black/80 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMoreOptions(false)}
                  >
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 rounded-t-3xl max-h-[80%] overflow-y-auto custom-scrollbar"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                        <div className="grid grid-cols-3 gap-4 mb-8">
                          {moreOptionsItems.map((item, index) => (
                            <ActionButton
                              key={index}
                              icon={item.icon}
                              label={item.label}
                              active={item.active}
                              onClick={() => {
                                item.onClick?.();
                                setShowMoreOptions(false);
                              }}
                            />
                          ))}
                        </div>
                        <button
                          className="w-full py-4 text-white/60 hover:text-white transition-colors"
                          onClick={() => setShowMoreOptions(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobilePlayer;
