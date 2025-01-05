/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, memo } from "react";
import { Plus, Library, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { TrackItemProps } from "@/lib/types/types";
import Image from "next/image";

interface ActionButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const ActionButton = memo<ActionButtonProps>(({ onClick, icon, active = false }) => (
  <button
    className={cn(
      "flex items-center justify-center",
      "w-8 h-8 rounded-full",
      "transition-all duration-300 ease-out",
      "hover:scale-110 hover:bg-white/10",
      "focus:outline-none focus:ring-2 focus:ring-white/20",
      active && "text-green-400",
      "sm:bg-transparent bg-white/10"
    )}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
  >
    {icon}
  </button>
));
ActionButton.displayName = 'ActionButton';

const ScrollingText = memo<{ text: string }>(({ text }) => {
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const textElement = document.createElement('span');
    textElement.style.visibility = 'hidden';
    textElement.style.whiteSpace = 'nowrap';
    textElement.textContent = text;
    document.body.appendChild(textElement);
    const textWidth = textElement.offsetWidth;
    document.body.removeChild(textElement);

    setShouldScroll(textWidth > 150);
  }, [text]);

  return (
    <div
      className="relative overflow-hidden w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p
        className={cn(
          "whitespace-nowrap transition-transform duration-300 ease-linear",
          shouldScroll && isHovered && "animate-marquee"
        )}
      >
        {text}
      </p>
    </div>
  );
});
ScrollingText.displayName = 'ScrollingText';

const ActionButtons = memo<{
  track: TrackItemProps['track'];
  addToQueue?: (track: any) => void;
  openAddToPlaylistModal?: (track: any) => void;
  toggleLike?: (track: any) => void;
  isLiked?: boolean;
}>(({ track, addToQueue, openAddToPlaylistModal, toggleLike, isLiked }) => (
  <div className="flex items-center gap-1 sm:gap-2 transition-all duration-300 shrink-0">
    {addToQueue && (
      <ActionButton
        onClick={() => addToQueue(track)}
        icon={<Plus className="w-4 h-4" />}
        label="Add to Queue"
      />
    )}
    {openAddToPlaylistModal && (
      <ActionButton
        onClick={() => openAddToPlaylistModal(track)}
        icon={<Library className="w-4 h-4" />}
        label="Add to Playlist"
      />
    )}
    {toggleLike && (
      <ActionButton
        onClick={() => toggleLike(track)}
        icon={<Heart className={cn("w-4 h-4", isLiked && "fill-current")} />}
        label={isLiked ? "Unlike" : "Like"}
        active={isLiked}
      />
    )}
  </div>
));
ActionButtons.displayName = 'ActionButtons';

const TrackItem = memo<TrackItemProps>(({
  track,
  showArtist = true,
  inPlaylistCreation = false,
  onTrackClick,
  addToQueue,
  openAddToPlaylistModal,
  toggleLike,
  isLiked,
  index = 0,
  isPrevious = false,
  onContextMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = (_e: React.MouseEvent) => {
    if (!inPlaylistCreation && onTrackClick) {
      onTrackClick(track, index ?? 0);
    }
  };

  const trackClasses = cn(
    "group relative flex items-center gap-3",
    "p-2 sm:p-3",
    "rounded-xl",
    "transition-all duration-300 ease-out",
    "border border-transparent",
    "hover:border-white/10",
    "hover:shadow-lg hover:shadow-black/5",
    "sm:hover:bg-white/5 bg-white/5",
    inPlaylistCreation ? "selectable" : "cursor-pointer",
    isPrevious && "opacity-50"
  );

  return (
    <div
      className={trackClasses}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square w-12 shrink-0">
        <Image
          src={track.album?.cover_medium || "/images/placeholder-image.png"}
          alt={`${track.title || "Track"} album cover`}
          className={cn(
            "rounded-lg object-cover",
            "transition-transform duration-300",
            "group-hover:shadow-lg",
            isHovered && "scale-105"
          )}
          fill
          sizes="48px"
          priority={false}
        />
        {!isMobile && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-black/40 rounded-lg",
            "transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Play className="w-6 h-6 fill-current" />
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 space-y-0.5">
        <ScrollingText text={track.title} />
        {showArtist && (
          <ScrollingText text={track.artist?.name || "Unknown Artist"} />
        )}
      </div>

      <div className={cn(
        "transition-all duration-300",
        "sm:opacity-0 sm:translate-x-4",
        (isHovered || isMobile || inPlaylistCreation) && "sm:opacity-100 sm:translate-x-0"
      )}>
        {inPlaylistCreation ? (
          <input
            type="checkbox"
            className={cn(
              "h-5 w-5 rounded-full",
              "border-2 border-white/20",
              "bg-transparent",
              "checked:bg-green-400 checked:border-transparent",
              "transition-all duration-300",
              "focus:ring-2 focus:ring-white/20",
              "cursor-pointer"
            )}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <ActionButtons
            track={track}
            addToQueue={addToQueue}
            openAddToPlaylistModal={openAddToPlaylistModal}
            toggleLike={toggleLike}
            isLiked={isLiked}
          />
        )}
      </div>
    </div>
  );
});
TrackItem.displayName = 'TrackItem';

export default TrackItem;