/* eslint-disable @next/next/no-img-element */
// TrackItem.tsx

import React, { useState } from 'react';
import { Plus, Library, Heart } from 'lucide-react';
import { cn } from '../../lib/utils/utils'; // Ensure this utility function exists

import { TrackItemProps } from "../../lib/types/types"

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon }) => {
  return (
    <button
      className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors duration-200 group relative"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      <span className="text-white">{icon}</span>
    </button>
  );
};

const TrackItem: React.FC<TrackItemProps> = ({
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

  const handleClick = (_evt: React.MouseEvent) => {
    if (!inPlaylistCreation && onTrackClick) {
      onTrackClick(track, index);
    }
  };

  const trackClasses = cn(
    'group flex items-center gap-4 bg-gray-800/40 rounded-lg p-3 relative',
    'hover:bg-gray-700/40 transition-colors duration-200',
    inPlaylistCreation ? 'selectable' : 'cursor-pointer',
    isPrevious && 'opacity-50'
  );

  const ActionButtons = () => (
    <div className="flex items-center space-x-2 transition-all duration-200">
      {addToQueue && (
        <ActionButton
          onClick={() => addToQueue(track)}
          icon={<Plus className="w-4 h-4" />}
        />
      )}
      {openAddToPlaylistModal && (
        <ActionButton
          onClick={() => {
            console.log("Library icon clicked for track:", track);
            openAddToPlaylistModal(track);
          }}
          icon={<Library className="w-4 h-4" />}
        />
      )}
      {toggleLike && (
        <ActionButton
          onClick={() => toggleLike(track)}
          icon={
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-green-500 text-green-500' : 'text-white'
              }`}
            />
          }
        />
      )}
    </div>
  );

  return (
    <div
      className={trackClasses}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative min-w-[48px]">
        <img
          src={track.album?.cover_medium || '/images/placeholder-image.png'}
          alt={`${track.title || 'Track'} album cover`}
          className="w-12 h-12 rounded-md object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-grow min-w-0">
        <p className="font-medium truncate">{track.title}</p>
        {showArtist && (
          <p className="text-sm text-gray-400 truncate">
            {track.artist?.name || 'Unknown Artist'}
          </p>
        )}
      </div>

      <div
        className={cn(
          'transition-opacity duration-200',
          isHovered || inPlaylistCreation ? 'opacity-100' : 'opacity-0'
        )}
      >
        {inPlaylistCreation ? (
          <input
            type="checkbox"
            className="h-5 w-5 rounded-full border-none bg-gray-700 checked:bg-green-500 
                       transition-colors duration-200 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <ActionButtons />
        )}
      </div>
    </div>
  );
};

export default TrackItem;
