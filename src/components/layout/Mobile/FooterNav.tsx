// src/components/mobile/FooterNav.tsx
import React, { useState, useEffect } from 'react';
import { Home, Search, Library, Cog } from 'lucide-react';

type FooterNavProps = {
  isPlayerOpen: boolean;
  view: string; // To highlight active tab
  setView: (view: string) => void;
  setIsSearchOpen: (value: boolean) => void;
  // setSearchQuery is not directly used by FooterNav to set, but for clearing perhaps if needed via setView logic
};

const FooterNav: React.FC<FooterNavProps> = ({ 
  isPlayerOpen, 
  view,
  setView, 
  setIsSearchOpen 
}) => {
  const [isMobileSmall, setIsMobileSmall] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileSmall(window.innerWidth <= 375); 
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isPlayerOpen) return null;

  const navItems = [
    { icon: Home, label: "Home", viewName: "home" },
    { icon: Search, label: "Search", viewName: "search" },
    { icon: Library, label: "Library", viewName: "library" },
    { icon: Cog, label: "Settings", viewName: "settings" }, // Corrected label
  ];

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800"
      style={{
        background: "rgba(10, 10, 10, 0.85)", // Slightly darker, less transparent
        backdropFilter: "blur(12px)", // Stronger blur
      }}
    >
      <div className="px-2 pb-[env(safe-area-inset-bottom)] pt-1"> {/* Adjusted padding */}
        {/* Removed overflow-x-auto and snap scrolling as typically mobile navs are fixed width items */}
        <div className="flex items-center justify-around min-w-full">
          {navItems.map((item) => (
            <button
              key={item.viewName}
              onClick={() => {
                if (item.viewName === "search") {
                  setIsSearchOpen(true);
                } else {
                  setIsSearchOpen(false); // Close search if navigating elsewhere
                }
                setView(item.viewName);
              }}
              className={`flex flex-col items-center justify-center flex-1 p-2 rounded-md transition-colors duration-200
                ${view === item.viewName ? 'text-purple-400' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <item.icon className="w-5 h-5 mb-0.5" /> {/* Slightly smaller icon */}
              {!isMobileSmall && (
                <span className={`text-[10px] font-medium truncate w-full text-center ${view === item.viewName ? 'text-purple-400' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default FooterNav;