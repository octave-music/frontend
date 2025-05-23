// src/components/player/Mobile/MobileSeekbar.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fmtTime } from "@/lib/utils/fmt"; // Adjust path

interface MobileSeekbarProps {
  progress: number;
  handleSeek: (time: number) => void;
  isMiniPlayer?: boolean; // Renamed for clarity within Mobile context
  duration: number;
}

const MobileSeekbar: React.FC<MobileSeekbarProps> = ({
  progress,
  handleSeek,
  isMiniPlayer = false,
  duration,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const [showTooltip, setShowTooltip] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(isNaN(progress) ? 0 : progress);
    }
  }, [progress, isDragging]);

  const calculateProgress = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setShowTooltip(true);
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
      if (e.cancelable) e.preventDefault(); // Prevent page scroll only if cancelable
      handleDragMove(e.touches[0].clientX);
    };
    const onEnd = () => handleDragEnd();

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchend", onEnd);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const height = isMiniPlayer ? "h-0.5" : "h-1.5"; // Thinner for miniplayer
  const thumbSize = isMiniPlayer ? "w-2.5 h-2.5" : "w-3.5 h-3.5"; // Smaller thumb

  return (
    <div
      className={`relative ${isMiniPlayer ? 'mx-0 py-1' : 'mx-4 py-3'} touch-none`} // Less padding for mini
      onMouseEnter={() => !isMiniPlayer && setShowTooltip(true)}
      onMouseLeave={() => !isDragging && !isMiniPlayer && setShowTooltip(false)}
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
          transition={
            isDragging
              ? { duration: 0 }
              : { type: "spring", stiffness: 400, damping: 35 }
          }
        />
        <motion.div
            className={`absolute top-1/2 -translate-y-1/2 ${thumbSize} bg-white rounded-full shadow-md pointer-events-none`}
            style={{ left: `${localProgress * 100}%`, x: "-50%" }}
            animate={{
            scale: isDragging || (showTooltip && !isMiniPlayer) ? 1.1 : 1,
            opacity: isMiniPlayer ? 0 : (isDragging || (showTooltip && !isMiniPlayer) ? 1 : 0), // Hide thumb completely for mini player
            }}
            transition={{ duration: 0.15 }}
        />
      </div>

      <AnimatePresence>
        {(showTooltip || isDragging) && !isMiniPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full mb-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-sm pointer-events-none"
            style={{
              left: `calc(${localProgress * 100}%)`,
              transform: "translateX(-50%)",
            }}
          >
            {fmtTime(localProgress * duration)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSeekbar;