import type { Metadata, Viewport } from "next";
import { SpotifyClone } from "../components/index";
import { StrictMode } from "react";

export const metadata: Metadata = {
  title: "Octave Streaming",
  description: "Made by Custom and Abdullah",
  openGraph: {
    type: "website",
    title: "Octave Streaming",
    description: "Made by Custom and Abdullah",
    siteName: "Octave Streaming",
    images: [
      {
        url: "/images/OctaveBanner.png",
        width: 1200,
        height: 630,
        alt: "Octave Streaming Banner",
      },
    ],
  },
  icons: {
    icon: "/images/black_logo.png",
    shortcut: "/images/black_logo.png",
    apple: "/images/black_logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function SpotifyPage() {
  return (
    <StrictMode>
      <main className="min-h-[100dvh] bg-black overscroll-none">
        <SpotifyClone />
      </main>
    </StrictMode>
  );
}
