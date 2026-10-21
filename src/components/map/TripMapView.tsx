import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import {
  Compass,
  DownloadCloud,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Wifi,
  WifiOff,
  X,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState, addStop, updateStop, deleteStop, reorderStops } from "@/lib/store";
import { createOfflineTileLayer, downloadRegionTiles, CARTO_VOYAGER_URL, type DownloadProgress } from "@/lib/offline-tile-layer";
import { checkStorageEstimate, getDownloadedRegions, deleteDownloadedRegion, type StorageEstimateResult } from "@/lib/offline-storage";
import type { RouteStop, Trip, OfflineRegion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { useTranslation } from "@/lib/i18n";

interface TripMapViewProps {
  trip: Trip;
  initialAddStop?: boolean;
  initialDownloadModal?: boolean;
}

// Helper to resolve coordinates for destinations if no stops are pinned yet
function getDestinationCoords(destination: string): [number, number] {
  const d = destination.toLowerCase();
  if (d.includes("goa")) return [15.2993, 74.1240];
  if (d.includes("kerala") || d.includes("kochi") || d.includes("munnar") || d.includes("alleppey")) return [9.9312, 76.2673];
  if (d.includes("jaipur") || d.includes("rajasthan") || d.includes("udaipur")) return [26.9124, 75.7873];
  if (d.includes("manali") || d.includes("himachal") || d.includes("shimla")) return [32.2432, 77.1892];
  if (d.includes("hyderabad")) return [17.3850, 78.4867];
  if (d.includes("bangalore") || d.includes("bengaluru")) return [12.9716, 77.5946];
  if (d.includes("tirupati")) return [13.6288, 79.4192];
  if (d.includes("vizag") || d.includes("visakhapatnam")) return [17.6868, 83.2185];
  if (d.includes("delhi") || d.includes("agra")) return [28.6139, 77.2090];
  if (d.includes("mumbai") || d.includes("pune") || d.includes("lonavala")) return [19.0760, 72.8777];
  if (d.includes("ooty") || d.includes("kodaikanal")) return [11.4102, 76.6950];
  return [26.9124, 75.7873];
}

// In-memory route cache to make switching between days instant (0ms delay)
const osrmRouteCache = new Map<string, { distanceKm: string; durationMin: number; coordinates: [number, number][] }>();

export function TripMapView({ trip, initialAddStop, initialDownloadModal }: TripMapViewProps) {
  const { t, isTelugu } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [routeStats, setRouteStats] = useState<{ distanceKm: string; durationMin: number } | null>(null);

  const { stops, savedRoutes, isOnline } = useAppState();
  const tripStops = stops
    .filter((s) => s.tripId === trip.id)
    .sort((a, b) => a.dayNumber - b.dayNumber || a.order - b.order);

  const [selectedDay, setSelectedDay] = useState<number | "all">("all");
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Stop modal state
  const [addStopOpen, setAddStopOpen] = useState(initialAddStop || false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; lat: number; lng: number; address: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newStopDay, setNewStopDay] = useState(1);
  const [newStopArrival, setNewStopArrival] = useState("");
  const [newStopNotes, setNewStopNotes] = useState("");

  // Offline Region Downloader state
  const [downloadModalOpen, setDownloadModalOpen] = useState(initialDownloadModal || false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateResult | null>(null);
  const [downloadedRegions, setDownloadedRegions] = useState<OfflineRegion[]>([]);

  const days = Array.from(new Set(tripStops.map((s) => s.dayNumber))).sort((a, b) => a - b);
  const filteredStops = selectedDay === "all" ? tripStops : tripStops.filter((s) => s.dayNumber === selectedDay);

  // Refresh storage and regions
  const refreshStorage = async () => {
    const est = await checkStorageEstimate();
    setStorageInfo(est);
    const regs = await getDownloadedRegions();
    setDownloadedRegions(regs);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  // Initialize Map dynamically (safe on client only, zero SSR crashes)
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      // Default center on destination or stops
      const defaultCenter: [number, number] =
        tripStops.length > 0 ? [tripStops[0].lat, tripStops[0].lng] : getDestinationCoords(trip.destination);

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: tripStops.length > 0 ? 13 : 11,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Standard OpenStreetMap tile layer (100% reliable, zero CORS issues)
      const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tileLayer.addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);

      // Force dimension recalculation so tiles load immediately
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 500);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers and Route Lines with real OSRM road geometry
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (filteredStops.length === 0) {
      setRouteStats(null);
      const destCoords = getDestinationCoords(trip.destination);
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-teal-600 text-white font-bold shadow-lg ring-4 ring-teal-200 text-xs">★</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker(destCoords, { icon: destIcon });
      marker.bindPopup(`<div class="p-2 text-slate-900 font-bold">${trip.destination}</div>`);
      markersLayerRef.current.addLayer(marker);
      map.setView(destCoords, 11);
      return;
    }

    const latLngs: [number, number][] = [];

    filteredStops.forEach((stop, index) => {
      const position: [number, number] = [stop.lat, stop.lng];
      latLngs.push(position);

      const customIcon = L.divIcon({
        className: "custom-stop-marker",
        html: `<div class="route-stop-pin ${selectedStopId === stop.id ? "ring-4 ring-teal-400 scale-110" : ""}">
          ${index + 1}
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(position, { icon: customIcon });

      const popupHtml = `
        <div class="p-3 text-slate-900 min-w-[200px]">
          <div class="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">${t("day")} ${stop.dayNumber} • Stop ${index + 1}</div>
          <div class="font-bold text-sm mb-1">${stop.name}</div>
          ${stop.address ? `<div class="text-xs text-slate-500 mb-1.5">${stop.address}</div>` : ""}
          ${stop.plannedArrival ? `<div class="flex items-center gap-1 text-xs text-slate-600 mb-1 font-semibold"><span class="text-teal-600 font-bold">ETA:</span> ${stop.plannedArrival}</div>` : ""}
          ${stop.notes ? `<div class="text-xs italic bg-slate-100 p-1.5 rounded-lg text-slate-700">${stop.notes}</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => setSelectedStopId(stop.id));
      markersLayerRef.current?.addLayer(marker);
    });

    let cancelled = false;

    // Draw route: Attempt real road-routing geometry using free OSRM driving API
    if (latLngs.length > 1) {
      const coordsString = filteredStops.map((s) => `${s.lng},${s.lat}`).join(";");

      const applyRoute = (roadCoords: [number, number][], distanceKm: string, durationMin: number) => {
        setRouteStats({ distanceKm, durationMin });
        if (!map) return;
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
        }
        const polyline = L.polyline(roadCoords, {
          color: "#0d9488",
          weight: 4.5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        routeLayerRef.current = polyline;
      };

      // Check cache first for 0ms instantaneous render
      const cached = osrmRouteCache.get(coordsString);
      if (cached) {
        applyRoute(cached.coordinates, cached.distanceKm, cached.durationMin);
      } else {
        const fetchRoadRoute = async () => {
          try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
            const resp = await fetch(osrmUrl);
            if (resp.ok) {
              const data = await resp.json();
              if (data.routes && data.routes[0] && !cancelled && mapRef.current) {
                const roadCoordinates: [number, number][] = data.routes[0].geometry.coordinates.map(
                  ([lng, lat]: [number, number]) => [lat, lng],
                );
                const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
                const durationMin = Math.round(data.routes[0].duration / 60);

                osrmRouteCache.set(coordsString, {
                  distanceKm,
                  durationMin,
                  coordinates: roadCoordinates,
                });

                applyRoute(roadCoordinates, distanceKm, durationMin);
                return;
              }
            }
          } catch {
            // Graceful fallback on network failure or offline mode
          }

          // Direct straight-line fallback if OSRM unavailable
          if (!cancelled && mapRef.current) {
            const polyline = L.polyline(latLngs, {
              color: "#0d9488",
              weight: 3.5,
              opacity: 0.8,
              dashArray: "6, 8",
              lineCap: "round",
            }).addTo(mapRef.current);
            routeLayerRef.current = polyline;
          }
        };

        fetchRoadRoute();
      }
    } else {
      setRouteStats(null);
    }

    // Fit map bounds to stops
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    return () => {
      cancelled = true;
    };
  }, [filteredStops, selectedStopId, mapReady]);

  // Live GPS Tracking
  const toggleLocation = () => {
    const L = leafletRef.current;
    if (!L) return;

    if (isLocating) {
      setIsLocating(false);
      if (gpsMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        if (mapRef.current) {
          mapRef.current.setView(coords, 15);
          if (!gpsMarkerRef.current) {
            const gpsIcon = L.divIcon({
              className: "gps-icon",
              html: `<div class="gps-live-pin"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
            gpsMarkerRef.current = L.marker(coords, { icon: gpsIcon }).addTo(mapRef.current);
          } else {
            gpsMarkerRef.current.setLatLng(coords);
          }
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err);
      },
      { enableHighAccuracy: true },
    );
  };

  // Search Places (Nominatim / Photon / Offline fallback)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    if (navigator.onLine) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          `${searchQuery} ${trip.destination}`,
        )}&limit=5`;
        const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (resp.ok) {
          const data = await resp.json();
          const results = data.map((item: any) => ({
            name: item.display_name.split(",")[0],
            address: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setSearchResults(results);
          setIsSearching(false);
          return;
        }
      } catch (e) {
        console.warn("Online geocoding failed, falling back to offline stops:", e);
      }
    }

    // Offline search fallback: match against known destination landmarks & existing stops
    const offlineMatches = tripStops
      .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((s) => ({
        name: s.name,
        address: s.address || `${s.name}, ${trip.destination}`,
        lat: s.lat,
        lng: s.lng,
      }));

    setSearchResults(offlineMatches);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number; address: string }) => {
    const newStop: RouteStop = {
      id: `stop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tripId: trip.id,
      dayNumber: newStopDay,
      order: tripStops.filter((s) => s.dayNumber === newStopDay).length + 1,
      name: res.name,
      address: res.address,
      lat: res.lat,
      lng: res.lng,
      plannedArrival: newStopArrival || undefined,
      notes: newStopNotes || undefined,
    };
    addStop(newStop);
    setAddStopOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStopId(newStop.id);
  };

  // Reordering
  const handleMoveStop = (stopId: string, direction: "up" | "down") => {
    const list = [...filteredStops];
    const idx = list.findIndex((s) => s.id === stopId);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    reorderStops(trip.id, list.map((s) => s.id));
  };

  // Open in Google Maps Turn-by-Turn
  const handleOpenGoogleMaps = () => {
    if (filteredStops.length === 0) return;
    if (filteredStops.length === 1) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${filteredStops[0].lat},${filteredStops[0].lng}`, "_blank");
      return;
    }
    const origin = `${filteredStops[0].lat},${filteredStops[0].lng}`;
    const destination = `${filteredStops[filteredStops.length - 1].lat},${filteredStops[filteredStops.length - 1].lng}`;
    const waypoints = filteredStops
      .slice(1, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
      waypoints ? `&waypoints=${waypoints}` : ""
    }&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Offline Region Download Handler
  const handleStartDownload = async () => {
    if (filteredStops.length === 0) {
      alert("Add at least one stop to define the download area");
      return;
    }

    const lats = filteredStops.map((s) => s.lat);
    const lngs = filteredStops.map((s) => s.lng);
    const pad = 0.08; // ~8-10 km margin
    const bounds = {
      north: Math.max(...lats) + pad,
      south: Math.min(...lats) - pad,
      east: Math.max(...lngs) + pad,
      west: Math.min(...lngs) - pad,
    };

    const controller = new AbortController();
    setAbortController(controller);
    setIsDownloading(true);
    setDownloadProgress(null);

    try {
      await downloadRegionTiles(
        {
          id: `region_${trip.id}`,
          name: `${trip.name} (${trip.destination})`,
          destination: trip.destination,
          bounds,
          minZoom: 11,
          maxZoom: 14,
        },
        (progress) => {
          setDownloadProgress(progress);
        },
        controller.signal,
      );
      await refreshStorage();
    } catch (e: any) {
      if (!controller.signal.aborted) {
        alert(`Download interrupted: ${e.message}`);
      }
    } finally {
      setIsDownloading(false);
      setAbortController(null);
    }
  };

  const handleCancelDownload = () => {
    if (abortController) {
      abortController.abort();
      setIsDownloading(false);
      setAbortController(null);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (confirm("Delete this offline region?")) {
      await deleteDownloadedRegion(id);
      await refreshStorage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
      {/* MAP VIEW CONTAINER (8 COLS) */}
      <div className="lg:col-span-8 flex flex-col rounded-3xl border border-border/80 bg-card overflow-hidden shadow-soft relative min-h-[480px] lg:min-h-[650px]">
        {/* TOP MAP CONTROLS OVERLAY */}
        <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* DAY FILTER PILL */}
          <div className="flex items-center gap-1 rounded-2xl bg-background/95 p-1 border border-border/80 shadow-card backdrop-blur-md pointer-events-auto">
            <button
              onClick={() => setSelectedDay("all")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                selectedDay === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("allDays")} ({tripStops.length})
            </button>
            {days.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all",
                  selectedDay === d ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("day")} {d}
              </button>
            ))}
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* OFFLINE INDICATOR PILL */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold shadow-card border backdrop-blur-md",
                isOnline
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40",
              )}
            >
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{isOnline ? t("online") : t("offline")}</span>
            </div>

            {/* DOWNLOAD REGION BUTTON */}
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-card/95 border border-border px-3 py-1.5 text-xs font-bold text-foreground shadow-card hover:bg-secondary transition-all"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t("offlineMaps")}</span>
            </button>

            {/* LOCATE ME BUTTON */}
            <button
              onClick={toggleLocation}
              title={t("liveGPS")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl border shadow-card backdrop-blur-md transition-all",
                isLocating
                  ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400/40"
                  : "bg-card/95 text-foreground border-border hover:bg-secondary",
              )}
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ROAD ROUTE STATS OVERVIEW BANNER */}
        {routeStats && (
          <div className="absolute top-16 left-4 z-[400] flex items-center gap-3 rounded-2xl bg-slate-900/90 text-white px-3.5 py-1.5 text-xs font-semibold shadow-card backdrop-blur-md border border-slate-700">
            <span className="flex items-center gap-1.5 text-teal-300 font-bold">
              <Car className="h-3.5 w-3.5" />
              {routeStats.distanceKm} km
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-200">
              ~{routeStats.durationMin} {t("countdownMins")} {t("estDriveTime")}
            </span>
          </div>
        )}

        {/* LEAFLET MAP ELEMENT */}
        <div ref={mapContainerRef} className="w-full flex-1 min-h-[480px] lg:min-h-[650px] z-10" />

        {/* BOTTOM TURN-BY-TURN BAR */}
        {filteredStops.length > 0 && (
          <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2">
            <button
              onClick={handleOpenGoogleMaps}
              className="flex items-center gap-2 rounded-2xl bg-slate-900/95 text-white px-4 py-2 text-xs font-bold shadow-card border border-slate-700 hover:bg-slate-800 backdrop-blur-md transition-all active:scale-[0.98]"
            >
              <Navigation className="h-4 w-4 text-teal-400" />
              <span>{t("navigateInGoogleMaps")}</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT ITINERARY STOPS SIDE PANEL (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">{t("mapTitle")}</h2>
            <p className="text-xs text-muted-foreground">
              {filteredStops.length} {t("day")} {filteredStops.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            onClick={() => setAddStopOpen(true)}
            size="sm"
            className="rounded-xl gap-1 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addStop")}
          </Button>
        </div>

        {/* STOPS LIST */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[540px] pr-1">
          {filteredStops.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MapPin className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <div className="text-sm font-semibold">{t("noUpcomingActivities")}</div>
              <div className="text-xs text-muted-foreground mt-1">{t("mapSubtitle")}</div>
            </div>
          ) : (
            filteredStops.map((stop, idx) => (
              <div
                key={stop.id}
                onClick={() => {
                  setSelectedStopId(stop.id);
                  if (mapRef.current) {
                    mapRef.current.setView([stop.lat, stop.lng], 15);
                  }
                }}
                className={cn(
                  "group relative flex items-start gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer",
                  selectedStopId === stop.id
                    ? "border-teal-500 bg-teal-500/5 shadow-sm"
                    : "border-border/80 bg-card hover:bg-secondary/40",
                )}
              >
                {/* NUMBER BADGE */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-foreground truncate">{stop.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                      {t("day")} {stop.dayNumber}
                    </span>
                  </div>

                  {stop.address && (
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">{stop.address}</div>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                    {stop.plannedArrival && (
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold">
                        <Clock className="h-3 w-3" />
                        ETA: {stop.plannedArrival}
                      </span>
                    )}
                    {stop.notes && <span className="truncate italic">"{stop.notes}"</span>}
                  </div>
                </div>

                {/* REORDER & DELETE CONTROLS */}
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveStop(stop.id, "up");
                    }}
                    disabled={idx === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveStop(stop.id, "down");
                    }}
                    disabled={idx === filteredStops.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStop(stop.id);
                    }}
                    className="p-1 text-destructive/70 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD STOP MODAL WITH NOMINATIM SEARCH */}
      <ResponsiveModal open={addStopOpen} onOpenChange={setAddStopOpen} title={t("addStop")}>
        <div className="space-y-4 p-1">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">{t("searchPlaces")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("searchPlaces")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button onClick={handleSearch} disabled={isSearching} className="rounded-xl text-xs font-semibold gap-1">
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t("search")}
              </Button>
            </div>
          </div>

          {/* SEARCH RESULTS */}
          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-border p-2 bg-secondary/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                Matching Places
              </span>
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2 rounded-lg hover:bg-card border border-transparent hover:border-border transition-all flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-foreground truncate">{res.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{res.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">{t("day")}</label>
              <input
                type="number"
                min={1}
                max={30}
                value={newStopDay}
                onChange={(e) => setNewStopDay(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">{t("arrivalTime")}</label>
              <input
                type="text"
                placeholder="10:30 AM"
                value={newStopArrival}
                onChange={(e) => setNewStopArrival(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">{t("notes")}</label>
            <input
              type="text"
              placeholder="E.g. Tickets booked, enter via Gate 2"
              value={newStopNotes}
              onChange={(e) => setNewStopNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
            />
          </div>
        </div>
      </ResponsiveModal>

      {/* OFFLINE REGION DOWNLOADER MODAL */}
      <ResponsiveModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} title={t("offlineMaps")}>
        <div className="space-y-4 p-1">
          {storageInfo && (
            <div className="rounded-2xl border border-border/80 bg-secondary/40 p-3.5 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="h-4 w-4" />
                  {t("storageUsed")}
                </span>
                <span className="text-foreground">
                  {(storageInfo.usedBytes / (1024 * 1024)).toFixed(1)} MB / {(storageInfo.quotaBytes / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                IndexedDB offline tile storage. Persistent on mobile browsers.
              </div>
            </div>
          )}

          {downloadedRegions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">{t("offlineReady")}</span>
              {downloadedRegions.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-foreground">{reg.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {reg.tileCount} tiles cached • {Math.round(reg.sizeBytes / 1024 / 1024)} MB
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRegion(reg.id)}
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {isDownloading ? (
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 text-center space-y-3">
              <RefreshCw className="mx-auto h-6 w-6 text-teal-600 animate-spin" />
              <div>
                <div className="font-bold text-sm text-foreground">{t("downloadingTiles")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {downloadProgress?.completed} / {downloadProgress?.total} tiles (
                  {downloadProgress?.percent}%)
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelDownload}
                className="rounded-xl text-xs font-semibold"
              >
                {t("cancel")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download city map tiles for <span className="font-bold text-foreground">{trip.destination}</span> so your family can view road navigation even without mobile internet or Wi-Fi.
              </p>
              <Button
                onClick={handleStartDownload}
                className="w-full rounded-xl text-xs font-bold gap-2 py-2.5"
              >
                <DownloadCloud className="h-4 w-4" />
                {t("downloadRegion")}
              </Button>
            </div>
          )}
        </div>
      </ResponsiveModal>
    </div>
  );
}
