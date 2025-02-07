/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "simplebar-react/dist/simplebar.min.css";
import Image from "next/image";
import {
  Heart,
  Play,
  Pause,
  Volume2,
  GripVertical,
  Volume1,
  VolumeX,
  SkipBack,
  SkipForward,
  LucideIcon,
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
  Share2,
  MoreHorizontal,
  ChevronRight, MessageSquareText,
  ListX,
  Guitar,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion as m } from "framer-motion"; // optional alias

import { Track, Lyric } from "@/lib/types/types";
import { useAudio } from "@/lib/hooks/useAudio";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable"

type AudioQuality = 'MAX' | 'HIGH' | 'NORMAL' | 'DATA_SAVER';
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
  progress: number;
  handleSeek: (time: number) => void;
  duration: number;
}

const DesktopSeekbar: React.FC<DesktopSeekbarProps> = ({
  progress,
  handleSeek,
  duration,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [seekProgress, setSeekProgress] = useState(progress);
  const progressRef = useRef<HTMLDivElement>(null);

  // Update internal progress only when not dragging
  useEffect(() => {
    if (!isDragging) {
      setSeekProgress(progress);
    }
  }, [progress, isDragging]);

  const getProgressFromEvent = (clientX: number) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleMove = useCallback((clientX: number) => {
    const newProgress = getProgressFromEvent(clientX);
    setSeekProgress(newProgress);
  }, []);

  const handleMoveEnd = useCallback(() => {
    setIsDragging(false);
    handleSeek(seekProgress * duration);
  }, [handleSeek, duration, seekProgress]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleMoveEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleMoveEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const displayProgress = isDragging ? seekProgress : progress;

  return (
    <div className="flex items-center w-full space-x-3 px-4 py-2">
      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {formatTime(displayProgress * duration)}
      </span>
      
      <div
        ref={progressRef}
        className="relative flex-1 h-1.5 bg-neutral-600 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute inset-0 rounded-full bg-neutral-700/50" />
        
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-white/90"
          style={{ 
            width: `${displayProgress * 100}%`,
            backgroundColor: (isDragging || isHovering) ? '#4ade80' : undefined 
          }}
        />

        <div
          className="absolute -top-1.5 h-4 w-4"
          style={{
            left: `${displayProgress * 100}%`,
            transform: 'translateX(-50%)',
            opacity: (isDragging || isHovering) ? 1 : 0,
            scale: (isDragging || isHovering) ? '1' : '0.75',
          }}
        >
          <div 
            className="h-full w-full rounded-full shadow-lg"
            style={{
              backgroundColor: isDragging ? '#4ade80' : 'white'
            }}
          />
        </div>

        {isHovering && !isDragging && (
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-25" />
        )}
      </div>

      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {formatTime(duration)}
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
interface QueuePanelProps {
  queue: Track[];
  currentTrack: Track;
  currentTrackIndex: number;
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  setQueue: React.Dispatch<React.SetStateAction<Track[]>>;
}

const SortableItem: React.FC<{
  id: string;
  track: Track;
  index: number;
  onQueueItemClick: (track: Track, index: number) => void;
  removeFromQueue: (index: number) => void;
  currentTrackIndex: number;
}> = ({ id, track, index, onQueueItemClick, removeFromQueue, currentTrackIndex }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onQueueItemClick(track, index)}
      className={`group relative flex items-center gap-4 p-3 rounded-xl overflow-y-auto cursor-pointer transition-all duration-300
        ${index === currentTrackIndex
          ? "bg-white/10 shadow-lg shadow-black/20"
          : "hover:bg-white/5"}
        ${currentTrackIndex === index ? "border-l-2 border-white/20" : ""}
      `}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-100 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-neutral-500" />
      </div>

      {/* Track Number */}
      <div className="w-5 text-sm font-medium text-neutral-400">
        {index + 1}
      </div>

      {/* Album Art */}
      <div className="relative">
        <Image
          src={track.album.cover_small || ""}
          alt={track.title}
          width={48}
          height={48}
          className="rounded-lg object-cover shadow-lg shadow-black/20"
        />
        {index === currentTrackIndex && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{track.title}</p>
        <p className="text-sm text-neutral-400 truncate">
          {track.artist.name}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeFromQueue(index);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white/10 
          text-neutral-400 hover:text-white transition-all duration-300"
      >
        <ListX className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const QueuePanel: React.FC<QueuePanelProps> = ({
  queue,
  currentTrack,
  currentTrackIndex,
  onQueueItemClick,
  removeFromQueue,
  setQueue,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = queue.findIndex(track => track.id === active.id);
      const newIndex = queue.findIndex(track => track.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setQueue((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={queue.map(track => track.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 pr-2 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <div className="w-16 h-16 mb-4 rounded-full bg-neutral-800/50 flex items-center justify-center">
                <ListX className="w-8 h-8" />
              </div>
              <p className="text-sm">No tracks in queue</p>
            </div>
          ) : (
            queue.map((track, index) => (
              <SortableItem
                key={track.id}
                id={track.id}
                track={track}
                index={index}
                onQueueItemClick={onQueueItemClick}
                removeFromQueue={removeFromQueue}
                currentTrackIndex={currentTrackIndex}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
};
/* ----------------------------------------------
   D E T A I L S   P A N E L
---------------------------------------------- */

interface DetailsProps {
  currentTrack: Track;
  duration: number;
  listenCount: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  changeAudioQuality: (quality: AudioQuality) => void;
  isDataSaver: boolean;
  downloadTrack: (track: Track) => void;
}

const DetailsPanel: React.FC<DetailsProps> = ({
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
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging || !sliderRef.current) return;
  
    const handleVolumeDrag = (event: MouseEvent) => {
      if (!sliderRef.current) return;
  
      const rect = sliderRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(1, x / width));
  
      onVolumeChange(newVolume);
    };
  
    const handleMouseUp = () => setIsDragging(false);
  
    window.addEventListener("mousemove", handleVolumeDrag);
    window.addEventListener("mouseup", handleMouseUp);
  
    return () => {
      window.removeEventListener("mousemove", handleVolumeDrag);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onVolumeChange]);
  

  const handleVolumeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, x / width));
    onVolumeChange(newVolume);
  };

  const qualityOptions: Record<AudioQuality, {
    icon: LucideIcon;
    color: string;
    text: string;
  }> = {
    MAX: {
      icon: Crown,
      color: "bg-gradient-to-br from-amber-300 to-yellow-600",
      text: "Master Quality (24-bit, up to 192kHz)",
    },
    HIGH: {
      icon: Star,
      color: "bg-gradient-to-br from-violet-400 to-purple-600",
      text: "Hi-Fi Quality (16-bit, 44.1kHz)",
    },
    NORMAL: {
      icon: Fan,
      color: "bg-gradient-to-br from-blue-400 to-blue-600",
      text: "High Quality (320kbps)",
    },
    DATA_SAVER: {
      icon: CircleDollarSign,
      color: "bg-gradient-to-br from-emerald-400 to-green-600",
      text: "Data Saver (128kbps)",
    },
  };


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-gradient-to-b from-neutral-900 to-black p-6 overflow-y-auto"
    >
      {/* Album Art Section */}
      <motion.div 
        className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8 group"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Image
          src={currentTrack.album.cover_xl}
          alt={currentTrack.title}
          width={500}
          height={500}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-white text-black hover:bg-white/90"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current text-pink-500' : ''}`} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-white text-black hover:bg-white/90"
            onClick={() => downloadTrack(currentTrack)}
          >
            <Download className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-white text-black hover:bg-white/90"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <Share2 className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>

      {/* Track Info */}
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">{currentTrack.title}</h1>
        <p className="text-lg text-neutral-400">{currentTrack.artist.name}</p>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>{currentTrack.album.title}</span>
          <span>•</span>
          <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
          <span>•</span>
          <span>{listenCount?.toLocaleString()} plays</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90"
        >
          <ListMusic className="w-4 h-4" />
          Add to Playlist
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
        >
          <Radio className="w-4 h-4" />
          Start Radio
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="space-y-4 mb-8">
      <div className="flex items-center gap-3">
          {/* Mute/Unmute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="text-white hover:text-white/80"
          >
            {volume === 0 ? <VolumeX className="w-5 h-5" /> : 
            volume < 0.5 ? <Volume1 className="w-5 h-5" /> : 
            <Volume2 className="w-5 h-5" />}
          </motion.button>

          {/* Volume Slider */}
          <div 
            ref={sliderRef}
            className="relative flex-1 h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
            onMouseDown={handleVolumeClick}
          >
            {/* Volume Fill */}
            <motion.div
              className="h-full bg-white"
              style={{ width: `${volume * 100}%` }}
              layout
            />

            {/* Volume Thumb (Draggable Circle) */}
            <motion.div
  className="absolute bg-white rounded-full w-3 h-3 shadow-lg cursor-pointer z-10" 
  style={{
    top: "50%",
    transform: "translate(-50%, -50%)",
    left: `${volume * 100}%`,
    transition: "left 0.1s ease-out",
    border: "2px solid #e5e7eb",
    width: "12px",
    height: "12px",
  }}
  onMouseDown={() => setIsDragging(true)}
/>

          </div>
        </div>

      </div>

      {/* Audio Quality Selector */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className={`w-full p-4 rounded-xl ${qualityOptions[audioQuality].color} text-white`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {React.createElement(qualityOptions[audioQuality].icon, { size: 20 })}
              <span className="font-medium">{qualityOptions[audioQuality].text}</span>
            </div>
            <MoreHorizontal className="w-5 h-5" />
          </div>
        </motion.button>

        <AnimatePresence>
          {showQualityMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 rounded-xl overflow-hidden shadow-xl"
            >
              {Object.entries(qualityOptions).map(([quality, { icon: QIcon, text }]) => (
              <motion.button
                key={quality}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => {
                  changeAudioQuality(quality as AudioQuality);
                  setShowQualityMenu(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3
                  ${audioQuality === quality ? 'text-white bg-white/10' : 'text-neutral-400'}`}
                disabled={isDataSaver && quality !== 'DATA_SAVER'}
              >
                {React.createElement(QIcon, { size: 18 })}
                <span>{text}</span>
              </motion.button>
            ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Menu */}
        <AnimatePresence>
          {showShareMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-neutral-800 rounded-xl overflow-hidden shadow-xl"
            >
              {['Copy Link', 'Share to Twitter', 'Share to Facebook', 'Share to Instagram'].map((option) => (
                <motion.button
                  key={option}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  className="w-full px-4 py-3 text-left text-neutral-400 hover:text-white"
                  onClick={() => setShowShareMenu(false)}
                >
                  {option}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ----------------------------------------------
   S I D E B A R   O V E R L A Y   (Queue/Lyrics/Details)
---------------------------------------------- */
type SidebarTab = 'queue' | 'lyrics' | 'details';

interface SidebarOverlayProps {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  tab: SidebarTab;
  setTab: React.Dispatch<React.SetStateAction<SidebarTab>>;
  TABS?: Array<{
    id: SidebarTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  queuePanel: React.ReactNode;
  lyricsPanel: React.ReactNode;
  detailsPanel: React.ReactNode;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({
  showSidebar,
  setShowSidebar,
  tab,
  setTab,
  TABS = [
    { id: 'queue', label: 'Queue', icon: ListMusic },
    { id: 'lyrics', label: 'Lyrics', icon: MessageSquareText }, 
    { id: 'details', label: 'Details', icon: Info }
  ],
  queuePanel,
  lyricsPanel,
  detailsPanel,
}) => {
  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
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
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-b from-neutral-900/95 to-black/95 backdrop-blur-xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex items-center px-6 py-4 border-b border-white/5">
              <div className="absolute -left-12 p-1.5 rounded-l-xl bg-neutral-900/95 backdrop-blur-xl border border-white/5 border-r-0">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/5 transition-colors group"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                </button>
              </div>
              
              {/* Tabs */}
              <nav className="flex items-center gap-1 mx-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium
                      flex items-center gap-2 transition-all duration-200
                      hover:bg-white/5 active:bg-white/10
                      ${t.id === tab 
                        ? "bg-white/10 text-white shadow-lg" 
                        : "text-neutral-400"}
                    `}
                  >
                    <t.icon className={`w-4 h-4 ${t.id === tab ? "text-white" : "text-neutral-400"}`} />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Panel */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <div className="p-6">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === "queue" && queuePanel}
                  {tab === "lyrics" && lyricsPanel}
                  {tab === "details" && detailsPanel}
                </motion.div>
              </div>
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
