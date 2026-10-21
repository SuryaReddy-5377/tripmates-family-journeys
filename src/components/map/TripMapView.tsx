import { useEffect, useRef, useState } from "react";
import L from "leaflet";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState, addStop, updateStop, deleteStop, reorderStops } from "@/lib/store";
import { OfflineTileLayer, downloadRegionTiles, CARTO_VOYAGER_URL, type DownloadProgress } from "@/lib/offline-tile-layer";
import { checkStorageEstimate, getDownloadedRegions, deleteDownloadedRegion, type StorageEstimateResult } from "@/lib/offline-storage";
import type { RouteStop, Trip, OfflineRegion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";

interface TripMapViewProps {
  trip: Trip;
  initialAddStop?: boolean;
  initialDownloadModal?: boolean;
}

export function TripMapView({ trip, initialAddStop, initialDownloadModal }: TripMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);

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

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;

    // Default center on destination or stops
    const defaultCenter: [number, number] = tripStops.length > 0
      ? [tripStops[0].lat, tripStops[0].lng]
      : [26.9124, 75.7873]; // Jaipur fallback

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Custom offline-capable tile layer
    const tileLayer = new OfflineTileLayer(CARTO_VOYAGER_URL);
    tileLayer.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers and Route Lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (filteredStops.length === 0) return;

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
          <div class="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">Day ${stop.dayNumber} • Stop ${index + 1}</div>
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

    // Draw route polyline
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: "#0d9488",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8",
        lineCap: "round",
      }).addTo(map);
      routeLayerRef.current = polyline;
    }

    // Fit map bounds to stops
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredStops, selectedStopId]);

  // Live GPS Tracking
  const toggleLocation = () => {
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

  // Open in Google Maps
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

    // Compute bounding box around stops with safety margin
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
          maxZoom: 14, // Perfect balance for city/district roads ~10-25 MB
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
              All Days ({tripStops.length})
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
                Day {d}
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
              <span>{isOnline ? "Live Map" : "Offline Storage"}</span>
            </div>

            {/* DOWNLOAD REGION BUTTON */}
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-card/95 border border-border px-3 py-1.5 text-xs font-bold text-foreground shadow-card hover:bg-secondary transition-all"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Offline Cache</span>
            </button>

            {/* LOCATE ME BUTTON */}
            <button
              onClick={toggleLocation}
              title="Show my current GPS position"
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
              <span>Navigate Route in Google Maps</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT ITINERARY STOPS SIDE PANEL (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Route Stops</h2>
            <p className="text-xs text-muted-foreground">
              {filteredStops.length} stop{filteredStops.length === 1 ? "" : "s"} planned
            </p>
          </div>
          <Button
            onClick={() => setAddStopOpen(true)}
            size="sm"
            className="rounded-xl gap-1 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stop
          </Button>
        </div>

        {/* STOPS LIST */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[540px] pr-1">
          {filteredStops.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MapPin className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <div className="text-sm font-semibold">No stops on this day</div>
              <div className="text-xs text-muted-foreground mt-1">Add places to visit or download the map region.</div>
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
                      Day {stop.dayNumber}
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

      {/* ADD STOP MODAL */}
      <ResponsiveModal open={addStopOpen} onOpenChange={setAddStopOpen} title="Add Trip Stop">
        <div className="grid gap-4 p-1">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Search Place or Landmark</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. Hawa Mahal, Amer Fort, Palolem Beach"
                  className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} size="sm" className="rounded-xl text-xs font-bold">
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Trip Day</label>
              <select
                value={newStopDay}
                onChange={(e) => setNewStopDay(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Arrival Time (ETA)</label>
              <input
                type="time"
                value={newStopArrival}
                onChange={(e) => setNewStopArrival(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Notes / Instructions</label>
            <input
              type="text"
              value={newStopNotes}
              onChange={(e) => setNewStopNotes(e.target.value)}
              placeholder="e.g. Meet guide at east gate, sunset photography"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          {/* SEARCH RESULTS LIST */}
          {searchResults.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-secondary/30 p-2 space-y-1.5 max-h-48 overflow-y-auto">
              <div className="text-[11px] font-semibold text-muted-foreground px-2">Select matching location:</div>
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full flex items-start gap-2 rounded-xl p-2 text-left hover:bg-card border border-transparent hover:border-border/80 transition-all"
                >
                  <MapPin className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">{res.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{res.address}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* OFFLINE REGION MANAGER MODAL */}
      <ResponsiveModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} title="Offline Maps & Cache">
        <div className="grid gap-4 p-1">
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3.5 text-xs text-teal-950 dark:text-teal-200">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <HardDrive className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Genuine Offline Storage (IndexedDB)</span>
            </div>
            <div>
              Pre-download map tiles for <span className="font-bold">{trip.destination}</span>. You can view maps, inspect stops,
              and track live GPS location without Wi-Fi or cellular network data.
            </div>
          </div>

          {/* STORAGE QUOTA METRICS */}
          {storageInfo && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border p-2.5 bg-card">
                <div className="text-muted-foreground text-[10px] uppercase font-semibold">Available Storage</div>
                <div className="font-bold text-foreground text-sm">
                  {(storageInfo.availableBytes / (1024 * 1024)).toFixed(0)} MB
                </div>
              </div>
              <div className="rounded-xl border border-border p-2.5 bg-card">
                <div className="text-muted-foreground text-[10px] uppercase font-semibold">Storage Persistence</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {storageInfo.persistent ? "Protected" : "Browser Managed"}
                </div>
              </div>
            </div>
          )}

          {/* DOWNLOAD PROGRESS BAR */}
          {isDownloading && downloadProgress && (
            <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Downloading tiles...</span>
                <span>{downloadProgress.percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-200"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>
                  {downloadProgress.completed} / {downloadProgress.total} tiles
                </span>
                <span>{(downloadProgress.bytesDownloaded / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <Button onClick={handleCancelDownload} variant="outline" size="sm" className="w-full mt-2 text-xs">
                Cancel Download
              </Button>
            </div>
          )}

          {/* ACTION BUTTON */}
          {!isDownloading && (
            <Button
              onClick={handleStartDownload}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Download {trip.destination} Map Region (~12-18 MB)
            </Button>
          )}

          {/* STORED REGIONS LIST */}
          <div className="mt-2 space-y-2">
            <div className="text-xs font-bold text-foreground">Stored Offline Regions</div>
            {downloadedRegions.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 italic">No offline regions saved yet.</div>
            ) : (
              downloadedRegions.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between rounded-xl border border-border p-2.5 bg-card text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{reg.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {reg.tileCount} tiles • {(reg.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {new Date(reg.downloadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRegion(reg.id)}
                    className="p-1.5 text-destructive/70 hover:text-destructive"
                    title="Delete Region"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
