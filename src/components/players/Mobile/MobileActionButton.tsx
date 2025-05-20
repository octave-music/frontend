// src/components/player/Mobile/MobileActionButton.tsx
import React from "react";
import { motion } from "framer-motion";
import { LucideProps } from "lucide-react"; // Assuming LucideProps for SVGProps

interface MobileActionButtonProps {
  icon: React.FC<LucideProps>; // Use LucideProps
  label: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'normal' | 'small'; // Optional size prop
}

const MobileActionButton: React.FC<MobileActionButtonProps> = ({
  icon: Icon,
  label,
  active,
  onClick,
  size = 'normal',
}) => {
  const buttonSizeClass = size === 'small' ? 'w-10 h-10' : 'w-12 h-12';
  const iconSizeClass = size === 'small' ? 'w-5 h-5' : 'w-6 h-6';
  const textSizeClass = size === 'small' ? 'text-[10px]' : 'text-xs';

  return (
    <motion.button
      className="flex flex-col items-center space-y-1 text-center"
      onClick={onClick}
      whileHover={{ scale: 1.05 }} // Hover might not be relevant on mobile but good for consistency
      whileTap={{ scale: 0.95 }}
      disabled={!onClick} // Disable if no onClick provided
    >
      <div
        className={`${buttonSizeClass} rounded-full flex items-center justify-center transition-all duration-200 
                   ${active ? "bg-purple-600/30 text-purple-400" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
      >
        <Icon className={iconSizeClass} />
      </div>
      <span className={`${textSizeClass} text-white/70 mt-0.5`}>{label}</span>
    </motion.button>
  );
};

export default MobileActionButton;