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
                    if (confirm("New version available. Refresh to update?")) {
                      window.location.reload();
                      console.log("New version available. Refresh to update.");
                    }
                  } else {
                    console.log("Content is cached for offline use.");
                  }
                }
              };
            };
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error);
          });

        // Add controller change handling
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (document.visibilityState === "visible") {
            window.location.reload();
          }
        });
      });
    }
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
