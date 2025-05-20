// src/components/layout/Desktop/SettingsView.tsx
import React from "react";
import { cn } from "@/lib/utils/utils";
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
import type { AudioQuality } from "./types";

interface SettingsViewProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  audioQuality: AudioQuality;
  setAudioQuality: (q: AudioQuality) => void;
  // using `unknown` here avoids the no-explicit-any rule
  storeSetting: (key: string, value: unknown) => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  volume,
  onVolumeChange,
  audioQuality,
  setAudioQuality,
  storeSetting,
}) => {
  return (
    <section className="max-w-4xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <div className="flex items-center space-x-2 bg-purple-600/10 text-purple-400 px-4 py-2 rounded-full">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Pro Account</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-6 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Account
                </h3>
                <p className="text-gray-400">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Playback */}
        <div className="bg-gray-800/40 rounded-xl p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Playback
              </h3>
              <p className="text-gray-400">
                Customize your listening experience
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Default Volume */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Default Volume
                </label>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
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
                className={cn(
                  "w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full",
                  "[&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-purple-400 [&::-webkit-slider-thumb]:transition-colors"
                )}
              />
            </div>

            {/* Audio Quality */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                Audio Quality
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["MAX", "HIGH", "NORMAL", "DATA_SAVER"] as AudioQuality[]).map(
                  (quality) => (
                    <button
                      key={quality}
                      onClick={() => {
                        void storeSetting("musicQuality", quality);
                        setAudioQuality(quality);
                      }}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all duration-200",
                        audioQuality === quality
                          ? "border-purple-500 bg-purple-500/10 text-white"
                          : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                      )}
                    >
                      <span className="text-sm font-medium">
                        {quality.replace("_", " ")}
                      </span>
                      {audioQuality === quality && (
                        <div className="absolute top-1 right-1">
                          <Check className="w-3 h-3 text-purple-400" />
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Saver */}
        <div className="bg-gray-800/40 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Data Saver
                </h3>
                <p className="text-gray-400">
                  Currently set to: {audioQuality}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div
                className={cn(
                  "w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4",
                  "peer-focus:ring-purple-500/25 rounded-full peer",
                  "peer-checked:after:translate-x-full peer-checked:after:border-white",
                  "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full",
                  "after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"
                )}
              />
            </label>
          </div>
        </div>

        {/* Extra Setting Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, title: "Privacy", desc: "Control your privacy settings", color: "rose" },
            { icon: Bell, title: "Notifications", desc: "Set notification preferences", color: "orange" },
            { icon: Beaker, title: "Beta Features", desc: "Try experimental features", color: "emerald" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-6 transition-all duration-200 cursor-pointer"
            >
              <div
                className={`p-3 bg-${color}-500/10 text-${color}-400 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SettingsView;
