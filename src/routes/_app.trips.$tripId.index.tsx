import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  Check,
  HelpCircle,
  Pencil,
  X,
  Crown,
  MapPinned,
  CalendarCheck,
  Receipt,
  PieChart,
  CheckSquare,
  ArrowRight,
  DownloadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money, PartyAvatar, SectionHeader, StatCard } from "@/components/app/bits";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { TripForm } from "@/components/app/TripForm";
import { cn } from "@/lib/utils";
import { setRsvp, updateTrip, archiveTrip, useAppState } from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import { daysUntil, getParty, personName, tripLedger, tripStatus } from "@/lib/trips";
import type { Rsvp } from "@/lib/types";

export const Route = createFileRoute("/_app/trips/$tripId/")({
  head: () => ({
    meta: [
      { title: "Trip Overview — TripMates 2.0" },
      { name: "description", content: "Trip itinerary, offline maps, participants, budget and expense splits." },
      { property: "og:title", content: "Trip Overview — TripMates 2.0" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TripOverview,
});

const rsvpMeta: Record<Rsvp, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  going: { label: "Going", variant: "success" },
  maybe: { label: "Maybe", variant: "warning" },
  declined: { label: "Not going", variant: "destructive" },
  invited: { label: "Invited", variant: "secondary" },
};

function TripOverview() {
  const { tripId } = Route.useParams();
  const state = useAppState();
  const [editing, setEditing] = useState(false);
  const ledger = useMemo(() => tripLedger(state, tripId), [state, tripId]);
  const { trip } = ledger;
  const status = tripStatus(trip);
  const me = trip.participants.find((p) => p.partyId === state.currentUser.id);
  const budgetPct = trip.budget > 0 ? Math.round((ledger.total / trip.budget) * 100) : 0;
  const counts = trip.participants.reduce(
    (acc, p) => ({ ...acc, [p.rsvp]: (acc[p.rsvp] ?? 0) + getParty(p.partyId).headcount }),
    {} as Record<Rsvp, number>,
  );

  const tripStopsCount = state.stops.filter((s) => s.tripId === tripId).length;
  const tripActivitiesCount = state.activities.filter((a) => a.tripId === tripId).length;
  const tripChecklistCount = state.checklists.filter((c) => c.tripId === tripId).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] fade-up">
      <div className="grid gap-8">
        {trip.description && <p className="text-base leading-relaxed text-foreground">{trip.description}</p>}

        {/* RSVP CARD */}
        {me && status !== "completed" && (
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
            <p className="font-bold text-foreground text-sm">Are you coming on this trip?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "upcoming" ? `Starts in ${daysUntil(trip.startDate)} days.` : "The trip is happening now."}
            </p>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              {(
                [
                  ["going", "Going", Check],
                  ["maybe", "Maybe", HelpCircle],
                  ["declined", "Can't go", X],
                ] as const
              ).map(([v, l, Icon]) => (
                <Button
                  key={v}
                  variant={me.rsvp === v ? "default" : "outline"}
                  onClick={() => {
                    setRsvp(trip.id, state.currentUser.id, v);
                    toast.success(`Marked as ${l.toLowerCase()}`);
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                  aria-pressed={me.rsvp === v}
                >
                  <Icon className="h-4 w-4" /> {l}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE SHORTCUT CARDS */}
        <section className="space-y-3">
          <SectionHeader title="Trip Planning Hub" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Link
              to="/trips/$tripId/map"
              params={{ tripId }}
              className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-4 hover:bg-secondary/60 transition-all shadow-soft group"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                <MapPinned className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">Interactive Map</span>
                  <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                    Offline Ready
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {tripStopsCount} stops plotted • Turn-by-turn routing
                </p>
              </div>
            </Link>

            <Link
              to="/trips/$tripId/itinerary"
              params={{ tripId }}
              className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-4 hover:bg-secondary/60 transition-all shadow-soft group"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">Day-by-Day Itinerary</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {tripActivitiesCount} scheduled events & booking refs
                </p>
              </div>
            </Link>

            <Link
              to="/trips/$tripId/expenses"
              params={{ tripId }}
              className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-4 hover:bg-secondary/60 transition-all shadow-soft group"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">Selective Expenses</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {ledger.expenses.length} expenses • Accurate paise ledger
                </p>
              </div>
            </Link>

            <Link
              to="/trips/$tripId/checklist"
              params={{ tripId }}
              className="flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card p-4 hover:bg-secondary/60 transition-all shadow-soft group"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <CheckSquare className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">Travel Checklist</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {tripChecklistCount} tasks, bookings and luggage lists
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* PARTICIPANTS LIST */}
        <section>
          <SectionHeader
            title="Participating Members"
            action={<span className="text-xs font-semibold text-muted-foreground">{counts.going ?? 0} members attending</span>}
          />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {trip.participants.map((p) => {
              const party = getParty(p.partyId);
              return (
                <li key={p.partyId} className="flex min-h-14 items-center gap-3 rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 shadow-sm">
                  <PartyAvatar name={party.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {party.name}
                      {p.partyId === state.currentUser.id && <span className="font-normal text-muted-foreground"> (you)</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {party.kind === "family" ? `Family group · ${party.headcount} members` : p.partyId === trip.organizerId ? "Organizer" : "Participant"}
                    </p>
                  </div>
                  {p.partyId === trip.organizerId && <Crown className="h-4 w-4 text-amber-500" aria-label="Organizer" />}
                  <Badge variant={rsvpMeta[p.rsvp].variant} className="rounded-lg text-[10px] font-bold">
                    {rsvpMeta[p.rsvp].label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* ASIDE STATS & CONTROLS */}
      <aside className="grid content-start gap-4">
        <StatCard
          label="Spent so far"
          value={<Money paise={ledger.total} />}
          hint={trip.budget > 0 ? `of ${formatINR(trip.budget, { compact: true })} budget` : "No budget set"}
        />

        {trip.budget > 0 && (
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-muted-foreground">Budget Burn</span>
              <span className={cn("tabular font-bold", budgetPct > 100 ? "text-destructive" : "text-foreground")}>
                {budgetPct}%
              </span>
            </div>
            <Progress value={Math.min(100, budgetPct)} className="h-2 rounded-full" />
          </div>
        )}

        <Button asChild variant="secondary" size="lg" className="rounded-2xl font-bold text-xs shadow-soft">
          <Link to="/trips/$tripId/expenses" params={{ tripId }} search={{}}>
            See Ledger & Balances
          </Link>
        </Button>

        <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs shadow-sm">
          <p className="text-muted-foreground">Organized by</p>
          <p className="font-bold text-foreground mt-0.5">{personName(trip.organizerId)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setEditing(true)} className="rounded-xl text-xs font-semibold gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              archiveTrip(trip.id, !trip.archived);
              toast.success(trip.archived ? "Trip restored" : "Trip archived");
            }}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            {trip.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            {trip.archived ? "Restore" : "Archive"}
          </Button>
        </div>
      </aside>

      {/* EDIT MODAL */}
      <ResponsiveModal open={editing} onOpenChange={setEditing} title="Edit Trip Details">
        <TripForm
          initial={trip}
          submitLabel="Save Changes"
          onSubmit={(v) => {
            const existing = new Map(trip.participants.map((p) => [p.partyId, p.rsvp]));
            updateTrip({
              ...trip,
              name: v.name,
              destination: v.destination,
              description: v.description,
              startDate: v.startDate,
              endDate: v.endDate,
              budget: v.budget,
              participants: v.participantIds.map((id) => ({ partyId: id, rsvp: existing.get(id) ?? "invited" })),
            });
            toast.success("Trip updated");
            setEditing(false);
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
