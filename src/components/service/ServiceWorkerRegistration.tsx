// components/ServiceWorkerRegistration.tsx
"use client";

import { useEffect } from "react";

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "Service Worker registered with scope:",
              registration.scope
            );
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker == null) return;

              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    if (confirm("New version available. Refresh to update?")) {
                      window.location.reload();
                    }
                  } else {
                    // Content cached for offline use
                    console.log("Content is cached for offline use.");
                  }
                }
              };
            };
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default ServiceWorkerRegistration;
