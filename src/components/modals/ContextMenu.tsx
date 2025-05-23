// src/components/modals/ContextMenu.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Portal } from '@radix-ui/react-portal'; // Or your preferred portal solution
import { ContextMenuOption, Position } from '@/lib/types/types';

interface ContextMenuProps {
  show: boolean;
  position: Position;
  options: ContextMenuOption[];
  onClose: () => void;
}

export function ContextMenu({ show, position, options, onClose }: ContextMenuProps) {
  if (!show || !options || options.length === 0) return null;

  // Calculate adjusted position to keep menu within viewport
  // This is a simplified calculation; a more robust one would consider menu height/width
  const menuHeight = options.length * 40 + 16; // Approximate height
  const menuWidth = 230; // Approximate width

  const top = Math.min(position.y, window.innerHeight - menuHeight - 10); // 10px buffer
  const left = Math.min(position.x, window.innerWidth - menuWidth - 10);

  return (
    <Portal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="fixed inset-0 z-[9999] backdrop-blur-sm bg-black/20" // Adjusted backdrop
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.08 }}
          className="absolute min-w-[200px] max-w-[280px] overflow-hidden rounded-lg bg-neutral-800/90 backdrop-blur-lg shadow-2xl border border-neutral-700/60"
          style={{ top: `${top}px`, left: `${left}px` }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking menu itself
        >
          <div className="py-1.5">
            {options.map((option, index) => (
              <motion.button
                key={index}
                className="group relative flex w-full items-center px-3.5 py-2 text-left"
                onClick={() => {
                  option.action();
                  onClose();
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              >
                {option.icon && ( // Assuming icon is a ReactNode e.g. <IconComponent />
                  <span className="mr-2.5 text-neutral-400 group-hover:text-neutral-200 transition-colors">
                    {typeof option.icon === 'function' ? React.createElement(option.icon as React.FC) : option.icon}
                  </span>
                )}
                <span className={`flex-1 text-xs font-medium ${option.danger ? 'text-red-400 group-hover:text-red-300' : 'text-neutral-200 group-hover:text-white'} transition-colors`}>
                  {option.label}
                </span>
                {option.shortcut && (
                  <span className="ml-auto text-[10px] text-neutral-500 group-hover:text-neutral-400 transition-colors">
                    {option.shortcut}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </Portal>
  );
}