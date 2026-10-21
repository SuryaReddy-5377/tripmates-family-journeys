import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TripForm } from "@/components/app/TripForm";
import { addTrip, newId, useAppState } from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/sample-data";

export const Route = createFileRoute("/_app/trips/new")({
  head: () => ({
    meta: [
      { title: "Plan New Trip — TripMates 2.0" },
      { name: "description", content: "Plan a family trip: dates, destination, budget, route map and member participants." },
      { property: "og:title", content: "Plan New Trip — TripMates 2.0" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NewTrip,
});

function NewTrip() {
  const navigate = useNavigate();
  const state = useAppState();
  const [requestId] = useState(() => newId("req"));

  return (
    <div className="mx-auto max-w-2xl fade-up">
      <div className="mb-6">
        <Link to="/trips" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Trips
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Plan a New Family Trip</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select destination, travel dates, budget and participating relatives.
        </p>
      </div>

      <TripForm
        submitLabel="Create Trip"
        onSubmit={(v) => {
          const id = newId("trip");
          addTrip(
            {
              id,
              familyId: state.activeFamilyId,
              name: v.name,
              destination: v.destination,
              description: v.description,
              startDate: v.startDate,
              endDate: v.endDate,
              budget: v.budget,
              cover: "",
              organizerId: CURRENT_USER_ID,
              archived: false,
              participants: v.participantIds.map((partyId) => ({
                partyId,
                rsvp: partyId === CURRENT_USER_ID ? "going" : "invited",
              })),
            },
            requestId,
          );
          toast.success("Trip created successfully!");
          navigate({ to: "/trips/$tripId", params: { tripId: id } });
        }}
      />
    </div>
  );
}
