import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, ImagePlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/bits";
import { PhotoGallery } from "@/components/app/PhotoGallery";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { UploadPhotos } from "@/components/app/UploadPhotos";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/_app/trips/$tripId/photos")({
  validateSearch: (s: Record<string, unknown>): { upload?: boolean; album?: string } => ({
    upload: s.upload === true || s.upload === "true" ? true : undefined,
    album: typeof s.album === "string" ? s.album : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trip photos — TripMates" },
      { name: "description", content: "Private trip albums with original-quality downloads." },
      { property: "og:title", content: "Trip photos — TripMates" },
      { property: "og:description", content: "Private albums with original-quality downloads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripPhotos,
});

function TripPhotos() {
  const { tripId } = Route.useParams();
  const { upload, album } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { trips, photos } = useAppState();
  const trip = trips.find((t) => t.id === tripId)!;
  const [uploadKey, setUploadKey] = useState(0);

  const tripPhotos = photos.filter((p) => p.tripId === tripId);
  const albums = Array.from(new Set(tripPhotos.map((p) => p.album)));
  const shown = album ? tripPhotos.filter((p) => p.album === album) : tripPhotos;

  const setUpload = (open: boolean) => {
    if (open) setUploadKey((k) => k + 1);
    navigate({ search: (s) => ({ ...s, upload: open ? true : undefined }), replace: true });
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[undefined, ...albums].map((a) => (
            <button
              key={a ?? "__all"}
              onClick={() => navigate({ search: (s) => ({ ...s, album: a }), replace: true })}
              className={cn(
                "h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                album === a ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary",
              )}
            >
              {a ?? "All"}
            </button>
          ))}
        </div>
        <Button onClick={() => setUpload(true)}>
          <ImagePlus /> Upload
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden /> Visible only to people on this trip. Downloads return the exact original file.
      </p>

      {shown.length === 0 ? (
        <EmptyState icon={<Camera />} title="No photos yet" body="Upload straight from your phone — full quality is kept." action={<Button onClick={() => setUpload(true)}>Upload photos</Button>} />
      ) : (
        <PhotoGallery photos={shown} />
      )}

      <ResponsiveModal open={!!upload} onOpenChange={setUpload} title="Upload photos" description={`To ${trip.name}`}>
        <UploadPhotos key={uploadKey} trip={trip} onDone={() => setUpload(false)} />
      </ResponsiveModal>
    </div>
  );
}
