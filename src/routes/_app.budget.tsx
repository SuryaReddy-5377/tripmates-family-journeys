import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppState } from "@/lib/store";
import { PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/budget")({
  head: () => ({
    meta: [
      { title: "Trip Budget & Analytics — TripMates 2.0" },
      { name: "description", content: "Family trip budget, category spending, member contributions and alerts." },
    ],
  }),
  component: GlobalBudgetRoute,
});

function GlobalBudgetRoute() {
  const navigate = useNavigate();
  const { trips } = useAppState();
  const liveTrips = trips.filter((t) => !t.archived);
  const activeTrip = liveTrips[0];

  useEffect(() => {
    if (activeTrip) {
      navigate({
        to: "/trips/$tripId/budget",
        params: { tripId: activeTrip.id },
        replace: true,
      });
    }
  }, [activeTrip, navigate]);

  if (!activeTrip) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
        <PieChart className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-3" />
        <h2 className="text-lg font-bold text-foreground">No active trip found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">Create a trip first to track budget and category analytics.</p>
        <Button asChild className="rounded-xl">
          <Link to="/trips/new">Create Trip</Link>
        </Button>
      </div>
    );
  }

  return null;
}
