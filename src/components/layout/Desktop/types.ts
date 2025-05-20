// src/components/layout/Desktop/types.ts

export interface Position {
  x: number
  y: number
}

export interface ContextMenuOption {
  label: string
  action: () => void
}

export type ViewType = "search" | "home" | "playlist" | "settings" | "library"
export type AudioQuality = "MAX" | "HIGH" | "NORMAL" | "DATA_SAVER";