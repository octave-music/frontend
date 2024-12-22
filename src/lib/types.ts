// src/components/SpotifyClone/types.ts

/* -------------------------------------
 *  Basic Track / Playlist / Artist Types
 * ------------------------------------ */
export interface Track {
    id: string;
    title: string;
    artist: {
      name: string;
    };
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
  }
  
  export interface Artist {
    id: number;
    name: string;
    picture_medium: string;
  }
  
  /* -------------------------------------
   *  Lyrics & Lyric-Related
   * ------------------------------------ */
  export interface Lyric {
    time: number;        // Start time (seconds)
    endTime?: number;    // End time (seconds), optional
    text: string;
  }
  
  /* -------------------------------------
   *  PWA Install Prompt
   * ------------------------------------ */
  export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
  
  /* -------------------------------------
   *  Context Menu
   * ------------------------------------ */
  export interface ContextMenuOption {
    label: string;
    action: () => void;
  }
  
  export interface Position {
    x: number;
    y: number;
  }
  
  export interface CustomContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    options: ContextMenuOption[];
  }
  
  /* -------------------------------------
   *  TrackItem Props
   * ------------------------------------ */
  export interface TrackItemProps {
    track: Track;
    showArtist?: boolean;
    inPlaylistCreation?: boolean;
    onTrackClick?: (track: Track) => void;
    toggleTrackSelection?: (track: Track) => void;
    playTrack?: (track: Track) => void;
    addToQueue?: (track: Track) => void;
    openAddToPlaylistModal?: (track: Track) => void;
    selectedTracksForNewPlaylist?: Track[];
    handleContextMenu?: (e: React.MouseEvent, track: Track) => void;
  }
  
  /* -------------------------------------
   *  Onboarding Props
   * ------------------------------------ */
  export interface OnboardingStep1Props {
    onComplete: () => void;
  }
  
  export interface ArtistSelectionProps {
    onComplete: (selectedArtists: Artist[]) => void;
  }
  