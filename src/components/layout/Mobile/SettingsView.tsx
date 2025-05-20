/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/mobile/SettingsView.tsx
import React from "react";
import {
  User,
  ChevronRight,
  Music,
  Volume2,
  Check,
  Wifi,
  Shield,
  Bell,
  Beaker,
} from "lucide-react";
import { AudioQuality } from "./types"; // Adjust path as needed

type SettingsViewProps = {
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (quality: AudioQuality) => void; // This prop will be connected to the complex setter in MobileLayout
  storeSetting: (key: string, value: any) => Promise<void>; // Used for "musicQuality"
};

const SettingsView: React.FC<SettingsViewProps> = ({
  volume,
  onVolumeChange,
  audioQuality,
  setAudioQuality,
  storeSetting,
}) => {
  return (
    <section
      className="w-full min-h-screen overflow-y-auto px-4 py-6"
      style={{ paddingBottom: "15rem" }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <div className="inline-flex items-center space-x-2 bg-purple-600/10 text-purple-400 px-3 py-1.5 rounded-full">
          <User className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Pro Account</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account Section */}
        <button className="w-full bg-gray-800/40 active:bg-gray-800/60 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div className="ml-3 flex-1 text-left">
              <h3 className="text-lg font-semibold text-white">Account</h3>
              <p className="text-sm text-gray-400">Manage account settings</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        {/* Playback Section */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg">
              <Music className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-white">Playback</h3>
              <p className="text-sm text-gray-400">Audio settings</p>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Volume</span>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Audio Quality */}
          <div>
            <span className="text-sm text-gray-300 block mb-2">
              Audio Quality
            </span>
            <div className="grid grid-cols-2 gap-2">
              {["MAX", "HIGH", "NORMAL", "DATA_SAVER"].map((quality) => (
                <button
                  key={quality}
                  onClick={() => {
                    setAudioQuality(quality as AudioQuality); // Calls the prop passed from MobileLayout
                    void storeSetting("musicQuality", quality as AudioQuality); // Specifically stores "musicQuality"
                  }}
                  className={`relative p-2.5 rounded-lg border transition-colors ${
                    audioQuality === quality
                      ? "border-purple-500 bg-purple-500/10 text-white"
                      : "border-gray-700 bg-gray-800/40 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {quality.replace("_", " ")}
                  </span>
                  {audioQuality === quality && (
                    <Check className="absolute top-1 right-1 w-3 h-3 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Saver Toggle */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-white">Data Saver</h3>
                <p className="text-sm text-gray-400">
                  Currently: {audioQuality}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              icon: Shield,
              title: "Privacy",
              desc: "Privacy settings",
              color: "rose",
            },
            {
              icon: Bell,
              title: "Notifications",
              desc: "Notification preferences",
              color: "orange",
            },
            {
              icon: Beaker,
              title: "Beta Features",
              desc: "Try new features",
              color: "emerald",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <button
              key={title}
              className="w-full bg-gray-800/40 active:bg-gray-800/60 rounded-lg p-4 text-left"
            >
              <div
                className={`p-2.5 bg-${color}-500/10 text-${color}-400 rounded-lg w-fit mb-2`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SettingsView;