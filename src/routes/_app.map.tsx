import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  DownloadCloud,
  Layers,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  Plus,
  Search,
  Wifi,
  WifiOff,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type L from "leaflet";
import { useAppState } from "@/lib/store";
import { TripMapView } from "@/components/map/TripMapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/_app/map")({
  head: () => ({
    meta: [
      { title: "Explore Map — TripMates 2.0" },
      { name: "description", content: "Interactive family travel map, place search, and offline navigation." },
    ],
  }),
  component: GlobalMapRoute,
});

interface HighlightPlace {
  name: string;
  state: string;
  tag: string;
  coords: [number, number];
  description: string;
}

const POPULAR_DESTINATIONS: HighlightPlace[] = [
  {
    name: "Hyderabad",
    state: "Telangana",
    tag: "Family Base",
    coords: [17.385, 78.4867],
    description: "Home workspace • Charminar, Golconda Fort, and Ramoji Film City.",
  },
  {
    name: "Goa",
    state: "Goa",
    tag: "Beach Holiday",
    coords: [15.2993, 74.124],
    description: "Beaches, Portuguese architecture, sunset cruises, and water sports.",
  },
  {
    name: "Munnar",
    state: "Kerala",
    tag: "Hill Station",
    coords: [10.0889, 77.0595],
    description: "Tea plantations, cool misty climate, waterfalls, and scenic viewpoints.",
  },
  {
    name: "Tirupati",
    state: "Andhra Pradesh",
    tag: "Pilgrimage",
    coords: [13.6288, 79.4192],
    description: "Sri Venkateswara Swamy Temple on Tirumala hills.",
  },
  {
    name: "Visakhapatnam",
    state: "Andhra Pradesh",
    tag: "Coastal City",
    coords: [17.6868, 83.2185],
    description: "RK Beach, Kailasagiri hills, Submarine Museum, and Araku Valley.",
  },
  {
    name: "Jaipur",
    state: "Rajasthan",
    tag: "Heritage",
    coords: [26.9124, 75.7873],
    description: "Amber Fort, Hawa Mahal, royal palaces, and vibrant bazaars.",
  },
  {
    name: "Manali",
    state: "Himachal Pradesh",
    tag: "Snow & Mountains",
    coords: [32.2432, 77.1892],
    description: "Solang Valley snow, Rohtang Pass, apple orchards, and mountain drives.",
  },
  {
    name: "Ooty",
    state: "Tamil Nadu",
    tag: "Nilgiri Hills",
    coords: [11.4102, 76.695],
    description: "Botanical gardens, Ooty Lake, toy train, and tea gardens.",
  },
];

function GeneralTravelMap({ onPlanTrip }: { onPlanTrip: (destination: string) => void }) {
  const { t } = useTranslation();
  const { isOnline } = useAppState();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchPinRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; lat: number; lng: number; address: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<HighlightPlace | null>(POPULAR_DESTINATIONS[0]);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [17.385, 78.4867], // Default center on Hyderabad (Home)
        zoom: 6,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // OpenStreetMap Standard Tiles (free, fast, zero CORS issues)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapRef.current = map;

      // Add pins for popular family destinations
      POPULAR_DESTINATIONS.forEach((place) => {
        const pinIcon = L.divIcon({
          className: "custom-dest-pin",
          html: `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-teal-600 text-white font-bold shadow-lg ring-2 ring-white text-xs hover:scale-110 transition-transform">
            📍
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const m = L.marker(place.coords, { icon: pinIcon });
        m.bindPopup(`
          <div class="p-2 text-slate-900 min-w-[180px]">
            <div class="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">${place.tag} • ${place.state}</div>
            <div class="font-bold text-sm mb-1">${place.name}</div>
            <div class="text-xs text-slate-600 mb-2">${place.description}</div>
          </div>
        `);
        m.on("click", () => setSelectedPlace(place));
        markersGroup.addLayer(m);
      });

      // Recalculate dimensions so map never renders gray
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 400);
      setTimeout(() => map.invalidateSize(), 900);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const flyToCoords = (coords: [number, number], zoom = 12) => {
    if (mapRef.current) {
      mapRef.current.flyTo(coords, zoom, { duration: 1.2 });
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    }
  };

  const handleSelectPlace = (place: HighlightPlace) => {
    setSelectedPlace(place);
    flyToCoords(place.coords, 10);
  };

  // Free OpenStreetMap Nominatim place search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + " India",
      )}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => ({
          name: item.name || item.display_name.split(",")[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
        }));
        setSearchResults(formatted);

        if (formatted.length > 0) {
          handleSelectSearchResult(formatted[0]);
        }
      }
    } catch (err) {
      console.warn("Location search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: { name: string; lat: number; lng: number; address: string }) => {
    const coords: [number, number] = [result.lat, result.lng];
    flyToCoords(coords, 13);

    const L = leafletRef.current;
    const map = mapRef.current;
    if (L && map) {
      if (searchPinRef.current) {
        map.removeLayer(searchPinRef.current);
      }
      const icon = L.divIcon({
        className: "search-pin",
        html: `<div class="flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white font-bold shadow-xl ring-4 ring-blue-200 text-sm">
          ★
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const m = L.marker(coords, { icon }).addTo(map);
      m.bindPopup(`
        <div class="p-2 text-slate-900 min-w-[200px]">
          <div class="font-bold text-sm mb-1">${result.name}</div>
          <div class="text-xs text-slate-500 mb-2">${result.address}</div>
        </div>
      `).openPopup();
      searchPinRef.current = m;
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        flyToCoords(coords, 14);

        const L = leafletRef.current;
        const map = mapRef.current;
        if (L && map) {
          const gpsIcon = L.divIcon({
            className: "gps-live-pin",
            html: `<div class="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-blue-300 animate-pulse"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker(coords, { icon: gpsIcon }).addTo(map).bindPopup("<b>You are here</b>").openPopup();
        }
      },
      () => {
        setIsLocating(false);
      },
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
      {/* MAP CANVAS (8 COLS) */}
      <div className="lg:col-span-8 flex flex-col rounded-3xl border border-border/80 bg-card overflow-hidden shadow-soft relative min-h-[480px] lg:min-h-[650px]">
        {/* TOP SEARCH OVERLAY */}
        <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md flex items-center gap-2 rounded-2xl bg-background/95 p-1.5 border border-border/90 shadow-card backdrop-blur-md pointer-events-auto"
          >
            <Search className="h-4 w-4 ml-2 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search Indian destinations, hotels, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none px-1"
            />
            <Button type="submit" size="sm" disabled={isSearching} className="h-8 rounded-xl text-xs font-semibold px-3">
              {isSearching ? "..." : "Search"}
            </Button>
          </form>

          <div className="flex items-center gap-2 pointer-events-auto">
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

            <button
              onClick={handleLocateMe}
              title="Locate my position (GPS)"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl border shadow-card backdrop-blur-md transition-all cursor-pointer",
                isLocating
                  ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-400/40"
                  : "bg-card/95 text-foreground border-border hover:bg-secondary",
              )}
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MAP CONTAINER ELEMENT */}
        <div ref={mapContainerRef} className="w-full flex-1 min-h-[480px] lg:min-h-[650px] z-10" />

        {/* BOTTOM ACTIVE DESTINATION CARD OVERLAY */}
        {selectedPlace && (
          <div className="absolute bottom-4 inset-x-4 z-[400] max-w-lg rounded-2xl border border-border/90 bg-background/95 p-3.5 shadow-card backdrop-blur-md pointer-events-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400">
                <span>{selectedPlace.tag}</span>
                <span>•</span>
                <span>{selectedPlace.state}</span>
              </div>
              <div className="font-display text-sm font-bold text-foreground truncate">{selectedPlace.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{selectedPlace.description}</div>
            </div>
            <Button
              size="sm"
              onClick={() => onPlanTrip(selectedPlace.name)}
              className="rounded-xl text-xs font-bold shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Plan Trip
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE PANEL: POPULAR DESTINATIONS & SEARCH RESULTS (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Popular Destinations</h2>
            <p className="text-xs text-muted-foreground">Family favorite travel circuits across India</p>
          </div>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold">
            <Link to="/trips/new">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Trip
            </Link>
          </Button>
        </div>

        {/* SEARCH RESULTS IF ANY */}
        {searchResults.length > 0 && (
          <div className="space-y-1.5 pb-3 border-b border-border/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Search Results</div>
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSearchResult(r)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-border/80 bg-secondary/50 p-2 text-left hover:bg-secondary transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{r.address}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* DESTINATION CARDS */}
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[500px] pr-1">
          {POPULAR_DESTINATIONS.map((place) => {
            const isSelected = selectedPlace?.name === place.name;
            return (
              <div
                key={place.name}
                onClick={() => handleSelectPlace(place)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-3 cursor-pointer transition-all",
                  isSelected
                    ? "border-teal-500/50 bg-teal-500/10 shadow-xs"
                    : "border-border/80 bg-card hover:bg-secondary/60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-xs">{place.name}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {place.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{place.description}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlanTrip(place.name);
                  }}
                  title="Plan trip here"
                  className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600/10 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/80 bg-secondary/40 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
          <Compass className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Click any destination to fly the map, or click (+) to create a new trip for that city.</span>
        </div>
      </div>
    </div>
  );
}

function GlobalMapRoute() {
  const { trips } = useAppState();
  const navigate = useNavigate();
  const liveTrips = trips.filter((t) => !t.archived);
  const [selectedTripId, setSelectedTripId] = useState<string | "all">(liveTrips.length > 0 ? liveTrips[0].id : "all");

  const activeTrip = liveTrips.find((t) => t.id === selectedTripId);

  const handlePlanTripFor = (destination: string) => {
    navigate({ to: "/trips/new", search: { destination } as any });
  };

  return (
    <div className="space-y-4 fade-up">
      {/* HEADER WITH CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Explore Map & Routes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeTrip
              ? `Viewing itinerary route for ${activeTrip.name} (${activeTrip.destination})`
              : "Interactive travel map, destination exploration, and road routing across India."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {liveTrips.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTripId("all")}
                className={cn(
                  "rounded-xl px-3 py-1 font-bold transition-all cursor-pointer",
                  selectedTripId === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                All India Map
              </button>
              {liveTrips.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTripId(t.id)}
                  className={cn(
                    "rounded-xl px-3 py-1 font-bold transition-all cursor-pointer",
                    selectedTripId === t.id ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          <Button asChild size="sm" className="rounded-xl text-xs font-bold">
            <Link to="/trips/new">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Trip
            </Link>
          </Button>
        </div>
      </div>

      {/* RENDER DEDICATED TRIP MAP OR UNIVERSAL DESTINATION EXPLORER */}
      {activeTrip ? (
        <TripMapView trip={activeTrip} />
      ) : (
        <GeneralTravelMap onPlanTrip={handlePlanTripFor} />
      )}
    </div>
  );
}
