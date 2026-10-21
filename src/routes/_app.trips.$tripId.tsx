import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Lock,
  MapPin,
  MapPinned,
  CalendarCheck,
  Receipt,
  PieChart,
  CheckSquare,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/bits";
import { useAppState } from "@/lib/store";
import { formatDateRange, tripStatus } from "@/lib/trips";

export const Route = createFileRoute("/_app/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Trip Details — TripMates 2.0" },
      { name: "description", content: "Trip planning, interactive map, daily itinerary, selective expenses and budget." },
      { property: "og:title", content: "Trip Details — TripMates 2.0" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TripLayout,
});

function TripLayout() {
  const { tripId } = Route.useParams();
  const { trips } = useAppState();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Trip not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been removed, or you're not participating in it.</p>
        <Button asChild className="mt-6">
          <Link to="/trips">Back to all trips</Link>
        </Button>
      </div>
    );
  }

  const status = tripStatus(trip);
  const tabs = [
    { to: "/trips/$tripId" as const, label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/trips/$tripId/map" as const, label: "Map & Route", icon: MapPinned, exact: false },
    { to: "/trips/$tripId/itinerary" as const, label: "Itinerary", icon: CalendarCheck, exact: false },
    { to: "/trips/$tripId/expenses" as const, label: "Expenses", icon: Receipt, exact: false },
    { to: "/trips/$tripId/budget" as const, label: "Budget & Analytics", icon: PieChart, exact: false },
    { to: "/trips/$tripId/checklist" as const, label: "Checklist", icon: CheckSquare, exact: false },
  ];

  return (
    <div className="grid gap-6">
      {/* HERO COVER BANNER */}
      <div className="relative -mx-4 -mt-6 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl border border-border/80 shadow-soft">
        {trip.cover ? (
          <img src={trip.cover} alt={trip.name} width={1280} height={832} className="h-56 w-full object-cover sm:h-72" />
        ) : (
          <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 h-56 sm:h-72" />
        )}
        <div className="image-scrim absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        
        <Link
          to="/trips"
          aria-label="Back to all trips"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white">
          <div className="mb-2.5 flex items-center gap-2">
            <StatusBadge status={status} onImage />
            {trip.archived && (
              <span className="rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-white">
                Archived
              </span>
            )}
            <span className="rounded-full bg-teal-500/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
              TripMates 2.0
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{trip.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-200">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-teal-400" />
              {trip.destination}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-4 w-4 text-teal-400" />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* TRIP NAVIGATION TABS */}
      <nav
        className="sticky top-14 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md lg:top-0 sm:mx-0 sm:px-0"
        aria-label="Trip Sections"
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              params={{ tripId }}
              activeOptions={{ exact: t.exact, includeSearch: false }}
              className="relative flex h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-muted-foreground transition-all hover:text-foreground hover:bg-secondary/60"
              activeProps={{
                className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 hover:text-primary-foreground",
              }}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* TAB CONTENT OUTLET */}
      <div className="fade-up" key={tripId}>
        <Outlet />
      </div>
    </div>
  );
}
