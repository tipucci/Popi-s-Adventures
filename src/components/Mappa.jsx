import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Expand, Shrink } from "lucide-preact";
import { withBase } from "../utils/base.js";

const markerIconRetinaUrl = withBase("/leaflet/marker-icon-2x.png");
const markerIconUrl = withBase("/leaflet/marker-icon.png");
const markerShadowUrl = withBase("/leaflet/marker-shadow.png");
const geaMarkerLogoUrl = withBase("/icons/popi-192.png");
const CLUSTER_DISTANCE = 52;
const CLUSTER_MAX_ZOOM = 17;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDirectionsUrl(item) {
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.luogo || item.titolo || "")}`;
}

function createPopupContent(item) {
  const detailUrl = withBase(`/escursioni/${item.slug}`);
  const directionsUrl = getDirectionsUrl(item);

  return `
    <strong>${escapeHtml(item.titolo)}</strong><br/>
    ${escapeHtml(item.luogo)}<br/>
    <a href="${detailUrl}">Apri dettaglio</a><br/>
    <a href="${directionsUrl}" target="_blank" rel="noreferrer noopener">Indicazioni stradali</a>
  `;
}

function hasGea(item) {
  if (item?.cane || item?.gea || item?.con_gea) return true;

  const partecipanti = Array.isArray(item?.partecipanti)
    ? item.partecipanti
    : String(item?.partecipanti || "").split(/[|,;]/);

  return partecipanti.some((participant) => String(participant).trim().toLowerCase() === "gea");
}

function createGeaMarkerIcon(L) {
  return L.divIcon({
    className: "gea-map-marker",
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:52px;height:62px;">
        <span style="position:absolute;left:50%;bottom:1px;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:17px solid #ffffff;filter:drop-shadow(0 8px 10px rgba(23,51,40,.28));"></span>
        <span style="position:relative;display:block;width:46px;height:46px;overflow:hidden;border:3px solid #fff;border-radius:9999px;background:#F5EBDC;box-shadow:0 10px 20px rgba(23,51,40,.28);">
          <img src="${geaMarkerLogoUrl}" alt="" style="display:block;width:78%;height:78%;margin:11% auto;object-fit:contain;" />
        </span>
      </span>
    `,
    iconSize: [52, 62],
    iconAnchor: [26, 60],
    popupAnchor: [0, -56]
  });
}

function createClusterIcon(L, count) {
  return L.divIcon({
    className: "escursioni-cluster-marker",
    html: `
      <span style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:9999px;border:3px solid #ffffff;background:#315334;box-shadow:0 12px 24px rgba(23,51,40,.30);color:#fffaf3;font-weight:800;font-size:15px;line-height:1;">
        ${count}
      </span>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
}

function areSameCoordinates(items) {
  if (items.length <= 1) return true;

  const [{ lat, lng }] = items;
  return items.every((item) => item.lat === lat && item.lng === lng);
}

function buildClusters(map, points) {
  const zoom = map.getZoom();
  const clusters = [];

  points.forEach((item) => {
    const projected = map.project([item.lat, item.lng], zoom);
    let nearestCluster = null;
    let nearestDistance = Infinity;

    clusters.forEach((cluster) => {
      const dx = cluster.projected.x - projected.x;
      const dy = cluster.projected.y - projected.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= CLUSTER_DISTANCE && distance < nearestDistance) {
        nearestCluster = cluster;
        nearestDistance = distance;
      }
    });

    if (!nearestCluster) {
      clusters.push({
        items: [item],
        projected: { x: projected.x, y: projected.y }
      });
      return;
    }

    nearestCluster.items.push(item);
    const total = nearestCluster.items.length;
    nearestCluster.projected = {
      x: (nearestCluster.projected.x * (total - 1) + projected.x) / total,
      y: (nearestCluster.projected.y * (total - 1) + projected.y) / total
    };
  });

  return clusters.map((cluster) => {
    const total = cluster.items.length;
    const lat = cluster.items.reduce((sum, item) => sum + item.lat, 0) / total;
    const lng = cluster.items.reduce((sum, item) => sum + item.lng, 0) / total;

    return { ...cluster, lat, lng };
  });
}

function renderMarkers({ L, map, layer, points, geaMarkerIcon }) {
  layer.clearLayers();

  buildClusters(map, points).forEach((cluster) => {
    if (cluster.items.length === 1) {
      const [item] = cluster.items;
      const marker = L.marker([item.lat, item.lng], hasGea(item) ? { icon: geaMarkerIcon } : undefined);
      marker.bindPopup(createPopupContent(item));
      layer.addLayer(marker);
      return;
    }

    const clusterMarker = L.marker([cluster.lat, cluster.lng], {
      icon: createClusterIcon(L, cluster.items.length)
    });

    clusterMarker.on("click", () => {
      if (areSameCoordinates(cluster.items)) {
        const [item] = cluster.items;
        map.setView([item.lat, item.lng], Math.min(map.getZoom() + 2, CLUSTER_MAX_ZOOM));
        return;
      }

      map.fitBounds(
        cluster.items.map((item) => [item.lat, item.lng]),
        {
          padding: [60, 60],
          maxZoom: CLUSTER_MAX_ZOOM
        }
      );
    });

    clusterMarker.bindTooltip(`${cluster.items.length} escursioni`, {
      direction: "top",
      offset: [0, -18]
    });

    layer.addLayer(clusterMarker);
  });
}

export default function Mappa({
  escursioni = [],
  height = "420px",
  eyebrow = "Mappa delle escursioni",
  title = "In giro per il mondo"
}) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerLayerRef = useRef(null);
  const redrawMarkersRef = useRef(null);
  const viewStateRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const points = escursioni.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const hasCoordinates = points.length > 0;

  useEffect(() => {
    let cancelled = false;
    let redrawMarkers = null;

    async function initMap() {
      if (!mapElement.current || !points.length) return;

      try {
        setLoadError("");
        const L = (await import("leaflet")).default;
        if (cancelled || mapInstance.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIconRetinaUrl,
          iconUrl: markerIconUrl,
          shadowUrl: markerShadowUrl
        });

        const geaMarkerIcon = createGeaMarkerIcon(L);
        const map = L.map(mapElement.current, { scrollWheelZoom: isFullscreen });
        const markerLayer = L.layerGroup().addTo(map);

        mapInstance.current = map;
        markerLayerRef.current = markerLayer;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        redrawMarkers = () => renderMarkers({ L, map, layer: markerLayer, points, geaMarkerIcon });
        redrawMarkersRef.current = redrawMarkers;
        map.on("zoomend moveend", redrawMarkers);

        if (viewStateRef.current) {
          map.setView(viewStateRef.current.center, viewStateRef.current.zoom);
        } else {
          const bounds = points.map((item) => [item.lat, item.lng]);
          if (bounds.length === 1) map.setView(bounds[0], 11);
          else map.fitBounds(bounds, { padding: [40, 40] });
        }

        redrawMarkers();
        requestAnimationFrame(() => map.invalidateSize());
        setTimeout(() => map.invalidateSize(), 250);
      } catch (error) {
        if (!cancelled) {
          setLoadError("La mappa non è riuscita a caricarsi correttamente.");
          console.error("[mappa] Errore nel caricamento della mappa", error);
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;

      if (mapInstance.current) {
        viewStateRef.current = {
          center: mapInstance.current.getCenter(),
          zoom: mapInstance.current.getZoom()
        };
      }

      if (mapInstance.current && redrawMarkers) {
        mapInstance.current.off("zoomend moveend", redrawMarkers);
      }

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      markerLayerRef.current = null;
      redrawMarkersRef.current = null;
    };
  }, [escursioni, isFullscreen]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    document.body.classList.toggle("map-fullscreen", isFullscreen);
    document.body.style.overflow = isFullscreen ? "hidden" : "";

    return () => {
      document.body.classList.remove("map-fullscreen");
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen || typeof window === "undefined") return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsFullscreen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const sectionClass = isFullscreen
    ? "fixed inset-0 z-[1300] bg-[#173328]/92 p-3 backdrop-blur-sm sm:p-5"
    : "";
  const frameClass = isFullscreen
    ? "relative h-full"
    : "rounded-[2rem] border border-forest-950 bg-[#173328] p-3 shadow-card sm:p-4";
  const mapWrapperClass = isFullscreen ? "h-full min-h-0" : "";
  const mapHeight = isFullscreen ? "100%" : height;
  const mapMinHeight = isFullscreen ? "0" : "260px";

  return (
    <section class={sectionClass}>
      <div class={frameClass}>
        {isFullscreen ? (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            aria-label="Chiudi mappa a schermo intero"
            class="absolute right-5 top-5 z-[1200] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#173328]/72 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#173328]/84 focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <Shrink size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : (
          <div class="px-3 pb-4 pt-2 sm:px-4 sm:pb-5">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-100/90">{eyebrow}</p>
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                aria-label="Apri mappa a schermo intero"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <Expand size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <h1 class="mt-2 font-display text-4xl text-white sm:text-5xl">{title}</h1>
          </div>
        )}

        <div class={mapWrapperClass}>
          {!hasCoordinates ? (
            <div class="flex h-full min-h-[260px] w-full min-w-0 items-center justify-center rounded-[1.75rem] border border-dashed border-forest-300 bg-white/70 p-6 text-center text-sm text-forest-700 sm:min-h-[320px]">
              Nessuna coordinata disponibile. Aggiungi `lat` e `lng` al foglio Google per vedere la mappa.
            </div>
          ) : loadError ? (
            <div class="flex h-full min-h-[260px] w-full min-w-0 items-center justify-center rounded-[1.75rem] border border-dashed border-cream/30 bg-white/10 p-6 text-center text-sm text-cream sm:min-h-[320px]">
              {loadError}
            </div>
          ) : (
            <div
              key={isFullscreen ? "map-fullscreen" : "map-inline"}
              ref={mapElement}
              class={`leaflet-host h-full w-full min-w-0 max-w-full overflow-hidden shadow-card ${
                isFullscreen ? "rounded-[1.5rem]" : "rounded-[1.75rem] border border-white/70"
              }`}
              style={{ height: mapHeight, minHeight: mapMinHeight }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
