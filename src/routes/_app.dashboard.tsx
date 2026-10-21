import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Camera, Compass, Receipt, Wallet, Scale, PiggyBank, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TripCard } from "@/components/app/TripCard";
import { EmptyState, Money, SampleBanner, SectionHeader, StatCard } from "@/components/app/bits";
import { selectClass } from "@/components/app/AddExpenseForm";
import { useAppState } from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import { CURRENT_USER_ID } from "@/lib/sample-data";
import { firstName, tripLedger, tripStatus } from "@/lib/trips";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Home — TripMates" },
      { name: "description", content: "Upcoming trips, recent family photos and who owes what, at a glance." },
      { property: "og:title", content: "Home — TripMates" },
      { property: "og:description", content: "Upcoming trips, recent photos and balances at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useAppState();
  const navigate = useNavigate();
  const live = state.trips.filter((t) => !t.archived);
  const ongoing = live.filter((t) => tripStatus(t) === "ongoing");
  const upcoming = live.filter((t) => tripStatus(t) === "upcoming").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = state.trips.filter((t) => tripStatus(t) === "completed").sort((a, b) => b.startDate.localeCompare(a.startDate));
  const featured = ongoing[0] ?? upcoming[0];
  const restUpcoming = upcoming.filter((t) => t.id !== featured?.id);

  const [selectedTripId, setSelectedTripId] = useState(featured?.id ?? state.trips[0]?.id);
  const ledger = useMemo(() => (selectedTripId ? tripLedger(state, selectedTripId) : null), [state, selectedTripId]);
  const myBalance = ledger?.balances.find((b) => b.partyId === CURRENT_USER_ID)?.net ?? 0;
  const budgetPct = ledger && ledger.trip.budget > 0 ? Math.min(100, Math.round((ledger.total / ledger.trip.budget) * 100)) : 0;

  const recentPhotos = state.photos.slice().sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 6);
  const tripName = (id: string) => state.trips.find((t) => t.id === id)?.name ?? "";

  return (
    <div className="grid gap-8 fade-up">
      <div className="grid gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Namaste,</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{firstName(CURRENT_USER_ID)}</h1>
        </div>
        <SampleBanner />
      </div>

      {featured ? (
        <TripCard trip={featured} variant="feature" eager />
      ) : (
        <EmptyState icon={<Compass />} title="No trips planned yet" body="Start the next family adventure." action={<Button asChild><Link to="/trips/new">Create a trip</Link></Button>} />
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: "New trip", icon: Compass, run: () => navigate({ to: "/trips/new" }) },
          { label: "Upload photos", icon: Camera, run: () => featured && navigate({ to: "/trips/$tripId/photos", params: { tripId: featured.id }, search: { upload: true } }) },
          { label: "Add expense", icon: Receipt, run: () => featured && navigate({ to: "/trips/$tripId/expenses", params: { tripId: featured.id }, search: { add: true } }) },
        ].map((a) => (
          <button key={a.label} onClick={a.run} className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-2 py-4 text-center shadow-soft transition-colors hover:bg-secondary">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <a.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-xs font-semibold text-foreground sm:text-sm">{a.label}</span>
          </button>
        ))}
      </div>

      {ledger && (
        <section aria-labelledby="money-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h2 id="money-heading" className="text-xl font-semibold text-foreground">Money</h2>
            <label className="w-full sm:w-64">
              <span className="sr-only">Trip</span>
              <select className={selectClass} value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
                {state.trips.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total spent" icon={<Wallet />} value={<Money paise={ledger.total} />} hint={`${ledger.expenses.length} expenses`} />
            <StatCard
              label="Your balance"
              icon={<Scale />}
              value={<Money paise={myBalance} signed />}
              hint={myBalance > 0 ? "You are owed" : myBalance < 0 ? "You owe" : "All settled"}
            />
            <StatCard label="Outstanding" icon={<Receipt />} value={<Money paise={ledger.outstanding} />} hint={`${ledger.transfers.length} repayment${ledger.transfers.length === 1 ? "" : "s"} to settle`} />
            <StatCard
              label="Budget used"
              icon={<PiggyBank />}
              value={<span className="tabular font-semibold">{budgetPct}%</span>}
              hint={<Progress value={budgetPct} className="mt-1 h-1.5" aria-label={`of ${formatINR(ledger.trip.budget, { compact: true })}`} />}
            />
          </div>
          <Link to="/trips/$tripId/expenses" params={{ tripId: ledger.trip.id }} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            See balances & settle up <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {restUpcoming.length > 0 && (
        <section>
          <SectionHeader title="Coming up" action={<Link to="/trips" className="text-sm font-semibold text-accent">All trips</Link>} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0">
            {restUpcoming.map((t) => (
              <div key={t.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
                <TripCard trip={t} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Recent photos" action={<Link to="/memories" className="text-sm font-semibold text-accent">All memories</Link>} />
        {recentPhotos.length === 0 ? (
          <EmptyState icon={<Images />} title="No photos yet" body="Photos uploaded to any trip show up here." />
        ) : (
          <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
            {recentPhotos.map((p) => (
              <li key={p.id}>
                <Link to="/trips/$tripId/photos" params={{ tripId: p.tripId }} search={{}} className="block aspect-square overflow-hidden rounded-xl bg-muted" title={tripName(p.tripId)}>
                  {p.src && <img src={p.src} alt={p.caption ?? ""} loading="lazy" decoding="async" width={240} height={240} className="h-full w-full object-cover" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader title="Past trips & memories" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
