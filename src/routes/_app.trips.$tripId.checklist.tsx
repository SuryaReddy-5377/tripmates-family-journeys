import { createFileRoute } from "@tanstack/react-router";
import { useAppState } from "@/lib/store";
import { TripChecklistView } from "@/components/checklist/TripChecklistView";

export const Route = createFileRoute("/_app/trips/$tripId/checklist")({
  head: () => ({
    meta: [
      { title: "Travel Checklist — TripMates 2.0" },
      { name: "description", content: "Packing lists, bookings, travel tasks and member assignments." },
    ],
  }),
  component: TripChecklistRoute,
});

function TripChecklistRoute() {
  const { tripId } = Route.useParams();
  const { trips } = useAppState();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) return null;

  return (
    <div className="fade-up">
      <TripChecklistView trip={trip} />
    </div>
  );
}
