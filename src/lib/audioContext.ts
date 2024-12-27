// Extend the global Window interface to include globalAudioContext
declare global {
  interface Window {
    globalAudioContext?: AudioContext;
  }
}

// Encapsulate logic in a function for better modularity and reusability
const initializeAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    console.warn("AudioContext is not available in this environment.");
    return null;
  }

  try {
    // Check if a global AudioContext already exists, otherwise create one
    if (!window.globalAudioContext) {
      window.globalAudioContext = new AudioContext();
    }
    return window.globalAudioContext;
  } catch (error) {
    console.error("Failed to initialize AudioContext:", error);
    return null;
  }
  
};



// Lazily initialize the AudioContext
const audioContext: AudioContext | null = initializeAudioContext();

export default audioContext;