// useIsMobile.ts
import { useMediaQuery } from 'react-responsive';
import { useEffect, useState } from 'react';

/**
 * Because we can't run `window.matchMedia` on the server,
 * we disable SSR for this file by importing it dynamically in our page.
 */
export function useIsMobile() {
  const [isClient, setIsClient] = useState(false);

  // Force this to run only in the browser:
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only call useMediaQuery if we are on the client
  // to avoid SSR mismatch issues:
  const isNarrowScreen = useMediaQuery({ maxWidth: 768 });

  // If we're not yet on the client, default to some safe assumption (e.g., 'desktop')
  return isClient ? isNarrowScreen : false;
}
