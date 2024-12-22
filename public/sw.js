self.addEventListener('install', function(_event) {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
  });