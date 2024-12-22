import type { Metadata, Viewport } from 'next'
import  SpotifyClone  from "../components"

export const metadata: Metadata = {
  title: 'Octave Streaming',
  description: 'Made by Custom and Abdullah',
  openGraph: {
    type: 'website',
    title: 'Octave Streaming',
    description: 'Made by Custom and Abdullah',
    siteName: 'Oactive Streaming',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' // Add this line
}

export default function SpotifyPage() {
  return (
    <main className="min-h-[100dvh] bg-black overscroll-none">
      <SpotifyClone />
    </main>
  )
}