import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

import { Track, Playlist } from "@/lib/types/types";
import {
  storePlaylist as storePlaylistIDB,
  getAllPlaylists as getAllPlaylistsIDB,
  deletePlaylistByName as deletePlaylistByNameIDB,
} from "@/lib/managers/idbWrapper";
import { sanitizeTrackUtil } from "@/lib/utils/trackUtils";

/** Centralised playlist state + helpers */
export function useAppPlaylists() {
  /* ───────────────────────────── state ───────────────────────────── */
  const [playlists, setPlaylistsState] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylistState] = useState<Playlist | null>(
    null,
  );

  /* create-playlist modal */
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistImage, setNewPlaylistImage] = useState<string | null>(null);
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] =
    useState<Track[]>([]);

  /* add-to-playlist modal */
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<Track | null>(null);
  const [targetPlaylistName, setTargetPlaylistName] = useState<string | null>(
    null,
  );

  /* ─────────────────────── helper setters (persist) ─────────────────────── */
  const setPlaylists = useCallback(
    (updater: React.SetStateAction<Playlist[]>) => {
      setPlaylistsState((prev) => {
        const updated = typeof updater === "function" ? updater(prev) : updater;
        /* persist every playlist */
        updated.forEach((p) => storePlaylistIDB(p));
        return updated;
      });
    },
    [],
  );

  const setCurrentPlaylist = useCallback((pl: Playlist | null) => {
    setCurrentPlaylistState(pl);
  }, []);

  /* ─────────────────────────── initialise IDB ─────────────────────────── */
  useEffect(() => {
    (async () => {
      let pls = (await getAllPlaylistsIDB()) ?? [];

      if (!pls.some((p) => p.name === "Liked Songs")) {
        const liked: Playlist = {
          name: "Liked Songs",
          image: "/images/liked-songs.webp",
          tracks: [],
          pinned: true,
        };
        await storePlaylistIDB(liked);
        pls = [liked, ...pls];
      }

      const sanitised = pls.map((p) => ({
        ...p,
        tracks: p.tracks.map(sanitizeTrackUtil),
      }));
      setPlaylistsState(sanitised);
    })().catch(console.error);
  }, []);

  /* ───────────────────────────── mutations ───────────────────────────── */
  const addTrackToExistingPlaylist = useCallback(
    async (track: Track, playlistName: string) => {
      const t = sanitizeTrackUtil(track);
      let changed = false;

      const updated = playlists.map((pl) => {
        if (pl.name !== playlistName) return pl;
        if (pl.tracks.some((trk) => trk.id === t.id)) {
          toast.warn(`'${t.title}' is already in '${playlistName}'.`);
          return pl;
        }
        changed = true;
        return { ...pl, tracks: [...pl.tracks, t] };
      });

      if (changed) {
        setPlaylists(updated);
        toast.success(`'${t.title}' added to '${playlistName}'.`);
      }

      /* close modal */
      setShowAddToPlaylistModal(false);
      setTrackToAdd(null);
      setTargetPlaylistName(null);
    },
    [playlists, setPlaylists],
  );

  const openAddToPlaylistModalWithTrack = useCallback((t: Track) => {
    setTrackToAdd(sanitizeTrackUtil(t));
    setShowAddToPlaylistModal(true);
  }, []);

  const createNewPlaylist = useCallback(
    async (name: string, image?: string | null, tracks?: Track[]) => {
      if (!name.trim()) {
        toast.error("Playlist name cannot be empty.");
        return null;
      }
      if (playlists.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        toast.error(`Playlist "${name}" already exists.`);
        return null;
      }

      const newPl: Playlist = {
        name: name.trim(),
        image: image || "/images/defaultPlaylistImage.png",
        tracks: (tracks ?? []).map(sanitizeTrackUtil),
      };

      setPlaylists((prev) => [...prev, newPl]);
      toast.success(`Playlist "${newPl.name}" created.`);
      /* reset modal state */
      setShowCreatePlaylistModal(false);
      setNewPlaylistName("");
      setNewPlaylistImage(null);
      setSelectedTracksForNewPlaylist([]);
      return newPl;
    },
    [playlists, setPlaylists],
  );

  /** **Returns** the updated playlist array so the prop type stays `Promise<Playlist[]>`. */
  const deletePlaylist = useCallback(
    async (playlistName: string): Promise<Playlist[]> => {
      if (playlistName === "Liked Songs") {
        toast.warn("Cannot delete the 'Liked Songs' playlist.");
        return playlists;
      }

      /* delete in IDB and get fresh list */
      const updated = await deletePlaylistByNameIDB(playlistName);

      /* sanitise & update state */
      const sanitised = updated.map((p) => ({
        ...p,
        tracks: p.tracks.map(sanitizeTrackUtil),
      }));
      setPlaylistsState(sanitised);

      if (currentPlaylist?.name === playlistName) {
        setCurrentPlaylist(null);
      }

      toast.info(`Playlist "${playlistName}" deleted.`);
      return sanitised; //  ← makes signature Promise<Playlist[]>
    },
    [currentPlaylist?.name, playlists, setCurrentPlaylist],
  );

  const togglePinPlaylist = useCallback(
    (playlistName: string) => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.name === playlistName ? { ...p, pinned: !p.pinned } : p,
        ),
      );
    },
    [setPlaylists],
  );

  const addTrackToCurrentPlaylist = useCallback(
    async (track: Track) => {
      if (!currentPlaylist) {
        toast.error("No playlist selected to add the track.");
        return;
      }
      const t = sanitizeTrackUtil(track);
      if (currentPlaylist.tracks.some((trk) => trk.id === t.id)) {
        toast.warn("Track already in this playlist.");
        return;
      }

      const updatedPl = {
        ...currentPlaylist,
        tracks: [...currentPlaylist.tracks, t],
      };
      setCurrentPlaylist(updatedPl);
      setPlaylists((prev) =>
        prev.map((p) => (p.name === updatedPl.name ? updatedPl : p)),
      );
      toast.success(`Added to ${updatedPl.name}`);
    },
    [currentPlaylist, setCurrentPlaylist, setPlaylists],
  );

  /* ─────────────────────────── public API ─────────────────────────── */
  return {
    playlists,
    setPlaylists, // exposed enhanced setter
    currentPlaylist,
    setCurrentPlaylist,
    addTrackToExistingPlaylist,
    createNewPlaylist,
    deletePlaylist, // Promise<Playlist[]>
    togglePinPlaylist,
    addTrackToCurrentPlaylist,
    /* create-playlist modal */
    showCreatePlaylistModal,
    setShowCreatePlaylistModal,
    newPlaylistName,
    setNewPlaylistName,
    newPlaylistImage,
    setNewPlaylistImage,
    selectedTracksForNewPlaylist,
    setSelectedTracksForNewPlaylist,
    /* add-to-playlist modal */
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
    trackToAdd,
    targetPlaylistName,
    setTargetPlaylistName,
    openAddToPlaylistModalWithTrack,
  };
}
