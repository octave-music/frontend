// src/components/player/Mobile/MobileQualityBadge.tsx
import React from "react";
import { motion } from "framer-motion";
import { Crown, Star, Fan, CircleDollarSign, LucideProps } from "lucide-react"; // Assuming LucideProps for SVGProps
import { AudioQuality } from "./types"; // Adjust path

interface MobileQualityBadgeProps {
  quality: AudioQuality;
  onClick?: () => void; // Make onClick optional if sometimes it's just display
}

const MobileQualityBadge: React.FC<MobileQualityBadgeProps> = ({ quality, onClick }) => {
  const icons: Record<AudioQuality, React.FC<LucideProps>> = { // Use LucideProps
    MAX: Crown,
    HIGH: Star,
    NORMAL: Fan,
    DATA_SAVER: CircleDollarSign,
  };

  const qualityDetails: Record<AudioQuality, { color: string; label: string }> = {
    MAX: { color: "bg-gradient-to-r from-yellow-500 to-amber-600", label: "Max" },
    HIGH: { color: "bg-gradient-to-r from-purple-500 to-indigo-600", label: "High" },
    NORMAL: { color: "bg-gradient-to-r from-sky-500 to-blue-600", label: "Normal" },
    DATA_SAVER: { color: "bg-gradient-to-r from-emerald-500 to-green-600", label: "Saver" },
  };

  const IconComponent = icons[quality];
  const details = qualityDetails[quality];

  const content = (
    <>
      <IconComponent className="w-3 h-3" />
      <span>{details.label}</span>
    </>
  );

  if (onClick) {
    return (
      <motion.button
        className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${details.color} text-white inline-flex items-center justify-center space-x-1 shadow-sm`}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div
      className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${details.color} text-white inline-flex items-center justify-center space-x-1 shadow-sm`}
    >
      {content}
    </div>
  );
};

export default MobileQualityBadge;