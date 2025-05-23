// src/components/modals/OnboardingModal.tsx
import React from 'react';
import OnboardingComponent from '@/components/onboarding/Onboarding'; // Assuming this is your existing component
import { Artist } from '@/lib/types/types';
import { API_BASE_URL } from '@/lib/config';

interface OnboardingModalProps {
  show: boolean; // To control the outer fixed div visibility
  onComplete: () => void;
  onArtistSelectionComplete: (artists: Artist[]) => Promise<void>;
  // setRecommendedTracks: React.Dispatch<React.SetStateAction<Track[]>>; // This might be handled by onArtistSelectionComplete now
}

export function OnboardingModal({ 
  show, 
  onComplete, 
  onArtistSelectionComplete,
  // setRecommendedTracks 
}: OnboardingModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black custom-scrollbar overflow-y-auto z-[1000]"> {/* High z-index */}
      <OnboardingComponent
        onComplete={onComplete}
        onArtistSelectionComplete={onArtistSelectionComplete}
        API_BASE_URL={API_BASE_URL}
        // setRecommendedTracks={setRecommendedTracks} // Pass if still needed directly by OnboardingComponent
      />
    </div>
  );
}