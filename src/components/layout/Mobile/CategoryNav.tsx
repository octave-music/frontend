// src/components/mobile/CategoryNav.tsx
import React from "react";

// This component currently takes no props, if it needs any in the future, add them here.
// type CategoryNavProps = {};

const CategoryNav: React.FC = () => {
  const categories = [
    // "Music",
    "Coming Soon!"
    // "Podcasts & Shows",
    // "Audiobooks",
    // "Live",
    // "New Releases",
  ];

  return (
    <nav className="px-4 mb-4 relative">
      <div className="overflow-x-auto no-scrollbar">
        <ul className="flex whitespace-nowrap gap-2 pb-2">
          {categories.map((category) => (
            <li key={category}>
              <button className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 min-w-max">
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;