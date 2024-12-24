// Declare the property on the global Window interface
declare global {
    interface Window {
      globalAudioContext?: AudioContext;
    }
  }
  
  let audioContext: AudioContext | null = null;
  
  if (typeof window !== 'undefined') {
    if (!window.globalAudioContext) {
      window.globalAudioContext = new AudioContext();
    }
    audioContext = window.globalAudioContext;
  }
  
  export default audioContext;
  