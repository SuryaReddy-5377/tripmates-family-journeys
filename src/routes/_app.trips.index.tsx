import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/app/TripCard";
import { EmptyState } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";
import { tripStatus } from "@/lib/trips";

type Filter = "all" | "upcoming" | "ongoing" | "completed" | "archived";

export const Route = createFileRoute("/_app/trips/")({
  head: () => ({
    meta: [
      { title: "Trips — TripMates" },
      { name: "description", content: "All of our family trips — upcoming, happening now and past memories." },
      { property: "og:title", content: "Trips — TripMates" },
      { property: "og:description", content: "Upcoming, ongoing and past family trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const { trips } = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = trips
    .filter((t) => (filter === "archived" ? t.archived : !t.archived && (filter === "all" || tripStatus(t) === filter)))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const filters: [Filter, string][] = [
    ["all", "All"],
    ["upcoming", "Upcoming"],
    ["ongoing", "Now"],
    ["completed", "Completed"],
    ["archived", "Archived"],
  ];
  return (
    <div className="grid gap-5 fade-up">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Trips</h1>
          <p className="text-sm text-muted-foreground">{trips.length} trips across the family</p>
        </div>
        <Button asChild>
          <Link to="/trips/new"><Plus /> New trip</Link>
        </Button>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {filters.map(([f, l]) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Compass />} title="Nothing here yet" body="Trips matching this filter will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <TripCard key={t.id} trip={t} eager={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
