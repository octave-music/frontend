// src/components/player/Desktop/DetailsPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Download, ListMusic, Radio, Volume2, Volume1, VolumeX,
  LucideIcon, Crown, Star, Fan, CircleDollarSign, MoreHorizontal,
UserPlus, Library, Share2, Music2
} from "lucide-react";
import { Track } from "@/lib/types/types"; // Adjust path
import { AudioQuality } from "./types";
import { fmtTime } from "@/lib/utils/fmt"; // Adjust path

interface DetailsPanelProps {
  currentTrack: Track | null; // Allow null
  duration: number;
  listenCount: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  changeAudioQuality: (quality: AudioQuality) => Promise<void>; // Or sync
  isDataSaver: boolean; // Or derive from audioQuality
  downloadTrack: (track: Track) => void;
  isLikedCurrentTrack: boolean; // Pass this as a prop
  toggleLikeCurrentTrack: () => void; // Pass this as a prop
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  currentTrack,
  duration,
  listenCount,
  volume,
  onVolumeChange,
  audioQuality,
  changeAudioQuality,
  isDataSaver,
  downloadTrack,
  isLikedCurrentTrack,
  toggleLikeCurrentTrack,
}) => {
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  // isLiked state is now managed by parent DesktopPlayer
  // const [showShareMenu, setShowShareMenu] = useState(false); // Not used in provided code
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVolumeDragging || !volumeSliderRef.current) return;

    const handleVolumeDrag = (event: MouseEvent) => {
      if (!volumeSliderRef.current) return;
      event.preventDefault();

      const rect = volumeSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const newVolume = x / rect.width;
      
      requestAnimationFrame(() => {
        onVolumeChange(newVolume);
      });
    };

    const handleMouseUp = () => {
      setIsVolumeDragging(false);
      document.body.style.userSelect = 'auto';
    };

    document.body.style.userSelect = 'none';
    window.addEventListener("mousemove", handleVolumeDrag, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = 'auto';
      window.removeEventListener("mousemove", handleVolumeDrag);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isVolumeDragging, onVolumeChange]);

  const handleVolumeSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return;
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const newVolume = x / rect.width;
    onVolumeChange(newVolume);
  };

  const qualityOptions: Record<AudioQuality, {
    icon: LucideIcon;
    color: string;
    text: string;
    description: string;
  }> = {
    MAX: {
      icon: Crown,
      color: "bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400",
      text: "Max Quality",
      description: "Up to 24-bit/192kHz FLAC",
    },
    HIGH: {
      icon: Star,
      color: "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500",
      text: "High Quality",
      description: "16-bit/44.1kHz FLAC",
    },
    NORMAL: {
      icon: Fan,
      color: "bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500",
      text: "Standard Quality",
      description: "Up to 320kbps AAC",
    },
    DATA_SAVER: {
      icon: CircleDollarSign, // Consider a WifiOff or similar icon
      color: "bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500",
      text: "Data Saver",
      description: "Up to 128kbps AAC",
    },
  };

  const trackActions = [
    // These are illustrative, actions should be wired up
    { icon: ListMusic, label: "Add to Playlist", action: () => console.log("Add to Playlist") },
    { icon: Radio, label: "Start Radio", action: () => console.log("Start Radio") },
    { icon: Download, label: "Download", action: () => currentTrack && downloadTrack(currentTrack) },
    { icon: Share2, label: "Share", action: () => console.log("Share") },
    { icon: UserPlus, label: "Follow Artist", action: () => console.log("Follow Artist") },
    { icon: Library, label: "Add to Library", action: () => console.log("Add to Library") },
    // { icon: Flag, label: "Report", action: () => console.log("Report") },
    // { icon: AlertCircle, label: "Credits", action: () => console.log("Credits") },
  ];
  
  if (!currentTrack) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-neutral-500">No track selected.</p>
      </div>
    );
  }
  const currentQuality = qualityOptions[audioQuality];

  return (
    <motion.div 
      key={currentTrack.id} // Re-animate when track changes
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-transparent overflow-y-auto scrollbar-hide p-6 pb-20" // Added pb-20 for scroll room
    >
      {/* Album Art Section */}
      <motion.div 
        className="relative aspect-square rounded-xl overflow-hidden shadow-xl mb-6 group"
        whileHover={{ scale: 1.015 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {currentTrack.album.cover_xl ? (
            <Image
            src={currentTrack.album.cover_xl}
            alt={currentTrack.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            className="w-full h-full object-cover"
            />
        ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <Music2 className="w-24 h-24 text-neutral-600" />
            </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLikeCurrentTrack}
            className="p-3 rounded-full bg-white/10 text-white backdrop-blur-sm"
          >
            <Heart className={`w-5 h-5 transition-colors ${isLikedCurrentTrack ? 'fill-pink-500 text-pink-500' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Track Info */}
      <div className="space-y-1 mb-6 text-center">
        <h1 className="text-xl font-semibold text-white tracking-tight">{currentTrack.title}</h1>
        <p className="text-md text-neutral-300 hover:underline cursor-pointer">{currentTrack.artist.name}</p>
        <p className="text-sm text-neutral-400 hover:underline cursor-pointer">{currentTrack.album.title}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-1">
          <span>{fmtTime(duration)}</span>
          {listenCount > 0 && <><span>•</span><span>{listenCount.toLocaleString()} plays</span></>}
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {trackActions.slice(0,6).map(({ icon: Icon, label, action }) => (
          <motion.button
            key={label}
            whileHover={{ scale: 1.03, y: -1, backgroundColor: 'rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.97 }}
            onClick={action}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-white/5 transition-colors aspect-square" // aspect-square for consistency
          >
            <Icon className="w-5 h-5 text-neutral-300" />
            <span className="text-[10px] text-neutral-400 text-center leading-tight">{label}</span>
          </motion.button>
        ))}
      </div>

      {/* Volume Control */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)} // Restore to 0.7 or custom previous
            className="p-1.5 text-neutral-400 hover:text-white"
          >
            {volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
          </motion.button>
          <div 
            ref={volumeSliderRef}
            className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleVolumeSliderClick}
            onMouseDown={() => setIsVolumeDragging(true)}
          >
            <motion.div
              className="absolute h-full bg-white rounded-full origin-left"
              style={{ scaleX: volume }}
              transition={{ type: "tween", ease: "circOut", duration: 0.15 }}
            />
            <motion.div
              className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${volume * 100}%`, y: "-50%", x: "-50%"}}
              transition={{ type: "tween", ease: "circOut", duration: 0.15 }}
            />
          </div>
        </div>
      </div>

      {/* Audio Quality Selector */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.01, boxShadow: "0 0 15px rgba(0,0,0,0.3)" }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowQualityMenu(!showQualityMenu)}
          className={`w-full p-3 rounded-lg text-white transition-all duration-200 ${currentQuality.color}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <currentQuality.icon size={18} />
              <div>
                <span className="font-medium text-sm">{currentQuality.text}</span>
                <p className="text-xs opacity-80">{currentQuality.description}</p>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 opacity-80" />
          </div>
        </motion.button>

        <AnimatePresence>
          {showQualityMenu && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98, transition: { duration: 0.15} }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute bottom-full left-0 right-0 mb-1.5 bg-neutral-800/90 backdrop-blur-md rounded-lg shadow-xl overflow-hidden border border-white/10"
            >
              {Object.entries(qualityOptions).map(([q, { icon: QIcon, text, description }]) => (
                <motion.button
                  key={q}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  onClick={() => {
                    changeAudioQuality(q as AudioQuality);
                    setShowQualityMenu(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left
                    ${audioQuality === q ? 'text-white bg-white/10' : 'text-neutral-300 hover:text-white'}
                    ${(isDataSaver && q !== 'DATA_SAVER') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isDataSaver && q !== 'DATA_SAVER'}
                >
                  <QIcon size={16} className={`${audioQuality === q ? 'text-white' : 'text-neutral-400'}`} />
                  <div>
                    <span className="text-xs font-medium">{text}</span>
                    <p className="text-[10px] opacity-70">{description}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DetailsPanel;