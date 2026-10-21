import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/bits";
import { useAppState } from "@/lib/store";
import { formatDateRange, tripStatus } from "@/lib/trips";

export const Route = createFileRoute("/_app/trips/$tripId")({
  head: () => ({
    meta: [
      { title: "Trip — TripMates" },
      { name: "description", content: "Trip details, participants, photos and expenses." },
      { property: "og:title", content: "Trip — TripMates" },
      { property: "og:description", content: "Trip details, photos and expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Trip not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">It doesn't exist, or you're not one of its participants.</p>
        <Button asChild className="mt-6"><Link to="/trips">Back to trips</Link></Button>
      </div>
    );
  }

  const status = tripStatus(trip);
  const tabs = [
    { to: "/trips/$tripId" as const, label: "Overview", exact: true },
    { to: "/trips/$tripId/photos" as const, label: "Photos", exact: false },
    { to: "/trips/$tripId/expenses" as const, label: "Expenses", exact: false },
  ];

  return (
    <div className="grid gap-5">
      <div className="relative -mx-4 -mt-5 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
        {trip.cover ? (
          <img src={trip.cover} alt="" width={1280} height={832} className="h-52 w-full object-cover sm:h-64" />
        ) : (
          <div className="hero-navy h-52 sm:h-64" />
        )}
        <div className="image-scrim absolute inset-0" />
        <Link to="/trips" aria-label="Back to trips" className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-foreground backdrop-blur">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-5 text-on-image">
          <div className="mb-2 flex gap-2">
            <StatusBadge status={status} onImage />
            {trip.archived && <span className="rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold text-foreground">Archived</span>}
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{trip.name}</h1>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-95">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{trip.destination}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden />{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
        </div>
      </div>

      <nav className="sticky top-14 z-20 -mx-4 border-b bg-background/90 px-4 backdrop-blur lg:top-0 sm:mx-0 sm:px-0" aria-label="Trip sections">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              params={{ tripId }}
              activeOptions={{ exact: t.exact, includeSearch: false }}
              className="relative flex h-12 items-center px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="fade-up" key={tripId}>
        <Outlet />
      </div>
    </div>
  );
}
