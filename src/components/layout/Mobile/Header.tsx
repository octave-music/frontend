/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/mobile/Header.tsx
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"; // Adjust path as needed
import SettingsMenu from "./SettingsMenu";
import PwaModal from "./PwaModal";

type HeaderProps = {
  greeting: string;
  showSettingsMenu: boolean;
  setShowSettingsMenu: (
    value: boolean | ((prev: boolean) => boolean)
  ) => void;
  showPwaModal: boolean;
  setShowPwaModal: (value: boolean) => void;
  setView: (view: string) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
};

const Header: React.FC<HeaderProps> = ({
  greeting,
  showSettingsMenu,
  setShowSettingsMenu,
  showPwaModal,
  setShowPwaModal,
  setView,
  storeSetting,
}) => (
  <header className="p-4 flex justify-between items-center">
    <h1 className="text-xl md:text-2xl font-semibold">{greeting}</h1>
    <div className="flex space-x-4">
      <div className="relative">
        <button
          className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
          onClick={() => setShowSettingsMenu((p) => !p)}
        >
          <Avatar className="w-full h-full">
            <AvatarImage
              src="https://i.pinimg.com/236x/fb/7a/17/fb7a17e227af3cf2e63c756120842209.jpg"
              alt="User Avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </button>
        <SettingsMenu
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          setView={setView}
          setShowPwaModal={setShowPwaModal}
        />
        <PwaModal
          showPwaModal={showPwaModal}
          setShowPwaModal={setShowPwaModal}
          storeSetting={storeSetting}
        />
      </div>
    </div>
  </header>
);

export default Header;