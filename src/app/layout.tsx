// app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/service/ServiceWorkerRegistration";
import SplashScreen from "@/components/common/SplashScreen";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  minimumScale: 1,
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://beta.octave.gold"),
  title: {
    default: "Octave Streaming",
    template: "%s | Octave Streaming",
  },
  description:
    "Stream for Free Forever - Your Ultimate Music Streaming Experience",
  keywords: [
    "music streaming",
    "free music",
    "spotify alternative",
    "octave streaming",
    "music player",
    "web music",
    "online music",
  ],
  authors: [
    { name: "Abdullah", url: "https://github.com/AbdullahDaGoat" },
    { name: "Cu3t0m", url: "https://github.com/Cu3t0m" },
  ],
  creator: "DebateMyRoomba",
  publisher: "Cu3t0m",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://beta.octave.gold",
    siteName: "Octave Streaming",
    title: "Octave Streaming - Free Music Forever",
    description:
      "Stream your favorite music for free, forever. High-quality streaming, no ads, unlimited music.",
    images: [
      {
        url: "/images/OctaveBanner.png",
        width: 1200,
        height: 630,
        alt: "Octave Streaming Banner",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Octave Streaming",
    description: "Your Ultimate Free Music Streaming Platform",
    images: ["/images/OctaveBanner.png"],
    creator: "@DebateMyRoomba",
    site: "@OctaveStreaming",
  },

  icons: {
    icon: [
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/images/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/images/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
    other: [
      {
        rel: "mask-icon",
        url: "/images/black_logo.png",
      },
    ],
  },

  manifest: "/manifest.json",

  applicationName: "Octave Streaming",
  appleWebApp: {
    capable: true,
    title: "Octave Streaming",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/images/black_logo.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/images/black_logo.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/images/black_logo.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  category: "music",

  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Octave",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#000000",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background min-h-[100dvh] overscroll-none`}
      >
        <ServiceWorkerRegistration />
        <SplashScreen />

        <main className="relative flex min-h-[100dvh] flex-col">
          {children}
        </main>

        <a
          href="#main-content"
          className="fixed top-0 left-0 p-2 -translate-y-full focus:translate-y-0 bg-background z-50"
        >
          Skip to content
        </a>
      </body>
    </html>
  );
}

export const runtime = "edge";
export const preferredRegion = "auto";
