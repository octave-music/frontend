// Declare the property on the global Window interface
declare global {
  interface Window {
    globalAudioContext?: AudioContext;
  }
}

let audioContext: AudioContext | null = null;

if (typeof window !== 'undefined') {
  try {
    if (!window.globalAudioContext) {
      // Lazily create the AudioContext
      window.globalAudioContext = new AudioContext();
    }
    audioContext = window.globalAudioContext;
  } catch (error) {
    console.error("Error creating AudioContext:", error);
  }
}

export default audioContext;
