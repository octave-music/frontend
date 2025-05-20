// src/components/player/Mobile/MobilePlayerExpandedArtworkInfo.tsx
import React from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import { Guitar } from "lucide-react";
import MobileQualityBadge from "./MobileQualityBadge";
import MobileSeekbar from "./MobileSeekbar";
import { Track } from "@/lib/types/types"; // Adjust path
import { AudioQuality } from "./types";
import { fmtTime } from "@/lib/utils/fmt"; // Adjust path

interface MobilePlayerExpandedArtworkInfoProps {
  currentTrack: Track;
  dominantColor: string | null; // For background gradient
  seekPosition: number;
  duration: number;
  audioQuality: AudioQuality;
  listenCount: number;
  onHandleSeek: (time: number) => void;
  onShowAudioMenu: () => void;
  onArtworkDragEnd: (info: PanInfo) => void; // For swipe to skip/prev
}

const MobilePlayerExpandedArtworkInfo: React.FC<MobilePlayerExpandedArtworkInfoProps> = ({
  currentTrack, dominantColor, seekPosition, duration, audioQuality, listenCount,
  onHandleSeek, onShowAudioMenu, onArtworkDragEnd
}) => {
  return (
    <>
      {/* Artwork with Background Blur */}
      <div className="relative w-full h-[min(65vw,300px)] flex justify-center items-center mb-6 mt-2 shrink-0">
        <div
          className="absolute inset-0 opacity-80 transition-all duration-500"
          style={{
            backgroundImage: dominantColor 
              ? `linear-gradient(to bottom, ${dominantColor}77, rgba(0,0,0,0.7))` 
              : `linear-gradient(to bottom, rgba(50,50,50,0.7), rgba(0,0,0,0.7))`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(20px) brightness(1.1) saturate(1.2)", // Softer blur
            transform: "scale(1.5)",
            zIndex: -1,
          }}
        />
        <motion.div
          className="relative w-[65vw] min-w-[220px] max-w-[300px] aspect-square shadow-xl rounded-lg"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(event, info) => onArtworkDragEnd(info)}
          layoutId="album-art-mobile" // For shared layout animation with mini player
        >
          <Image
            src={currentTrack.album.cover_medium || "/images/default-album.png"}
            alt={currentTrack.title || "Track Artwork"}
            fill
            sizes="(max-width: 768px) 65vw, 300px"
            className="object-cover rounded-lg"
            priority
          />
        </motion.div>
      </div>

      {/* Title, Artist, Quality, Listen Count */}
      <div className="w-full text-center mb-3 px-4 shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5 truncate">
          {currentTrack.title}
        </h2>
        <p className="text-sm sm:text-md text-white/70 truncate">{currentTrack.artist.name}</p>
        <div className="flex items-center justify-center space-x-2 mt-2.5">
            <MobileQualityBadge quality={audioQuality} onClick={onShowAudioMenu} />
            {listenCount > 0 && (
                <p className="text-yellow-400 text-[10px] flex items-center space-x-1 bg-black/20 px-2 py-0.5 rounded-full">
                    <Guitar className="w-3 h-3" />
                    <span>{listenCount.toLocaleString()} plays</span>
                </p>
            )}
        </div>
      </div>

      {/* Seekbar */}
      <div className="w-full mb-4 mt-3 px-2 shrink-0">
        <MobileSeekbar
          progress={duration > 0 ? seekPosition / duration : 0}
          handleSeek={onHandleSeek}
          duration={duration}
        />
        <div className="flex justify-between text-xs text-white/60 mt-1 px-2">
          <span>{fmtTime(seekPosition)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>
    </>
  );
};

export default MobilePlayerExpandedArtworkInfo;