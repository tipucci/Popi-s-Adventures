import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { withBase } from "../utils/base.js";

const markerIconRetinaUrl = withBase("/leaflet/marker-icon-2x.png");
const markerIconUrl = withBase("/leaflet/marker-icon.png");
const markerShadowUrl = withBase("/leaflet/marker-shadow.png");
const geaMarkerLogoUrl = withBase("/icons/popi-192.png");

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
      <span style="display:block;width:46px;height:46px;overflow:hidden;border:3px solid #fff;border-radius:9999px;background:#F5EBDC;box-shadow:0 10px 20px rgba(23,51,40,.28);">
        <img src="${geaMarkerLogoUrl}" alt="" style="display:block;width:100%;height:100%;object-fit:cover;" />
      </span>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -24]
  });
}

export default function Mappa({ escursioni = [], height = "420px" }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const points = escursioni.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
      if (!mapElement.current || !points.length) return;

      try {
        setLoadError("");
        const L = (await import("leaflet")).default;
        if (cancelled || mapInstance.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIconRetinaUrl, iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });
        const geaMarkerIcon = createGeaMarkerIcon(L);

        const map = L.map(mapElement.current, { scrollWheelZoom: false });
        mapInstance.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const bounds = [];
        points.forEach((item) => {
          const marker = L.marker([item.lat, item.lng], hasGea(item) ? { icon: geaMarkerIcon } : undefined).addTo(map);
          marker.bindPopup(createPopupContent(item));
          bounds.push([item.lat, item.lng]);
        });

        if (bounds.length === 1) map.setView(bounds[0], 11);
        else map.fitBounds(bounds, { padding: [40, 40] });

        requestAnimationFrame(() => map.invalidateSize());
        setTimeout(() => map.invalidateSize(), 250);
      } catch (error) {
        if (!cancelled) {
          setLoadError("La mappa non ? riuscita a caricarsi correttamente.");
          console.error("[mappa] Errore nel caricamento della mappa", error);
        }
      }
    }

    initMap();
    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [escursioni]);

  const hasCoordinates = escursioni.some((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

  if (!hasCoordinates) {
    return <div class="flex h-full min-h-[260px] w-full min-w-0 items-center justify-center rounded-[1.75rem] border border-dashed border-forest-300 bg-white/70 p-6 text-center text-sm text-forest-700 sm:min-h-[320px]">Nessuna coordinata disponibile. Aggiungi `lat` e `lng` al foglio Google per vedere la mappa.</div>;
  }

  if (loadError) {
    return <div class="flex h-full min-h-[260px] w-full min-w-0 items-center justify-center rounded-[1.75rem] border border-dashed border-cream/30 bg-white/10 p-6 text-center text-sm text-cream sm:min-h-[320px]">{loadError}</div>;
  }

  return <div ref={mapElement} class="leaflet-host w-full min-w-0 max-w-full overflow-hidden rounded-[1.75rem] border border-white/70 shadow-card" style={{ height, minHeight: "260px" }} />;
}
