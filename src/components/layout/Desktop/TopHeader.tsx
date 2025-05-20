// src/components/layout/Desktop/TopHeader.tsx
import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils/utils"
import { Download, Cog, UploadCloud, LogOut } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import type { ViewType } from "./types"

interface TopHeaderProps {
  greeting: string
  mounted: boolean
  showUserMenu: boolean
  setShowUserMenu: (v: boolean) => void
  setShowPwaModal: (v: boolean) => void
  setShowSpotifyToDeezerModal: (v: boolean) => void
  setView: (v: ViewType) => void
}

const TopHeader: React.FC<TopHeaderProps> = ({
  greeting,
  mounted,
  showUserMenu,
  setShowUserMenu,
  setShowPwaModal,
  setShowSpotifyToDeezerModal,
  setView,
}) => {
  // give window.deferredPrompt a local type so we don't have to cast to `any` directly
  type DeferredPrompt = {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
  }

  // Check if the code is running in the browser
  const isBrowser = typeof window !== "undefined"
  
  // State to track if app is in standalone mode
  const [isStandalone, setIsStandalone] = useState(false)
  
  // Effect to check standalone mode after mounting
  useEffect(() => {
    if (isBrowser) {
      setIsStandalone(window.matchMedia?.("(display-mode: standalone)")?.matches || false)
    }
  }, [isBrowser])
  
  // Safely access deferredPrompt
  const getDeferredPrompt = (): DeferredPrompt | undefined => {
    if (isBrowser) {
      return (window as Window & { deferredPrompt?: DeferredPrompt }).deferredPrompt
    }
    return undefined
  }

  return (
    <header className="flex justify-between items-center p-6">
      <h1 className="text-xl md:text-2xl font-semibold text-white">
        {greeting}
      </h1>

      <div className="relative flex items-center gap-2">
        {/* Install PWA Button */}
        {mounted && isBrowser && !isStandalone && (
          <button
            onClick={() => {
              const dp = getDeferredPrompt()
              if (dp) {
                dp.prompt()
                void dp.userChoice.then(() => {
                  if (isBrowser) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    delete (window as any).deferredPrompt
                  }
                })
              } else {
                setShowPwaModal(true)
              }
            }}
            className={cn(
              "flex items-center gap-2",
              "bg-indigo-600/90 text-white px-4 py-2 rounded-full",
              "text-sm font-medium transition-all duration-200",
              "hover:bg-indigo-700/90 active:scale-95"
            )}
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        )}

        {/* User Menu */}
        <div className="relative z-[999]">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full ring-2 ring-white/[0.06] overflow-hidden transition-transform active:scale-95"
          >
            <Avatar className="w-full h-full">
              <AvatarImage
                src="https://i.pinimg.com/236x/fb/7a/17/fb7a17e227af3cf2e63c756120842209.jpg"
                alt="User"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </button>

          {showUserMenu && (
            <div
              className={cn(
                "absolute right-0 mt-2 w-56 bg-gray-900/95",
                "backdrop-blur-xl rounded-xl border border-white/[0.02]",
                "shadow-xl divide-y divide-white/[0.04]",
                "animate-in fade-in slide-in-from-top-2 duration-200"
              )}
            >
              <button
                onClick={() => {
                  setView("settings")
                  setShowUserMenu(false)
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Cog className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setShowSpotifyToDeezerModal(true)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Migrate Playlists</span>
              </button>

              <button
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopHeader