/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/mobile/PwaModal.tsx
import React from "react";

type PwaModalProps = {
  showPwaModal: boolean;
  setShowPwaModal: (value: boolean) => void;
  storeSetting: (key: string, value: any) => Promise<void>;
};

const PwaModal: React.FC<PwaModalProps> = ({
  showPwaModal,
  setShowPwaModal,
  storeSetting,
}) => {
  if (!showPwaModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999999]
         transition-all duration-300 animate-fadeIn"
    >
      <div
        className="bg-[#0a1929] text-white rounded-xl p-8 w-[90%] max-w-md shadow-2xl 
           border border-[#1e3a5f] animate-slideIn m-4"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-[#90caf9]">
          Install App
        </h2>
        <p className="text-gray-300">
          On desktop, you can install the PWA by clicking the "Install
          App" button in the URL bar if supported, or pressing the
          "Install" button. On Android, tap the three dots in Chrome
          and select "Add to Home screen." On iOS, use Safari's
          share button and select "Add to Home Screen."
        </p>
        <button
          onClick={() => setShowPwaModal(false)}
          className="mt-8 px-6 py-3 bg-[#1a237e] text-white rounded-lg w-full
            transition-all duration-300 hover:bg-[#283593]"
        >
          Close
        </button>
        <div className="mt-4">
          <label className="flex items-center text-sm text-gray-400 space-x-2">
            <input
              type="checkbox"
              onChange={() => {
                void storeSetting("hidePwaPrompt", "true");
                setShowPwaModal(false);
              }}
            />
            <span>Don’t show again</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PwaModal;