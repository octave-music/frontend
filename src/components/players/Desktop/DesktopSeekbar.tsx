// src/components/player/Desktop/DesktopSeekbar.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { fmtTime } from "@/lib/utils/fmt"; // Adjust path as needed

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const displayProgress = isDragging ? seekProgress : progress;

  return (
    <div className="flex items-center w-full space-x-3 px-4 py-2">
      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {fmtTime(displayProgress * duration)}
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
            transition: 'opacity 0.2s ease, scale 0.2s ease', // Added transition for smoother appearance
          }}
        >
          <div 
            className="h-full w-full rounded-full shadow-lg"
            style={{
              backgroundColor: isDragging ? '#4ade80' : 'white'
            }}
          />
        </div>

        {(isHovering || isDragging) && ( // Show green tint when dragging too
          <div className="absolute inset-0 rounded-full bg-green-500/10 opacity-25" />
        )}
      </div>

      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {fmtTime(duration)}
      </span>
    </div>
  );
};

export default DesktopSeekbar;