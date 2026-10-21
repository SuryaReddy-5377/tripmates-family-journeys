import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Compass,
  DownloadCloud,
  Lock,
  MapPinned,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/photo-family-beach.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripMates 2.0 — Premium Family Travel Planner" },
      {
        name: "description",
        content: "Private family travel planning with offline maps, day-by-day itineraries, and selective paise-based expense splitting.",
      },
      { property: "og:title", content: "TripMates 2.0 — Premium Family Travel Planner" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-950 text-white">
      <img
        src={hero}
        alt="Family vacation"
        width={1024}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="image-scrim absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pb-12 pt-8 sm:px-8 justify-between">
        {/* LOGO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-slate-800 text-white shadow-soft">
              <MapPinned className="h-6 w-6 text-teal-300" aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold tracking-tight">TripMates</span>
                <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-300 border border-teal-500/30">
                  2.0
                </span>
              </div>
              <span className="block text-xs text-slate-400">Premium Family Planner</span>
            </div>
          </div>

          <Button asChild size="sm" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>

        {/* HERO CONTENT */}
        <div className="my-auto max-w-2xl py-12 fade-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/20 backdrop-blur-md">
            <Lock className="h-3.5 w-3.5" />
            <span>Private Family Workspaces • 25 Members & Relatives</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight">
            Every route, every stop, every rupee — <span className="text-teal-300">together.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Plan multi-family journeys with interactive offline maps, day-by-day itineraries, conflict-free schedules,
            and selective paise-accurate expense settlements.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
            <Button asChild size="lg" className="rounded-2xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-sm shadow-card">
              <Link to="/dashboard">
                Open Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-sm">
              <Link to="/auth" search={{ mode: "register" }}>
                Join with Invite Code
              </Link>
            </Button>
          </div>

          {/* KEY PILLARS */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/10 pt-8 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <DownloadCloud className="h-4 w-4" />
              </span>
              <div>
                <span className="font-bold text-white block">Offline Maps & GPS</span>
                <span className="text-[11px] text-slate-400">Pre-download tiles in IndexedDB</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Receipt className="h-4 w-4" />
              </span>
              <div>
                <span className="font-bold text-white block">Selective Splits</span>
                <span className="text-[11px] text-slate-400">Zero-sum integer paise ledger</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <CalendarCheck className="h-4 w-4" />
              </span>
              <div>
                <span className="font-bold text-white block">Daily Itineraries</span>
                <span className="text-[11px] text-slate-400">Timeline & conflict detection</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2 border-t border-white/5 pt-6">
          <span>TripMates 2.0 • Reddy, Rao, Kumar & Varma Families</span>
          <span className="font-mono text-[11px]">v2.0-premium</span>
        </div>
      </div>
    </div>
  );
}
