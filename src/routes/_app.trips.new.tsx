import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TripForm } from "@/components/app/TripForm";
import { addTrip, newId } from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/sample-data";

export const Route = createFileRoute("/_app/trips/new")({
  head: () => ({
    meta: [
      { title: "New trip — TripMates" },
      { name: "description", content: "Plan a new family trip: dates, destination, budget and who's coming." },
      { property: "og:title", content: "New trip — TripMates" },
      { property: "og:description", content: "Plan a new family trip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewTrip,
});

function NewTrip() {
  const navigate = useNavigate();
  const [requestId] = useState(() => newId("req"));
  return (
    <div className="mx-auto grid max-w-2xl gap-6 fade-up">
      <div>
        <Link to="/trips" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Trips
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Plan a new trip</h1>
        <p className="text-sm text-muted-foreground">Everyone already in the family is listed — no need to register anyone again.</p>
      </div>
      <TripForm
        submitLabel="Create trip"
        onSubmit={(v) => {
          const id = newId("trip");
          addTrip(
            {
              id,
              name: v.name,
              destination: v.destination,
              description: v.description,
              startDate: v.startDate,
              endDate: v.endDate,
              budget: v.budget,
              cover: "",
              organizerId: CURRENT_USER_ID,
              archived: false,
              participants: v.participantIds.map((partyId) => ({ partyId, rsvp: partyId === CURRENT_USER_ID ? "going" : "invited" })),
            },
            requestId,
          );
          toast.success("Trip created", { description: "Invitations will be sent once accounts are live." });
          navigate({ to: "/trips/$tripId", params: { tripId: id } });
        }}
      />
    </div>
  );
}
