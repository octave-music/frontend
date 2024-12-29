// app/layout.tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ServiceWorkerRegistration from "../components/service/ServiceWorkerRegistration"; // Import the registration component

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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  minimumScale: 1,
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  title: {
    default: "Octave Streaming",
    template: "%s | Octave Streaming",
  },
  description: "Stream for Free Forever",
  keywords: ["music", "streaming", "spotify", "clone", "nextjs"],
  authors: [{ name: "Your Name" }],
  creator: "Abdullah (DebateMyRoomba)",
  publisher: "Cu3t0m ",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://beta.Octave.gold",
    siteName: "Octave Streaming",
    title: "Octave Streaming",
    description: "Stream for Free Forever",
    images: [
      {
        url: "/images/OctaveBanner.png",
        width: 1200,
        height: 630,
        alt: "Octave Streaming Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Octave Streaming",
    description: "Made by Custom and Abdullah",
    images: ["/images/OctaveBanner.png"],
  },
  icons: {
    icon: "/images/black_logo.png",
    shortcut: "/images/black_logo.png",
    apple: "/images/black_logo.png",
  },
  manifest: "/manifest.json",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html
      lang="en"
      className="dark h-full"
      suppressHydrationWarning
    >
      <head />
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background min-h-[100dvh] overscroll-none`}>
        {/* Register the Service Worker */}
        <ServiceWorkerRegistration />

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