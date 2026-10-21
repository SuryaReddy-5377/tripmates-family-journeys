import { createFileRoute } from "@tanstack/react-router";
import { useAppState } from "@/lib/store";
import { TripBudgetView } from "@/components/budget/TripBudgetView";

export const Route = createFileRoute("/_app/trips/$tripId/budget")({
  head: () => ({
    meta: [
      { title: "Trip Budget & Analytics — TripMates 2.0" },
      { name: "description", content: "Trip budget progress, burn rate, category breakdowns, and member analytics." },
    ],
  }),
  component: TripBudgetRoute,
});

function TripBudgetRoute() {
  const { tripId } = Route.useParams();
  const { trips } = useAppState();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) return null;

  return (
    <div className="fade-up">
      <TripBudgetView trip={trip} />
    </div>
  );
}
