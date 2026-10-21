import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppState } from "@/lib/store";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({
    meta: [
      { title: "Shared Expenses — TripMates 2.0" },
      { name: "description", content: "Selective family expense splitting, integer paise ledger, settlements and balances." },
    ],
  }),
  component: GlobalExpensesRoute,
});

function GlobalExpensesRoute() {
  const navigate = useNavigate();
  const { trips } = useAppState();
  const liveTrips = trips.filter((t) => !t.archived);
  const activeTrip = liveTrips[0];

  useEffect(() => {
    if (activeTrip) {
      navigate({
        to: "/trips/$tripId/expenses",
        params: { tripId: activeTrip.id },
        replace: true,
      });
    }
  }, [activeTrip, navigate]);

  if (!activeTrip) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground opacity-40 mb-3" />
        <h2 className="text-lg font-bold text-foreground">No active trip found</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">Create a trip first to split shared expenses.</p>
        <Button asChild className="rounded-xl">
          <Link to="/trips/new">Create Trip</Link>
        </Button>
      </div>
    );
  }

  return null;
}
