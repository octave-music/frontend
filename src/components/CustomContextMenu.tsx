'use client';

import React from 'react';

interface ContextMenuOption {
  label: string;
  action: () => void;
}

interface CustomContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

export default function CustomContextMenu({
  x,
  y,
  onClose,
  options
}: CustomContextMenuProps) {
  return (
    <div
      className="fixed bg-gray-800 rounded-lg shadow-lg p-2 z-50"
      style={{ top: y, left: x }}
      onMouseLeave={onClose}
    >
      {options.map((option, index) => (
        <button
          key={index}
          className="block w-full text-left px-4 py-2 hover:bg-gray-700"
          onClick={() => {
            option.action();
            onClose();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
