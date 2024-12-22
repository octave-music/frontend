'use client';

import React from 'react';
import { Music } from 'lucide-react';

interface OnboardingStep1Props {
  onComplete: () => void;
}

export default function OnboardingStep1({ onComplete }: OnboardingStep1Props) {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-bl from-[#1e1e2f] via-[#282843] to-[#0d0d14] text-white">
      <div className="relative text-center p-8 bg-gradient-to-br from-black/50 to-black/70 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-tr from-purple-600 via-pink-500 to-blue-500 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-800 opacity-20 blur-3xl" />

        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-full p-4 shadow-md">
            <Music className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-blue-400">
          Welcome to Octave
        </h1>

        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Your gateway to a world of music tailored just for you. Let’s craft your ultimate
          soundtrack together.
        </p>

        <button
          onClick={onComplete}
          className="px-10 py-4 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white rounded-full shadow-xl transform transition-transform hover:translate-y-[-2px] focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50"
        >
          Get Started
        </button>

        <div className="mt-10 flex items-center justify-center space-x-2">
          <div className="h-[2px] w-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
          <p className="text-sm text-gray-400">A personalized music experience awaits</p>
          <div className="h-[2px] w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
      </div>
    </div>
  );
}
