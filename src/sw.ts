/// <reference lib="webworker" />

import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

const CACHE_PREFIX = "popi";
const offlineFallbackUrls = [
  new URL("offline/", self.registration.scope).toString(),
  new URL("offline/index.html", self.registration.scope).toString()
];

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

async function getOfflineFallback() {
  for (const url of offlineFallbackUrls) {
    const response = await matchPrecache(url);
    if (response) return response;
  }

  return Response.error();
}

registerRoute(
  ({ request }) => request.mode === "navigate",
  async (options) => {
    const strategy = new NetworkFirst({
      cacheName: `${CACHE_PREFIX}-pages-v1`,
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    });

    try {
      return (await strategy.handle(options)) || getOfflineFallback();
    } catch {
      return getOfflineFallback();
    }
  }
);

registerRoute(
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.endsWith("/api/escursioni.json"),
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-api-v1`,
    networkTimeoutSeconds: 4,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 60 * 60 * 24
      })
    ]
  })
);

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ["script", "style", "worker"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-assets-v1`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    ["font", "image"].includes(request.destination),
  new CacheFirst({
    cacheName: `${CACHE_PREFIX}-media-v1`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30
      })
    ]
  })
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-google-fonts-styles-v1`
  })
);

registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: `${CACHE_PREFIX}-google-fonts-files-v1`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365
      })
    ]
  })
);

setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate" || request.destination === "document") {
    return getOfflineFallback();
  }

  return Response.error();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
