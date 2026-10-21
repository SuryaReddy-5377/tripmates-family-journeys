import { createFileRoute } from "@tanstack/react-router";
import { useAppState } from "@/lib/store";
import { TripItineraryView } from "@/components/itinerary/TripItineraryView";

export const Route = createFileRoute("/_app/trips/$tripId/itinerary")({
  validateSearch: (s: Record<string, unknown>): { addActivity?: boolean } => {
    const addActivity = s["addActivity"];
    const out: { addActivity?: boolean } = {};
    if (addActivity === true || addActivity === "true") out.addActivity = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Day-by-Day Itinerary — TripMates 2.0" },
      { name: "description", content: "Daily schedule, timeline, booking references, and schedule conflict warnings." },
    ],
  }),
  component: TripItineraryRoute,
});

function TripItineraryRoute() {
  const { tripId } = Route.useParams();
  const search = Route.useSearch();
  const { trips } = useAppState();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) return null;

  return (
    <div className="fade-up">
      <TripItineraryView trip={trip} initialAddActivity={search.addActivity} />
    </div>
  );
}
