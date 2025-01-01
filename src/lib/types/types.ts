// types/types.ts

import React from "react";

export interface Track {
  id: string;
  title: string;
  artist: { name: string };
  album: {
    title: string;
    cover_medium: string;
    cover_small: string;
    cover_big: string;
    cover_xl: string;
  };
}

export interface Playlist {
  name: string;
  image: string;
  tracks: Track[];
  pinned?: boolean;
  downloaded?: boolean;
  bannerImage?: string | null; // Optional banner image
}

export interface Lyric {
  time: number;
  endTime?: number;
  text: string;
}

export interface ContextMenuOption {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface ContextMenuItem extends ContextMenuOption {
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
}

export interface CustomContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

export interface TrackItemProps {
  track: Track;
  showArtist?: boolean;
  inPlaylistCreation?: boolean;
  onTrackClick?: (track: Track, index: number) => void;
  addToQueue?: (track: Track) => void;
  openAddToPlaylistModal?: (track: Track) => void;
  toggleLike?: (track: Track) => void;
  isLiked?: boolean;
  index?: number; 
  isPrevious?: boolean;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
}

export interface Artist {
  id: number;
  name: string;
  picture_medium: string;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface AudioState {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
