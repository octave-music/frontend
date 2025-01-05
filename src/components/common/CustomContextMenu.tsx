// CustomContextMenu.tsx
import React, { useEffect, useRef } from "react";

interface ContextMenuOption {
  label: string;
  action: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Position {
  x: number;
  y: number;
}

interface CustomContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  x,
  y,
  onClose,
  options,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Ensure menu stays within viewport
  const adjustedPosition = {
    x: Math.min(x, window.innerWidth - (menuRef.current?.offsetWidth || 200)),
    y: Math.min(y, window.innerHeight - (menuRef.current?.offsetHeight || 150)),
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-[#1a1a1a] rounded-lg shadow-xl z-[999999] min-w-[200px] max-w-[250px] overflow-hidden border border-gray-700/50"
      style={{
        top: adjustedPosition.y,
        left: adjustedPosition.x,
      }}
    >
      <div className="py-1">
        {options.map((opt, i) => (
          <button
            key={i}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700/50 transition-colors duration-150 ease-in-out focus:outline-none focus:bg-gray-700/70 whitespace-nowrap font-medium"
            onClick={(e) => {
              e.stopPropagation();
              opt.action();
              onClose();
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomContextMenu;