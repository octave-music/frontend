// audioManager.ts
declare global {
    interface Window {
      globalAudioElement?: HTMLAudioElement;
    }
  }

    const initializeAudioElement = (): HTMLAudioElement | null => {
    if (typeof window === 'undefined') {
      return null;
    }
  
    try {
      if (!window.globalAudioElement) {
        window.globalAudioElement = new Audio();
        window.globalAudioElement.preload = 'auto';
      }
      return window.globalAudioElement;
    } catch (error) {
      console.error("Failed to initialize Audio element:", error);
      return null;
    }
  };
  
  const audioElement = initializeAudioElement();
  
  export default audioElement;