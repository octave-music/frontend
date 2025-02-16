"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => setIsLoaded(true), 100);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-all duration-500 ease-in-out ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${!isVisible ? "pointer-events-none" : ""}`}
    >
      {/* Fullscreen Blurred Background (Desktop Only) */}
      <div className="absolute inset-0 hidden md:block">
        <Image
          src="/images/OctaveBanner.png" // Replace with your banner image
          alt="Background Overlay"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover blur-md opacity-50"
        />
      </div>

      <div className="relative flex flex-col items-center justify-center space-y-8 z-10">
        {/* Loading Circle */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-white rounded-full animate-spin-slow" />
        </div>

        {/* Mobile-Only Banner */}
        <div className="relative w-64 h-32 md:hidden">
          <Image
            src="/images/OctaveBanner.png"
            alt="Octave"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain animate-bounce-slow"
          />
        </div>


        {/* Made with love text */}
        <div className="flex items-center space-x-2 text-gray-400">
          <span>Made with</span>
          <svg
            className="w-5 h-5 text-red-500 animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span>by Octave</span>
        </div>
      </div>
    </div>
  );
}
