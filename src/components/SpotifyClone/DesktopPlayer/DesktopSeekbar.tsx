// src/components/SpotifyClone/DesktopPlayer/DesktopSeekbar.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import { formatTimeDesktop } from './utils'; // (See note below about formatTimeDesktop)

interface DesktopSeekbarProps {
  progress: number;
  handleSeek: (time: number) => void;
  duration: number;
}

/**
 * A simple progress bar for Desktop usage,
 * extracted from your original code.
 */
export default function DesktopSeekbar({
  progress,
  handleSeek,
  duration,
}: DesktopSeekbarProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [localProgress, setLocalProgress] = React.useState(progress);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) setLocalProgress(progress);
  }, [progress, isDragging]);

  const calculateProgress = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, ratio));
  }, []);

  const startDrag = useCallback(
    (x: number) => {
      setIsDragging(true);
      setLocalProgress(calculateProgress(x));
    },
    [calculateProgress]
  );

  const moveDrag = useCallback(
    (x: number) => {
      if (!isDragging) return;
      setLocalProgress(calculateProgress(x));
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
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, moveDrag, endDrag]);

  return (
    <div className="flex items-center w-full space-x-3 px-4 py-2">
      <span className="text-neutral-400 text-xs min-w-[40px] text-right">
        {formatTimeDesktop(localProgress * duration)}
      </span>

      {/* Progress bar container */}
      <div
        ref={progressRef}
        className="relative flex-1 h-1.5 bg-neutral-700/50 rounded-full cursor-pointer group backdrop-blur-sm"
        onMouseDown={(e) => startDrag(e.clientX)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      >
        {/* Filled portion */}
        <div
          className="absolute left-0 top-0 h-full bg-white/90 rounded-full group-hover:bg-green-400 transition-colors"
          style={{ width: `${localProgress * 100}%` }}
        />
        {/* Draggable handle */}
        <div
          className="absolute -top-2 h-5 w-5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ left: `${localProgress * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      <span className="text-neutral-400 text-xs min-w-[40px]">
        {formatTimeDesktop(duration)}
      </span>
    </div>
  );
}
