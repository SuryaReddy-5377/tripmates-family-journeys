import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Lock, MapPinned, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/photo-family-beach.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripMates — Our family's private trips & memories" },
      { name: "description", content: "Invitation-only space for our family to plan trips, keep original-quality photos and settle expenses fairly." },
      { property: "og:title", content: "TripMates — Our family's private trips & memories" },
      { property: "og:description", content: "Invitation-only: plan trips, keep original photos, settle expenses fairly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-navy text-navy-foreground">
      <img src={hero} alt="" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="image-scrim absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 pb-10 pt-6 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-primary">
            <MapPinned className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold">TripMates</span>
        </div>

        <div className="mt-auto max-w-xl fade-up">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-card/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Private · family invitation only
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">Every trip, every photo, every rupee — together.</h1>
          <p className="mt-4 text-base opacity-90 sm:text-lg">
            Plan our next getaway, keep photos in full original quality, and settle up fairly without the spreadsheet.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="onImage">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="lg" variant="accent">
              <Link to="/auth" search={{ mode: "register" }}>I have an invite code</Link>
            </Button>
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-3 text-xs opacity-90 sm:text-sm">
            <li className="flex items-center gap-2"><Camera className="h-4 w-4 shrink-0" aria-hidden /> Original photos</li>
            <li className="flex items-center gap-2"><Receipt className="h-4 w-4 shrink-0" aria-hidden /> Fair splits</li>
            <li className="flex items-center gap-2"><MapPinned className="h-4 w-4 shrink-0" aria-hidden /> All our trips</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
