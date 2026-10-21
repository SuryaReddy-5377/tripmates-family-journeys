import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { EmptyState } from "@/components/app/bits";
import { PhotoGallery } from "@/components/app/PhotoGallery";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/_app/memories")({
  head: () => ({
    meta: [
      { title: "Memories — TripMates" },
      { name: "description", content: "Every family photo from every trip, in one private place." },
      { property: "og:title", content: "Memories — TripMates" },
      { property: "og:description", content: "Every family photo from every trip." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Memories,
});

function Memories() {
  const { trips, photos } = useAppState();
  const [tripId, setTripId] = useState<string | null>(null);
  const withPhotos = trips.filter((t) => photos.some((p) => p.tripId === t.id)).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const shown = tripId ? photos.filter((p) => p.tripId === tripId) : photos;
  return (
    <div className="grid gap-5 fade-up">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Memories</h1>
        <p className="text-sm text-muted-foreground">Only photos from trips you're part of appear here.</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[null, ...withPhotos.map((t) => t.id)].map((id) => (
          <button
            key={id ?? "all"}
            onClick={() => setTripId(id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors",
              tripId === id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary",
            )}
          >
            {id ? trips.find((t) => t.id === id)!.name : "All trips"}
          </button>
        ))}
      </div>
      {shown.length === 0 ? <EmptyState icon={<Images />} title="No photos yet" body="Upload photos from any trip page." /> : <PhotoGallery photos={shown} />}
    </div>
  );
}
