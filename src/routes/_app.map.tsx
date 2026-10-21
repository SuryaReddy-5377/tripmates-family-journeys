import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppState } from "@/lib/store";
import { TripMapView } from "@/components/map/TripMapView";
import { MapPinned, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/map")({
  head: () => ({
    meta: [
      { title: "Explore Map — TripMates 2.0" },
      { name: "description", content: "Interactive map with offline regional tile downloads and route planning." },
    ],
  }),
  component: GlobalMapRoute,
});

function GlobalMapRoute() {
  const { trips } = useAppState();
  const liveTrips = trips.filter((t) => !t.archived);
  const activeTrip = liveTrips[0];

  if (!activeTrip) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
        <MapPinned className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-3" />
        <h2 className="text-lg font-bold text-foreground">No active trip found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">Create a trip first to explore its interactive map.</p>
        <Button asChild className="rounded-xl">
          <Link to="/trips/new">Create Trip</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Explore Map & Routes</h1>
          <p className="text-xs text-muted-foreground">
            Viewing map for <span className="font-bold text-foreground">{activeTrip.name}</span> ({activeTrip.destination})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/trips"
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            Switch Trip
          </Link>
        </div>
      </div>
      <TripMapView trip={activeTrip} />
    </div>
  );
}
