/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/mobile/SettingsMenu.tsx
import React from "react";
import { Cog, Download, LogOut } from "lucide-react";

type SettingsMenuProps = {
  showSettingsMenu: boolean;
  setShowSettingsMenu: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;
  setView: (view: string) => void;
  setShowPwaModal: (value: boolean) => void;
};

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  showSettingsMenu,
  setShowSettingsMenu,
  setView,
  setShowPwaModal,
}) => {
  if (!showSettingsMenu) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl z-10 border border-gray-700">
      <button
        className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
         transition-colors duration-200 group rounded-t-lg"
        onClick={() => {
          setView("settings");
          setShowSettingsMenu(false);
        }}
      >
        <Cog className="w-5 h-5 mr-3" />
        Settings
      </button>
      <button
        className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-[#1a237e] w-full text-left
           transition-colors duration-200 group" // removed rounded-t-lg if not the first one
        onClick={() => {
          setShowSettingsMenu(false);
          const dp = (window as any).deferredPrompt;
          if (dp) {
            dp.prompt();
            void dp.userChoice.then(() => {
              (window as any).deferredPrompt = undefined;
            });
          } else {
            setShowPwaModal(true);
          }
        }}
      >
        <Download className="w-4 h-4 mr-3 text-[#90caf9] group-hover:text-white" />
        Install App
      </button>
      <button
        className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 w-full text-left
          rounded-b-lg"
        onClick={() => setShowSettingsMenu(false)}
      >
        <LogOut className="w-4 h-4 mr-3 text-white" />
        Log Out
      </button>
    </div>
  );
};

export default SettingsMenu;