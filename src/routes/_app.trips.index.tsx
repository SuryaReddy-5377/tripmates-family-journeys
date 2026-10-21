import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/app/TripCard";
import { EmptyState } from "@/components/app/bits";
import { cn } from "@/lib/utils";
import { useAppState, clearAllDemoData, restoreDemoData } from "@/lib/store";
import { tripStatus } from "@/lib/trips";
import { useTranslation } from "@/lib/i18n";

type Filter = "all" | "upcoming" | "ongoing" | "completed" | "archived";

export const Route = createFileRoute("/_app/trips/")({
  head: () => ({
    meta: [
      { title: "Trips — TripMates 2.0" },
      { name: "description", content: "All of our family trips — upcoming, happening now and past memories." },
      { property: "og:title", content: "Trips — TripMates 2.0" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const { t } = useTranslation();
  const { trips } = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const filtered = trips
    .filter((t) => (filter === "archived" ? t.archived : !t.archived && (filter === "all" || tripStatus(t) === filter)))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const filters: [Filter, string][] = [
    ["all", t("all")],
    ["upcoming", t("statusUpcoming")],
    ["ongoing", t("statusActive")],
    ["completed", t("statusCompleted")],
    ["archived", "Archived"],
  ];
  return (
    <div className="grid gap-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">{t("allTrips")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{trips.length} {t("allTrips").toLowerCase()} across the family</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {trips.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Clear demo trips to start completely fresh with your own family trips?")) {
                  clearAllDemoData();
                  toast.success("Demo trips cleared! You have a fresh slate.");
                }
              }}
              className="rounded-xl text-xs gap-1.5 border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
              Clear Demo Trips
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                restoreDemoData();
                toast.success("Sample trips restored!");
              }}
              className="rounded-xl text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restore Sample Trips
            </Button>
          )}
          <Button asChild className="rounded-xl font-bold text-xs gap-1.5 shadow-soft">
            <Link to="/trips/new">
              <Plus className="h-4 w-4" /> {t("newTrip")}
            </Link>
          </Button>
        </div>
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
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
