import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Expand, Shrink } from "lucide-preact";
import geaMarkerLogo from "../assets/images/site/logo/gea-brand-master.png";
import { withBase } from "../utils/base.js";

const CLUSTER_DISTANCE = 52;
const CLUSTER_MAX_ZOOM = 17;
const geaMarkerLogoUrl = geaMarkerLogo.src;

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
  const compactStats = [
    Number(item.km) > 0 ? `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(item.km)} km` : "",
    Number(item.dislivello) > 0 ? `${new Intl.NumberFormat("it-IT").format(item.dislivello)} m D+` : "",
    hasGea(item) ? "Con Gea" : ""
  ].filter(Boolean);

  return `
    <strong>${escapeHtml(item.titolo)}</strong><br/>
    ${escapeHtml(item.luogo)}<br/>
    ${compactStats.length ? `<span>${escapeHtml(compactStats.join(" · "))}</span><br/>` : ""}
    <a href="${detailUrl}">Apri il racconto</a><br/>
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

function createStandardMarkerIcon(L) {
  return L.divIcon({
    className: "popi-map-marker popi-map-marker--standard",
    html: `
      <span style="position:relative;display:block;width:44px;height:54px;">
        <span style="position:absolute;left:50%;bottom:1px;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:16px solid #E66A4E;filter:drop-shadow(0 7px 10px color-mix(in srgb, #25251F 18%, transparent));"></span>
        <span style="position:relative;display:flex;width:42px;height:42px;align-items:center;justify-content:center;border:3px solid #FFFDF7;border-radius:9999px;background:#E66A4E;box-shadow:0 8px 18px color-mix(in srgb, #25251F 18%, transparent);">
          <span style="display:block;width:14px;height:14px;border-radius:9999px;background:#FFFDF7;"></span>
        </span>
      </span>
    `,
    iconSize: [44, 54],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48]
  });
}

function createGeaMarkerIcon(L) {
  return L.divIcon({
    className: "popi-map-marker popi-map-marker--gea",
    html: `
      <span style="position:relative;display:block;width:48px;height:58px;">
        <span style="position:absolute;left:50%;bottom:1px;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:17px solid #3F6B4F;filter:drop-shadow(0 8px 12px color-mix(in srgb, #25251F 20%, transparent));"></span>
        <span style="position:relative;display:flex;width:46px;height:46px;align-items:center;justify-content:center;border:3px solid #FFFDF7;border-radius:9999px;background:#3F6B4F;box-shadow:0 10px 20px color-mix(in srgb, #25251F 20%, transparent);">
          <span style="display:flex;width:34px;height:34px;align-items:center;justify-content:center;border-radius:9999px;background:#FFFDF7;overflow:hidden;">
            <img src="${geaMarkerLogoUrl}" alt="" style="display:block;width:32px;height:32px;object-fit:contain;" />
          </span>
        </span>
      </span>
    `,
    iconSize: [48, 58],
    iconAnchor: [24, 56],
    popupAnchor: [0, -52]
  });
}

function createClusterIcon(L, count) {
  return L.divIcon({
    className: "escursioni-cluster-marker",
    html: `
      <span style="display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:9999px;border:3px solid #FFFDF7;background:#3F6B4F;box-shadow:0 12px 24px color-mix(in srgb, #25251F 22%, transparent);color:#FFFDF7;font-weight:700;font-size:0.875rem;line-height:1;font-variant-numeric:tabular-nums;">
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

function renderMarkers({ L, map, layer, points, standardMarkerIcon, geaMarkerIcon }) {
  layer.clearLayers();

  function applyAccessibleLabel(marker, label) {
    const element = marker.getElement();
    if (!element) return;
    element.setAttribute("aria-label", label);
    element.setAttribute("title", label);
  }

  buildClusters(map, points).forEach((cluster) => {
    if (cluster.items.length === 1) {
      const [item] = cluster.items;
      const markerLabel = `Apri ${item.titolo}, ${item.luogo}`;
      const marker = L.marker([item.lat, item.lng], {
        icon: hasGea(item) ? geaMarkerIcon : standardMarkerIcon,
        title: markerLabel,
        alt: markerLabel,
        keyboard: true
      });
      marker.bindPopup(createPopupContent(item));
      layer.addLayer(marker);
      applyAccessibleLabel(marker, markerLabel);
      return;
    }

    const clusterLabel = `${cluster.items.length} escursioni in quest'area`;
    const clusterMarker = L.marker([cluster.lat, cluster.lng], {
      icon: createClusterIcon(L, cluster.items.length),
      title: clusterLabel,
      alt: clusterLabel,
      keyboard: true
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

    clusterMarker.bindTooltip(clusterLabel, {
      direction: "top",
      offset: [0, -18]
    });

    layer.addLayer(clusterMarker);
    applyAccessibleLabel(clusterMarker, clusterLabel);
  });
}

function fitMapToPoints(map, items, padding = 40) {
  if (!map || !items.length) return;

  const bounds = items.map((item) => [item.lat, item.lng]);
  if (bounds.length === 1) {
    map.setView(bounds[0], 11);
    return;
  }

  map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 11 });
}

export default function Mappa({
  escursioni = [],
  height = "420px",
  eyebrow = "Mappa delle escursioni",
  title = "In giro per il mondo",
  selectedArea = "",
  showHeader = true,
  variant = "default"
}) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markerLayerRef = useRef(null);
  const redrawMarkersRef = useRef(null);
  const viewStateRef = useRef(null);
  const sectionRef = useRef(null);
  const fullscreenCloseRef = useRef(null);
  const fullscreenTriggerRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const points = escursioni.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const hasCoordinates = points.length > 0;
  const normalizedArea = String(selectedArea || "").trim().toLocaleLowerCase("it");
  const focusedPoints = normalizedArea
    ? points.filter((item) => String(item.provincia || "").trim().toLocaleLowerCase("it") === normalizedArea)
    : points;

  useEffect(() => {
    let cancelled = false;
    let redrawMarkers = null;

    async function initMap() {
      if (!mapElement.current || !points.length) return;

      try {
        setLoadError("");
        setIsLoading(true);
        const L = (await import("leaflet")).default;
        if (cancelled || mapInstance.current) return;

        const standardMarkerIcon = createStandardMarkerIcon(L);
        const geaMarkerIcon = createGeaMarkerIcon(L);
        const map = L.map(mapElement.current, { scrollWheelZoom: isFullscreen });
        const markerLayer = L.layerGroup().addTo(map);

        mapInstance.current = map;
        markerLayerRef.current = markerLayer;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        redrawMarkers = () => renderMarkers({ L, map, layer: markerLayer, points, standardMarkerIcon, geaMarkerIcon });
        redrawMarkersRef.current = redrawMarkers;
        map.on("zoomend moveend", redrawMarkers);

        if (normalizedArea && focusedPoints.length) {
          fitMapToPoints(map, focusedPoints);
        } else if (viewStateRef.current) {
          map.setView(viewStateRef.current.center, viewStateRef.current.zoom);
        } else {
          fitMapToPoints(map, points);
        }

        redrawMarkers();
        requestAnimationFrame(() => map.invalidateSize());
        setTimeout(() => map.invalidateSize(), 250);
        setIsLoading(false);
      } catch (error) {
        if (!cancelled) {
          setIsLoading(false);
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
  }, [escursioni, isFullscreen, retryNonce]);

  useEffect(() => {
    if (!mapInstance.current || !focusedPoints.length) return;
    fitMapToPoints(mapInstance.current, focusedPoints, 56);
  }, [selectedArea]);

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
    if (!isFullscreen || typeof document === "undefined") return undefined;

    const dialog = sectionRef.current;
    if (!dialog) return undefined;

    const inertElements = new Map();
    let current = dialog;

    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;

      Array.from(parent.children).forEach((sibling) => {
        if (!(sibling instanceof HTMLElement) || sibling === current || inertElements.has(sibling)) return;

        inertElements.set(sibling, {
          inert: sibling.inert,
          ariaHidden: sibling.getAttribute("aria-hidden")
        });
        sibling.inert = true;
        sibling.setAttribute("aria-hidden", "true");
      });

      current = parent;
    }

    const focusFrame = requestAnimationFrame(() => fullscreenCloseRef.current?.focus());

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsFullscreen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element instanceof HTMLElement && element.getAttribute("aria-hidden") !== "true");

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);

      inertElements.forEach((previous, element) => {
        element.inert = previous.inert;
        if (previous.ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", previous.ariaHidden);
      });

      requestAnimationFrame(() => fullscreenTriggerRef.current?.focus());
    };
  }, [isFullscreen]);

  function openFullscreen() {
    setIsFullscreen(true);
  }

  const isJournal = variant === "journal";
  const sectionClass = isFullscreen
    ? "fixed inset-0 z-[1300] bg-[#173328]/92 p-3 backdrop-blur-sm sm:p-5"
    : isJournal
      ? ""
      : "mb-6 sm:mb-8";
  const frameClass = isFullscreen
    ? "relative h-full"
    : isJournal
      ? "relative"
      : "rounded-[2rem] border border-forest-950 bg-[#173328] p-3 shadow-card sm:p-4";
  const mapWrapperClass = isFullscreen ? "relative h-full min-h-0" : "relative";
  const mapHeight = isFullscreen ? "100%" : height;
  const mapMinHeight = isFullscreen ? "0" : "260px";

  return (
    <section
      ref={sectionRef}
      class={sectionClass}
      role={isFullscreen ? "dialog" : undefined}
      aria-modal={isFullscreen ? "true" : undefined}
      aria-label={isFullscreen ? "Mappa delle escursioni a schermo intero" : title}
      tabIndex={isFullscreen ? -1 : undefined}
    >
      <div class={frameClass}>
        {isFullscreen ? (
          <button
            ref={fullscreenCloseRef}
            type="button"
            onClick={() => setIsFullscreen(false)}
            aria-label="Chiudi mappa a schermo intero"
            class="absolute right-5 top-5 z-[1200] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#173328]/72 text-white shadow-lg backdrop-blur-sm transition hover:bg-[#173328]/84 focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <Shrink size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : showHeader ? (
          <div class="px-3 pb-4 pt-2 sm:px-4 sm:pb-5">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-100/90">{eyebrow}</p>
              <button
                ref={fullscreenTriggerRef}
                type="button"
                onClick={openFullscreen}
                aria-label="Apri mappa a schermo intero"
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <Expand size={18} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <h1 class="mt-2 max-w-[12ch] text-balance font-sans text-[length:var(--type-tool-page-title)] font-bold leading-[var(--type-leading-tool-page-title)] tracking-[var(--type-tracking-ui-title)] text-white">{title}</h1>
          </div>
        ) : (
          <button
            ref={fullscreenTriggerRef}
            type="button"
            onClick={openFullscreen}
            aria-label="Apri mappa a schermo intero"
            class="absolute right-5 top-5 z-[1200] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDD7C9] bg-[#FFFDF7] text-[#3F6B4F] shadow-[0_8px_24px_rgba(37,37,31,0.08)] transition-colors hover:bg-[#F7F1E3] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2 motion-reduce:transition-none"
          >
            <Expand size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        <div class={mapWrapperClass}>
          {!hasCoordinates ? (
            <div class="flex h-full min-h-[260px] w-full min-w-0 items-center justify-center rounded-[1.75rem] border border-dashed border-forest-300 bg-white/70 p-6 text-center text-sm text-forest-700 sm:min-h-[320px]">
              {isJournal ? "Nessuna escursione è ancora visibile sulla mappa." : "Nessuna coordinata disponibile."}
            </div>
          ) : loadError ? (
            <div class={`flex h-full min-h-[260px] w-full min-w-0 flex-col items-center justify-center gap-4 rounded-[14px] border border-dashed p-6 text-center text-sm sm:min-h-[320px] ${
              isJournal ? "border-[#DDD7C9] bg-[#FFFDF7] text-[#25251F]" : "border-cream/30 bg-white/10 text-cream"
            }`}>
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError("");
                  setIsLoading(true);
                  setRetryNonce((value) => value + 1);
                }}
                class="min-h-11 rounded-[10px] bg-[#3F6B4F] px-4 py-2 font-bold text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2"
              >
                Riprova
              </button>
            </div>
          ) : (
            <>
              <div
                key={isFullscreen ? "map-fullscreen" : "map-inline"}
                ref={mapElement}
                class={`leaflet-host h-full w-full min-w-0 max-w-full overflow-hidden ${
                  isFullscreen
                    ? "rounded-[1.5rem]"
                    : isJournal
                      ? "leaflet-host--journal rounded-[14px] border border-[#DDD7C9]"
                      : "rounded-[1.75rem] border border-white/70 shadow-card"
                }`}
                style={{ height: mapHeight, minHeight: mapMinHeight }}
              />
              {isLoading && (
                <div class={`pointer-events-none absolute flex items-center justify-center rounded-[14px] bg-[#FFFDF7]/90 text-sm font-bold text-[#3F6B4F] ${isJournal ? "inset-0" : "inset-2"}`} role="status">
                  Sto aprendo la mappa…
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
