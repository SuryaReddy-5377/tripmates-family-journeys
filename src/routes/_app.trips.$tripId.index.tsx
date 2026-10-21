import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Check, HelpCircle, Pencil, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money, PartyAvatar, SectionHeader, StatCard } from "@/components/app/bits";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { TripForm } from "@/components/app/TripForm";
import { cn } from "@/lib/utils";
import { setRsvp, updateTrip, useAppState } from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import { CURRENT_USER_ID } from "@/lib/sample-data";
import { daysUntil, getParty, personName, tripLedger, tripStatus } from "@/lib/trips";
import type { Rsvp } from "@/lib/types";

export const Route = createFileRoute("/_app/trips/$tripId/")({
  head: () => ({
    meta: [
      { title: "Trip overview — TripMates" },
      { name: "description", content: "Who's going, budget and highlights for this trip." },
      { property: "og:title", content: "Trip overview — TripMates" },
      { property: "og:description", content: "Who's going, budget and highlights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const me = trip.participants.find((p) => p.partyId === CURRENT_USER_ID);
  const photos = state.photos.filter((p) => p.tripId === tripId).slice(0, 4);
  const budgetPct = trip.budget > 0 ? Math.round((ledger.total / trip.budget) * 100) : 0;
  const counts = trip.participants.reduce((acc, p) => ({ ...acc, [p.rsvp]: (acc[p.rsvp] ?? 0) + getParty(p.partyId).headcount }), {} as Record<Rsvp, number>);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-8">
        {trip.description && <p className="text-base leading-relaxed text-foreground">{trip.description}</p>}

        {me && status !== "completed" && (
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <p className="font-semibold text-foreground">Are you coming?</p>
            <p className="text-sm text-muted-foreground">{status === "upcoming" ? `Starts in ${daysUntil(trip.startDate)} days.` : "The trip is happening now."}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                ["going", "Going", Check],
                ["maybe", "Maybe", HelpCircle],
                ["declined", "Can't go", X],
              ] as const).map(([v, l, Icon]) => (
                <Button
                  key={v}
                  variant={me.rsvp === v ? "default" : "outline"}
                  onClick={() => {
                    setRsvp(trip.id, CURRENT_USER_ID, v);
                    toast.success(`Marked as ${l.toLowerCase()}`);
                  }}
                  aria-pressed={me.rsvp === v}
                >
                  <Icon /> {l}
                </Button>
              ))}
            </div>
          </div>
        )}

        <section>
          <SectionHeader
            title="Who's coming"
            action={<span className="text-sm text-muted-foreground">{counts.going ?? 0} people going</span>}
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {trip.participants.map((p) => {
              const party = getParty(p.partyId);
              return (
                <li key={p.partyId} className="flex min-h-14 items-center gap-3 rounded-2xl border bg-card px-3 py-2">
                  <PartyAvatar id={p.partyId} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {party.name}
                      {p.partyId === CURRENT_USER_ID && <span className="font-normal text-muted-foreground"> (you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {party.kind === "family" ? `Family account · ${party.headcount} people` : p.partyId === trip.organizerId ? "Organizer" : "Member"}
                    </p>
                  </div>
                  {p.partyId === trip.organizerId && <Crown className="h-4 w-4 text-warning" aria-label="Organizer" />}
                  <Badge variant={rsvpMeta[p.rsvp].variant}>{rsvpMeta[p.rsvp].label}</Badge>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <SectionHeader title="Photos" action={<Link to="/trips/$tripId/photos" params={{ tripId }} search={{}} className="text-sm font-semibold text-accent">Open album</Link>} />
          {photos.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">No photos yet — they'll appear here once uploaded.</p>
          ) : (
            <ul className="grid grid-cols-4 gap-1.5">
              {photos.map((p) => (
                <li key={p.id} className="aspect-square overflow-hidden rounded-xl bg-muted">
                  {p.src && <img src={p.src} alt={p.caption ?? ""} loading="lazy" width={240} height={240} className="h-full w-full object-cover" />}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-3">
        <StatCard label="Spent so far" value={<Money paise={ledger.total} />} hint={trip.budget > 0 ? `of ${formatINR(trip.budget, { compact: true })} budget` : "No budget set"} />
        {trip.budget > 0 && (
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">Budget used</span>
              <span className={cn("tabular font-semibold", budgetPct > 100 ? "text-destructive" : "text-foreground")}>{budgetPct}%</span>
            </div>
            <Progress value={Math.min(100, budgetPct)} className="h-2" />
          </div>
        )}
        <Button asChild variant="secondary" size="lg">
          <Link to="/trips/$tripId/expenses" params={{ tripId }} search={{}}>See balances</Link>
        </Button>
        <div className="rounded-2xl border bg-card p-4 text-sm">
          <p className="text-muted-foreground">Organised by</p>
          <p className="font-semibold text-foreground">{personName(trip.organizerId)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
          <Button
            variant="outline"
            onClick={() => {
              updateTrip(trip.id, { archived: !trip.archived });
              toast.success(trip.archived ? "Trip restored" : "Trip archived", { description: trip.archived ? undefined : "It stays available under Trips → Archived." });
            }}
          >
            {trip.archived ? <ArchiveRestore /> : <Archive />} {trip.archived ? "Restore" : "Archive"}
          </Button>
        </div>
      </aside>

      <ResponsiveModal open={editing} onOpenChange={setEditing} title="Edit trip">
        <TripForm
          initial={trip}
          submitLabel="Save changes"
          onSubmit={(v) => {
            const existing = new Map(trip.participants.map((p) => [p.partyId, p.rsvp]));
            updateTrip(trip.id, {
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
