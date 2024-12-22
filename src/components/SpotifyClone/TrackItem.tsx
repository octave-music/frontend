/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { Play, Plus, Library } from 'lucide-react';
import { Track } from '../../lib/types'; // or inline if you prefer

interface TrackItemProps {
  track: Track;
  showArtist?: boolean;
  inPlaylistCreation?: boolean;
  onTrackClick?: (track: Track) => void;
  // The following come from your main code. We'll pass them as needed:
  toggleTrackSelection?: (track: Track) => void;
  playTrack?: (track: Track) => void;
  addToQueue?: (track: Track) => void;
  openAddToPlaylistModal?: (track: Track) => void;
  selectedTracksForNewPlaylist?: Track[];
  handleContextMenu?: (e: React.MouseEvent, track: Track) => void;
}

/**
 * A single track row or item used throughout the code:
 */
export default function TrackItem({
  track,
  showArtist = true,
  inPlaylistCreation = false,
  onTrackClick,
  toggleTrackSelection,
  playTrack,
  addToQueue,
  openAddToPlaylistModal,
  selectedTracksForNewPlaylist = [],
  handleContextMenu
}: TrackItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (inPlaylistCreation) {
      e.stopPropagation();
      if (toggleTrackSelection) toggleTrackSelection(track);
    } else if (onTrackClick) {
      onTrackClick(track);
    } else if (playTrack) {
      playTrack(track);
    }
  };

  const coverImage = track.album?.cover_medium || '/images/placeholder-image.png';

  return (
    <div
      className={`group flex items-center space-x-4 bg-gray-800 bg-opacity-40 rounded-lg p-2 relative cursor-pointer ${
        inPlaylistCreation ? 'selectable' : ''
      }`}
      onClick={handleTrackClick}
      onContextMenu={(e) => {
        if (handleContextMenu) {
          handleContextMenu(e, track);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img src={coverImage} alt={track.title} className="w-12 h-12 rounded-md" />
        {isHovered && !inPlaylistCreation && playTrack && (
          <button
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300"
            onClick={(e) => {
              e.stopPropagation();
              playTrack(track);
            }}
          >
            <Play className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      <div className="flex-grow">
        <p className="font-medium">{track.title}</p>
        {showArtist && <p className="text-sm text-gray-400">{track.artist?.name || 'Unknown Artist'}</p>}
      </div>

      {inPlaylistCreation ? (
        <input
          type="checkbox"
          checked={selectedTracksForNewPlaylist.some((t) => t.id === track.id)}
          onChange={(e) => {
            e.stopPropagation();
            if (toggleTrackSelection) toggleTrackSelection(track);
          }}
          className="ml-auto bg-gray-700 rounded-full border-none"
        />
      ) : (
        isHovered && (
          <div className="flex space-x-2 transition-opacity duration-300">
            {addToQueue && (
              <button
                className="bg-gray-700 rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(track);
                }}
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            )}
            {openAddToPlaylistModal && (
              <button
                className="bg-gray-700 rounded-full p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddToPlaylistModal(track);
                }}
              >
                <Library className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
