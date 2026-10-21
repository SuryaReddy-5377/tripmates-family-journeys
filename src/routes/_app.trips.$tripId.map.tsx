import { createFileRoute } from "@tanstack/react-router";
import { useAppState } from "@/lib/store";
import { TripMapView } from "@/components/map/TripMapView";

export const Route = createFileRoute("/_app/trips/$tripId/map")({
  validateSearch: (s: Record<string, unknown>): { addStop?: boolean; downloadModal?: boolean } => {
    const addStop = s["addStop"];
    const downloadModal = s["downloadModal"];
    const out: { addStop?: boolean; downloadModal?: boolean } = {};
    if (addStop === true || addStop === "true") out.addStop = true;
    if (downloadModal === true || downloadModal === "true") out.downloadModal = true;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Explore Map & Offline Navigation — TripMates 2.0" },
      { name: "description", content: "Interactive map, numbered trip stops, routes, and complete offline map tile downloads." },
    ],
  }),
  component: TripMapRoute,
});

function TripMapRoute() {
  const { tripId } = Route.useParams();
  const search = Route.useSearch();
  const { trips } = useAppState();
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) return null;

  return (
    <div className="fade-up">
      <TripMapView
        trip={trip}
        initialAddStop={search.addStop}
        initialDownloadModal={search.downloadModal}
      />
    </div>
  );
}
