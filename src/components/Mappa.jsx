import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { withBase } from "../utils/base.js";

const markerIconRetinaUrl = withBase("/leaflet/marker-icon-2x.png");
const markerIconUrl = withBase("/leaflet/marker-icon.png");
const markerShadowUrl = withBase("/leaflet/marker-shadow.png");

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

        const map = L.map(mapElement.current, { scrollWheelZoom: false });
        mapInstance.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        const bounds = [];
        points.forEach((item) => {
          const marker = L.marker([item.lat, item.lng]).addTo(map);
          marker.bindPopup(`<strong>${item.titolo}</strong><br/>${item.luogo}<br/><a href="${withBase(`/escursioni/${item.slug}`)}">Apri dettaglio</a>`);
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