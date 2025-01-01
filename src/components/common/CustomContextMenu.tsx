// CustomContextMenu.tsx

import React from "react";

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
  return (
    <div
      className="fixed bg-gray-800 rounded-lg shadow-lg p-2 z-[999999]"
      style={{ top: y, left: x }}
      onMouseLeave={onClose}
    >
      {options.map((opt, i) => (
        <button
          key={i}
          className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
          onClick={() => {
            opt.action();
            onClose();
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default CustomContextMenu;
