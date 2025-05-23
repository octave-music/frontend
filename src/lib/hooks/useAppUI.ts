// src/hooks/useAppUI.ts
import { useState, useCallback, useEffect } from 'react';
import { Position, ContextMenuOption, BeforeInstallPromptEvent } from '@/lib/types/types'; // Adjust path
import { getDynamicGreeting as getGreetingUtil } from '../utils/uiUtils'; // We'll create this util

export type AppView = "home" | "search" | "playlist" | "settings" | "library";

export function useAppUI() {
  const [view, setViewState] = useState<AppView>("home");
  const [isPlayerOpen, setIsPlayerOpenState] = useState(false); // For mobile player overlay
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false); // For desktop sidebar
  const [isSearchDrawerOpen, setIsSearchDrawerOpenState] = useState(false); // For mobile search drawer

  // Modals & Menus
  const [showSettingsMenu, setShowSettingsMenuState] = useState(false); // Desktop user menu dropdown
  const [showPwaModal, setShowPwaModalState] = useState(false);
  const [showContextMenu, setShowContextMenuState] = useState(false);
  const [contextMenuPosition, setContextMenuPositionState] = useState<Position>({ x: 0, y: 0 });
  const [contextMenuOptions, setContextMenuOptionsState] = useState<ContextMenuOption[]>([]);
  
  // Onboarding related UI state
  const [showOnboarding, setShowOnboardingState] = useState(false);
  // const [showArtistSelection, setShowArtistSelectionState] = useState(false); // If this is a separate screen from onboarding

  // Other modals from original code
  const [showDeleteConfirmation, setShowDeleteConfirmationState] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null); // Store name for confirmation
  const [showSpotifyToDeezerModal, setShowSpotifyToDeezerModalState] = useState(false);

  const [greeting, setGreetingState] = useState(getGreetingUtil());

  const setView = useCallback((newView: AppView) => {
    setViewState(newView);
    if (newView === 'search') {
        setIsSearchDrawerOpenState(true); // Auto-open search drawer for mobile
    } else {
        setIsSearchDrawerOpenState(false); // Close it for other views
    }
  }, []);

  const setIsPlayerOpen = useCallback((isOpen: boolean) => setIsPlayerOpenState(isOpen), []);
  const setSidebarCollapsed = useCallback((isCollapsed: boolean) => setSidebarCollapsedState(isCollapsed), []);
  const setIsSearchDrawerOpen = useCallback((isOpen: boolean) => setIsSearchDrawerOpenState(isOpen), []);
  
  const setShowSettingsMenu = useCallback((show: boolean | ((prev: boolean) => boolean)) => setShowSettingsMenuState(show), []);
  const setShowPwaModal = useCallback((show: boolean) => setShowPwaModalState(show), []);
  
  const openContextMenu = useCallback((options: ContextMenuOption[], position: Position) => {
    setContextMenuOptionsState(options);
    setContextMenuPositionState(position);
    setShowContextMenuState(true);
  }, []);
  const closeContextMenu = useCallback(() => setShowContextMenuState(false), []);

  const setShowOnboarding = useCallback((show: boolean) => setShowOnboardingState(show), []);

  // ADDED useCallback wrapper for setShowSpotifyToDeezerModal
  const setShowSpotifyToDeezerModal = useCallback((show: boolean) => setShowSpotifyToDeezerModalState(show), []);


  const confirmDeletePlaylist = useCallback((playlistName: string) => {
    setPlaylistToDelete(playlistName);
    setShowDeleteConfirmationState(true);
  }, []);
  const cancelDeletePlaylist = useCallback(() => {
    setShowDeleteConfirmationState(false);
    setPlaylistToDelete(null);
  }, []);
  
  const closeAllModals = useCallback(() => {
    setShowSettingsMenuState(false);
    setShowPwaModalState(false);
    setShowContextMenuState(false);
    setShowDeleteConfirmationState(false);
    setShowSpotifyToDeezerModalState(false); // Also close spotify modal
    // Add other modals here that should be closed, e.g., CreatePlaylist, AddToPlaylist
    // These will be managed by useAppPlaylists hook but can be closed from a central place if needed
  }, []);

  // Dynamic Greeting Update
  useEffect(() => {
    const timer = setInterval(() => setGreetingState(getGreetingUtil()), 60 * 60 * 1000); // Update every hour
    return () => clearInterval(timer);
  }, []);

  // PWA Install Prompt Handling
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      // Optionally, show a custom install button now
      // For simplicity, we might rely on the user menu "Install App" button
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);


  return {
    view, setView,
    isPlayerOpen, setIsPlayerOpen,
    sidebarCollapsed, setSidebarCollapsed,
    isSearchDrawerOpen, setIsSearchDrawerOpen,
    greeting,
    // Modals & Menus
    showSettingsMenu, setShowSettingsMenu,
    showPwaModal, setShowPwaModal,
    showContextMenu, openContextMenu, closeContextMenu, contextMenuPosition, contextMenuOptions,
    // Onboarding
    showOnboarding, setShowOnboarding,
    // Confirmation Modals
    showDeleteConfirmation, confirmDeletePlaylist, cancelDeletePlaylist, playlistToDelete,
    showSpotifyToDeezerModal, 
    setShowSpotifyToDeezerModal, // CORRECTED: Return the useCallback wrapped function
    // Helper to close all typical modals
    closeAllModals,
  };
}