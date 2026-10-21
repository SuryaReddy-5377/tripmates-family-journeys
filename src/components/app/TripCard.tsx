import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntil, formatDateRange, tripStatus } from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { AvatarStack, StatusBadge } from "./bits";

export function TripCard({ trip, variant = "default", eager }: { trip: Trip; variant?: "default" | "feature"; eager?: boolean }) {
  const status = tripStatus(trip);
  const going = trip.participants.filter((p) => p.rsvp === "going").map((p) => p.partyId);
  const until = daysUntil(trip.startDate);
  return (
    <Link
      to="/trips/$tripId"
      params={{ tripId: trip.id }}
      className={cn(
        "group relative block overflow-hidden rounded-3xl bg-card shadow-card transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring",
        variant === "feature" ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[4/3]",
      )}
    >
      {trip.cover ? (
        <img
          src={trip.cover}
          alt=""
          width={1280}
          height={832}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="hero-navy absolute inset-0" />
      )}
      <div className="image-scrim absolute inset-0" />
      <div className="absolute left-4 top-4 flex gap-2">
        <StatusBadge status={status} onImage />
        {trip.archived && <span className="rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur">Archived</span>}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-on-image">
        {status === "upcoming" && until > 0 && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-90">In {until} days</p>
        )}
        <h3 className={cn("font-display font-semibold leading-tight", variant === "feature" ? "text-3xl sm:text-4xl" : "text-2xl")}>
          {trip.name}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-95">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden /> {trip.destination}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden /> {formatDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>
        <div className="mt-3">
          <AvatarStack ids={going} />
        </div>
      </div>
    </Link>
  );
}
