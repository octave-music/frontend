// src/components/layout/Desktop/Sidebar.tsx
import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils/utils"
import {
  Home,
  Search,
  Library,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
} from "lucide-react"

import type { Playlist } from "@/lib/types/types"
import type { ViewType, Position, ContextMenuOption } from "./types"

interface SidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  view: ViewType
  setView: (v: ViewType) => void

  playlists: Playlist[]
  setPlaylists: (pl: Playlist[]) => void
  openPlaylist: (p: Playlist) => void
  storePlaylist: (p: Playlist) => Promise<void>
  deletePlaylistByName: (name: string) => Promise<Playlist[]>

  setShowCreatePlaylist: (v: boolean) => void

  setContextMenuPosition: (pos: Position) => void
  setContextMenuOptions: (opts: ContextMenuOption[]) => void
  setShowContextMenu: (val: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,

  view,
  setView,

  playlists,
  setPlaylists,
  openPlaylist,
  storePlaylist,
  deletePlaylistByName,

  setShowCreatePlaylist,

  setContextMenuPosition,
  setContextMenuOptions,
  setShowContextMenu,
}) => {
  return (
    <aside
      className={cn(
        "relative h-full bg-gradient-to-b from-gray-900/95 to-black/95",
        "transition-all duration-300 ease-in-out rounded-xl shadow-xl",
        "border border-white/[0.02] backdrop-blur-xl",
        sidebarCollapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Collapse/Expand Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "absolute -right-2.5 top-6 w-5 h-10 flex items-center justify-center",
          "bg-white/[0.03] rounded-full border border-white/[0.02]",
          "hover:bg-white/[0.06] transition-all duration-200 backdrop-blur-xl"
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col h-full">
        <div className="flex flex-col gap-1 p-3">
          {[
            { icon: Home, label: "Home", action: () => setView("home") },
            { icon: Search, label: "Search", action: () => setView("search") },
          ].map((item) => {
            const isActive = view === item.label.toLowerCase()
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  "group relative flex items-center px-3 py-2.5 rounded-lg",
                  "hover:bg-white/[0.06] transition-all duration-200",
                  sidebarCollapsed ? "justify-center" : "justify-start",
                  isActive && "bg-white/[0.08]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : "text-gray-400",
                    "transition-colors"
                  )}
                />
                {!sidebarCollapsed && (
                  <span
                    className={cn(
                      "ml-3 text-sm font-medium",
                      isActive ? "text-white" : "text-gray-400"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="h-px bg-white/[0.04] mx-3" />

        {/* Your Library */}
        <div className="flex flex-col flex-1 min-h-0 p-3">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("flex items-center gap-3", sidebarCollapsed && "mx-auto")}>
              <Library className="w-5 h-5 text-gray-400" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium text-gray-400">
                  Your Library
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Playlists */}
          <div className="overflow-y-auto flex-1 pr-1 -mr-1 custom-scrollbar">
            <div className="space-y-1">
              {playlists.map((pl) => (
                <div
                  key={pl.name}
                  onClick={() => openPlaylist(pl)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                    "hover:bg-white/[0.06] transition-colors duration-200",
                    pl.pinned && "bg-white/[0.03]",
                    sidebarCollapsed && "justify-center"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Image
                      src={pl.image || "/images/defaultPlaylistImage.png"}
                      alt={pl.name}
                      width={sidebarCollapsed ? 40 : 44}
                      height={sidebarCollapsed ? 40 : 44}
                      className="rounded-md object-cover"
                      priority
                    />
                    {pl.downloaded && (
                      <div className="absolute -top-1 -right-1 bg-green-500/90 rounded-full p-0.5">
                        <Download className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-200 truncate">
                          {pl.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {pl.tracks.length} tracks
                        </p>
                      </div>

                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/[0.08] transition-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          const options: ContextMenuOption[] = [
                            {
                              label: pl.pinned ? "Unpin Playlist" : "Pin Playlist",
                              action: () => {
                                const updated = playlists.map((p) =>
                                  p.name === pl.name
                                    ? { ...p, pinned: !p.pinned }
                                    : p
                                )
                                setPlaylists(updated)
                                void Promise.all(updated.map((item) => storePlaylist(item)))
                              },
                            },
                            {
                              label: "Delete Playlist",
                              action: () => {
                                void deletePlaylistByName(pl.name).then(setPlaylists)
                              },
                            },
                          ]
                          setContextMenuPosition({ x: e.clientX, y: e.clientY })
                          setContextMenuOptions(options)
                          setShowContextMenu(true)
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
