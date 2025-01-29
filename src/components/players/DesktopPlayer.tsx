/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import Image from "next/image";
import {
  Heart,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Download,
  Library,
  Radio,
  UserPlus,
  Ban,
  Star,
  Flag,
  AlertCircle,
  Lock,
  Mic2,
  Cast,
  Airplay,
  Share,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Music2,
  Info,
  CircleDollarSign,
  Crown,
  Fan,
  ListX,
  Guitar,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion as m } from "framer-motion"; // optional alias

import { Track, Lyric } from "@/lib/types/types";
import { useAudio } from "@/lib/hooks/useAudio";

type AudioQuality = "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER";
type RepeatMode = "off" | "all" | "one";

interface DesktopPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  previousTracks: Track[];
  previousTrack: () => void;
  togglePlay: () => void;
  skipTrack: () => void | Promise<void>;
  seekPosition: number;
  duration: number;
  handleSeek: (time: number) => void;
  isLiked: boolean;
  toggleLike: () => void;
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
  showLyrics: boolean;
  toggleLyricsView: () => void;
  currentTrackIndex: number;
  removeFromQueue: (index: number) => void;
}

/** Convert seconds => mm:ss. */
function formatTimeDesktop(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}


/* ----------------------------------------------
   S E E K B A R
---------------------------------------------- */
interface DesktopSeekbarProps {
  progress: number; // 0..1
  handleSeek: (time: number) => void;
  duration: number;
}
const DesktopSeekbar: React.FC<DesktopSeekbarProps> = ({
  progress,
  handleSeek,
  duration,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const calculateProgress = useCallback((clientX: number) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  const startDrag = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      setLocalProgress(calculateProgress(clientX));
    },
    [calculateProgress]
  );

  const moveDrag = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      setLocalProgress(calculateProgress(clientX));
    },
    [isDragging, calculateProgress]
  );

  const endDrag = useCallback(() => {
    if (!isDragging) return;
    handleSeek(localProgress * duration);
    setIsDragging(false);
  }, [isDragging, localProgress, duration, handleSeek]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
    const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientX);
    const onEnd = () => endDrag();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchend", onEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, moveDrag, endDrag]);

  return (
    <div className="flex items-center w-full space-x-3 px-4 py-2">
      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {formatTimeDesktop(localProgress * duration)}
      </span>
      <div
        ref={progressRef}
        className="relative flex-1 h-1.5 bg-neutral-700/50 rounded-full cursor-pointer group"
        onMouseDown={(e) => startDrag(e.clientX)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      >
        <div
          className="absolute left-0 top-0 h-full bg-white/90 rounded-full group-hover:bg-green-400 transition-colors"
          style={{ width: `${localProgress * 100}%` }}
        />
        <div
          className="absolute -top-2 h-5 w-5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{
            left: `${localProgress * 100}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {formatTimeDesktop(duration)}
      </span>
    </div>
  );
};

/* ----------------------------------------------
   A U T O   S C R O L L   H O O K   (lyrics)
---------------------------------------------- */
function useAutoScrollLyrics(
  showLyrics: boolean,
  currentLyricIndex: number,
  lyrics: Lyric[],
  duration: number,
  seekPosition: number
) {
  const [userScrolling, setUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollingRef = useRef(false);
  const lyricsRef = useRef<HTMLDivElement>(null);

  const processedLyrics = useMemo(() => {
    return lyrics.map((lyric, i) => ({
      ...lyric,
      endTime: lyrics[i + 1]?.time ?? duration,
    }));
  }, [lyrics, duration]);

  const getLyricProgress = () => {
    if (currentLyricIndex === -1 || !processedLyrics[currentLyricIndex]) {
      return 0;
    }
    const current = processedLyrics[currentLyricIndex];
    const start = current.time;
    const end = current.endTime ?? duration;
    const segmentDuration = end - start;
    const elapsed = seekPosition - start;
    return Math.min(Math.max(elapsed / segmentDuration, 0), 1);
  };
  const lyricProgress = getLyricProgress();

  const handleUserScroll = () => {
    if (isAutoScrollingRef.current) return;
    setUserScrolling(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolling(false);
    }, 3000);
  };

  // auto-scroll to active lyric
  useEffect(() => {
    if (!showLyrics || !lyricsRef.current) return;
    if (!userScrolling) {
      const container = lyricsRef.current;
      const currentLyricEl = container.children[currentLyricIndex] as HTMLElement;
      if (currentLyricEl) {
        isAutoScrollingRef.current = true;
        const offsetTop = currentLyricEl.offsetTop;
        const offsetHeight = currentLyricEl.offsetHeight;
        const containerHeight = container.clientHeight;
        const scrollPos = offsetTop - containerHeight / 2 + offsetHeight / 2;

        container.scrollTo({ top: scrollPos, behavior: "smooth" });
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 1000);
      }
    }
  }, [currentLyricIndex, showLyrics, userScrolling, processedLyrics]);

  return { lyricsRef, userScrolling, handleUserScroll, lyricProgress, processedLyrics };
}

/* ----------------------------------------------
   L Y R I C S   P A N E L
---------------------------------------------- */
const LyricsPanel: React.FC<{
  currentTrack: Track;
  currentLyricIndex: number;
  handleSeek: (time: number) => void;
  lyricsRef: React.RefObject<HTMLDivElement>;
  processedLyrics: Array<Lyric & { endTime?: number }>;
  lyricProgress: number;
  userScrolling: boolean;
}> = ({
  currentTrack,
  currentLyricIndex,
  handleSeek,
  lyricsRef,
  processedLyrics,
  lyricProgress,
  userScrolling,
}) => {
  if (!currentTrack) {
    return (
      <p className="text-neutral-400 text-center p-4">No track selected.</p>
    );
  }
  if (processedLyrics.length === 0) {
    return (
      <p className="text-neutral-400 text-center p-4">No lyrics available.</p>
    );
  }

  return (
    <div
      className="p-4 h-full overflow-y-auto custom-scrollbar"
      ref={lyricsRef}
      onScroll={(_e) => {
        // user scrolling => autoScrollingRef
      }}
    >
      <div className="space-y-4">
        {processedLyrics.map((lyric, index) => {
          const isActive = index === currentLyricIndex;
          if (!isActive) {
            return (
              <p
                key={index}
                onClick={() => handleSeek(lyric.time)}
                className="text-lg cursor-pointer transition-all duration-300 text-neutral-400 hover:text-white/90 opacity-70"
              >
                {lyric.text}
              </p>
            );
          }
          // highlight letters
          const letters = lyric.text.split("");
          const totalLetters = letters.length;
          const filled = Math.floor(lyricProgress * totalLetters);

          return (
            <p
              key={index}
              onClick={() => handleSeek(lyric.time)}
              className="text-lg cursor-pointer font-medium text-white leading-relaxed"
            >
              {letters.map((letter, idx2) => (
                <span
                  key={idx2}
                  className={`transition-colors duration-300 ${
                    idx2 < filled ? "text-white" : "text-neutral-400"
                  }`}
                >
                  {letter}
                </span>
              ))}
            </p>
          );
        })}
      </div>
      {userScrolling && (
        <p className="text-sm text-neutral-500 mt-4 italic text-center">
          Scrolling manually. Auto-scroll will resume shortly...
        </p>
      )}
    </div>
  );
};

/* ----------------------------------------------
   Q U E U E   P A N E L
---------------------------------------------- */
const QueuePanel: React.FC<{
  queue: Track[];
  currentTrack: Track;
  currentTrackIndex: number;
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
}> = ({ queue, currentTrack, currentTrackIndex, onQueueItemClick, removeFromQueue, setQueue }) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium text-lg">Queue</h3>
        <button
          onClick={() => setQueue([])}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {queue.length === 0 ? (
          <p className="text-sm text-neutral-400">No tracks in queue.</p>
        ) : (
          queue.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              onClick={() => onQueueItemClick(track, index)}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                index === currentTrackIndex
                  ? "bg-white/10"
                  : currentTrack?.id === track.id
                  ? "bg-white/5"
                  : "hover:bg-white/5"
              }`}
            >
              <Image
                src={track.album.cover_small || ""}
                alt={track.title}
                width={40}
                height={40}
                className="rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white truncate">{track.title}</p>
                <p className="text-sm text-neutral-400 truncate">
                  {track.artist.name}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(index);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-neutral-400"
              >
                <ListX className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------
   D E T A I L S   P A N E L
---------------------------------------------- */

const DetailsPanel: React.FC<{
  currentTrack: Track;
  duration: number;
  listenCount: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  audioQuality: AudioQuality;
  changeAudioQuality: (q: AudioQuality) => Promise<void>;
  isDataSaver: boolean;
  downloadTrack: (track: Track) => void;
}> = ({
  currentTrack,
  duration,
  listenCount,
  volume,
  onVolumeChange,
  audioQuality,
  changeAudioQuality,
  isDataSaver,
  downloadTrack,
}) => {
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  if (!currentTrack) {
    return <p className="text-neutral-400 text-center p-4">No track selected.</p>;
  }
  

  // Some audioQuality info
  const qualityMap = {
    MAX: {
      icon: Crown,
      color: "bg-gradient-to-r from-yellow-500 to-yellow-600",
      text: "HiFi Plus (24-bit, up to 192kHz)",
    },
    HIGH: {
      icon: Star,
      color: "bg-gradient-to-r from-purple-500 to-purple-700",
      text: "HiFi (16-bit, 44.1kHz)",
    },
    NORMAL: {
      icon: Fan,
      color: "bg-gradient-to-r from-blue-500 to-blue-700",
      text: "High (320kbps)",
    },
    DATA_SAVER: {
      icon: CircleDollarSign,
      color: "bg-gradient-to-r from-green-500 to-green-700",
      text: "Data Saver (128kbps)",
    },
  } as const;
  const IconComponent = qualityMap[audioQuality].icon;

  return (
    <div className="p-4 space-y-6">
      <div>
        <Image
          src={currentTrack.album.cover_xl || ""}
          alt={currentTrack.title}
          width={600}
          height={600}
          className="w-full rounded-xl object-cover"
        />
      </div>
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">{currentTrack.title}</h2>
        <p className="text-sm text-neutral-400">{currentTrack.artist.name}</p>
        <p className="text-[#FFD700] text-xs mt-1 flex items-center space-x-1">
          <Guitar className="w-4 h-4 inline-block" />
          <span>Listened {listenCount} times</span>
        </p>
      </div>
      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-sm text-neutral-400">
          Album: <span className="text-white">{currentTrack.album.title}</span>
        </p>
        <p className="text-sm text-neutral-400">
          Duration: <span className="text-white">{formatTimeDesktop(duration)}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {/* Some example action icons */}
        <button
          onClick={() => downloadTrack(currentTrack)}
          className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
        >
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
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Star className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Flag className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <AlertCircle className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Lock className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Mic2 className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Share className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Cast className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
          <Airplay className="w-5 h-5" />
        </button>
      </div>
      {/* Volume Control */}
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-white font-medium mb-2">Volume</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
          >
            {volume === 0 ? <VolumeX /> : volume < 0.5 ? <Volume1 /> : <Volume2 />}
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
      {/* Audio Quality */}
        <div className="border-t border-white/10 pt-4 relative">
          <h3 className="text-white font-medium mb-2">Audio Quality</h3>

          {/* Toggle Button — instead of cycling, it opens a small menu */}
          <button
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white hover:opacity-90 ${qualityMap[audioQuality].color}`}
            onClick={() => setShowQualityMenu((prev) => !prev)}
          >
            {React.createElement(IconComponent, { className: "w-4 h-4" })}
            {audioQuality}
          </button>

          {/* Tiny popover menu for picking a quality */}
          {showQualityMenu && (
            <div
              className="absolute z-10 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-lg shadow-lg"
              // Make sure the container is position: relative on the parent
              style={{ top: "100%", left: 0 }}
            >
              {(["MAX","HIGH","NORMAL","DATA_SAVER"] as AudioQuality[]).map((q) => {
                const QIcon = qualityMap[q].icon;
                return (
                  <button
                    key={q}
                    className={`flex items-center w-full px-3 py-2 hover:bg-white/10 text-sm 
                                ${q === audioQuality ? "text-green-400" : "text-neutral-300"}`}
                    onClick={async () => {
                      // If your app is in data-saver mode, forbid anything else:
                      if (isDataSaver && q !== "DATA_SAVER") {
                        toast.error("Cannot leave data-saver while Data Saver is ON!");
                        return;
                      }
                      try {
                        await changeAudioQuality(q);
                        toast.success(`Switched to ${q} Quality`);
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to change audio quality");
                      } finally {
                        setShowQualityMenu(false);
                      }
                    }}
                  >
                    {React.createElement(QIcon, { className: "w-4 h-4 mr-2" })}
                    <span>{q}</span>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-sm text-neutral-400 mt-1">
            {qualityMap[audioQuality].text}
          </p>
        </div>

    </div>
  );
};

/* ----------------------------------------------
   S I D E B A R   O V E R L A Y   (Queue/Lyrics/Details)
---------------------------------------------- */
type SidebarTab = "queue" | "lyrics" | "details";

const SidebarOverlay: React.FC<{
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  tab: SidebarTab;
  setTab: (t: SidebarTab) => void;
  TABS: { id: SidebarTab; label: string; icon: any }[];
  queuePanel: React.ReactNode;
  lyricsPanel: React.ReactNode;
  detailsPanel: React.ReactNode;
}> = ({
  showSidebar,
  setShowSidebar,
  tab,
  setTab,
  TABS,
  queuePanel,
  lyricsPanel,
  detailsPanel,
}) => {
  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setShowSidebar(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 40, stiffness: 400 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] bg-neutral-900 border-l border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab Switcher */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                      t.id === tab
                        ? "bg-white/20 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {React.createElement(t.icon, { className: "w-5 h-5" })}
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <SimpleBar style={{ maxHeight: "100%" }} className="h-full">
                {tab === "queue" && queuePanel}
                {tab === "lyrics" && lyricsPanel}
                {tab === "details" && detailsPanel}
              </SimpleBar>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ----------------------------------------------
   D E S K T O P   P L A Y E R
---------------------------------------------- */
export default function DesktopPlayer(props: DesktopPlayerProps) {
  const {
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
    volume,
    onVolumeChange,
    listenCount,
    downloadTrack,
    showLyrics,
    toggleLyricsView,
    currentTrackIndex,
    removeFromQueue,
  } = props;

  const [showSidebar, setShowSidebar] = useState(false);
  const [tab, setTab] = useState<SidebarTab>("queue");
  const [isCollapsed, setIsCollapsed] = useState(false);
  

  // Access the audio hook for data saver checks, or we can just pass in onCycleAudioQuality prop
  const { audioQuality, isDataSaver, changeAudioQuality } = useAudio();

  const { lyricsRef, userScrolling, handleUserScroll, lyricProgress, processedLyrics } =
    useAutoScrollLyrics(showLyrics, currentLyricIndex, lyrics, duration, seekPosition);

  // The TABS for the overlay
  const TABS: Array<{ id: SidebarTab; label: string; icon: any }> = [
    { id: "queue", label: "Queue", icon: ListMusic },
    { id: "lyrics", label: "Lyrics", icon: Music2 },
    { id: "details", label: "Details", icon: Info },
  ];

  // Volume icon
  const isMuted = volume === 0;
  const VolumeIcon = () => {
    if (isMuted) return <VolumeX />;
    return volume < 0.5 ? <Volume1 /> : <Volume2 />;
  };
  const toggleMute = () => {
    if (isMuted) onVolumeChange(0.8);
    else onVolumeChange(0);
  };

  /** Attempt fullscreen. */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  /** Switch repeat mode. */
  const handleRepeat = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const idx = modes.indexOf(repeatMode);
    setRepeatMode(modes[(idx + 1) % modes.length]);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-black/60 to-black/90 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-screen-2xl mx-auto px-4">
          {/* If collapsed => minimal UI */}
          {isCollapsed ? (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center flex-1">
                <DesktopSeekbar
                  progress={duration > 0 ? seekPosition / duration : 0}
                  handleSeek={handleSeek}
                  duration={duration}
                />
              </div>
              <div className="flex items-center gap-3 pl-2">
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
                    <Play className="w-5 h-5 text-black" />
                  )}
                </button>
                <button
                  onClick={skipTrack}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Full Seekbar */}
              <DesktopSeekbar
                progress={duration > 0 ? seekPosition / duration : 0}
                handleSeek={handleSeek}
                duration={duration}
              />
              <div className="h-20 flex items-center justify-between gap-4">
                {/* Left Side */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {currentTrack && (
                    <>
                      <div className="relative group">
                        <Image
                          src={currentTrack.album.cover_medium || ""}
                          alt={currentTrack.title}
                          width={56}
                          height={56}
                          className="rounded-md object-cover"
                        />
                        <button
                          onClick={() => {
                            setShowSidebar(true);
                            setTab("details");
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Info className="w-6 h-6 text-white" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {currentTrack.title}
                        </h3>
                        <p className="text-sm text-neutral-400 truncate">
                          {currentTrack.artist.name}
                        </p>
                        <p className="text-[#FFD700] text-xs mt-1 flex items-center space-x-1">
                          <Guitar className="w-4 h-4 inline-block" />
                          <span>{listenCount}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleLike}
                          className={`p-2 rounded-full hover:bg-white/10 ${
                            isLiked ? "text-green-400" : "text-neutral-400"
                          }`}
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          onClick={toggleFullScreen}
                          className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/10 text-neutral-400">
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* Center Controls */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={shuffleQueue}
                      className={`p-2 rounded-full hover:bg-white/10 ${
                        shuffleOn ? "text-green-400" : "text-neutral-400"
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
                      onClick={handleRepeat}
                      className={`p-2 rounded-full hover:bg-white/10 ${
                        repeatMode !== "off"
                          ? "text-green-400"
                          : "text-neutral-400"
                      }`}
                    >
                      {repeatMode === "one" ? (
                        <Repeat1 className="w-5 h-5" />
                      ) : (
                        <Repeat className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Right side: lyrics / queue / volume, etc. */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <button
                    onClick={() => {
                      toggleLyricsView();
                      setShowSidebar(true);
                      setTab("lyrics");
                    }}
                    className={`p-2 rounded-full hover:bg-white/10 ${
                      showLyrics ? "text-green-400" : "text-neutral-400"
                    }`}
                  >
                    <Music2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowSidebar(true);
                      setTab("queue");
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                  >
                    <ListMusic className="w-5 h-5" />
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
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-400"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Overlay => queue/lyrics/details */}
      <SidebarOverlay
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        tab={tab}
        setTab={setTab}
        TABS={TABS}
        queuePanel={
          <QueuePanel
            queue={queue}
            currentTrack={currentTrack}
            currentTrackIndex={currentTrackIndex}
            onQueueItemClick={onQueueItemClick}
            removeFromQueue={removeFromQueue}
            setQueue={setQueue}
          />
        }
        lyricsPanel={
          <LyricsPanel
            currentTrack={currentTrack}
            currentLyricIndex={currentLyricIndex}
            handleSeek={handleSeek}
            lyricsRef={lyricsRef}
            processedLyrics={processedLyrics}
            lyricProgress={lyricProgress}
            userScrolling={userScrolling}
          />
        }
        detailsPanel={
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
          />
        }
      />
    </>
  );
}
