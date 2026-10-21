import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CheckSquare,
  Clock,
  Compass,
  DownloadCloud,
  MapPin,
  MapPinned,
  PieChart,
  Plus,
  Receipt,
  Scale,
  Sparkles,
  Users,
  Wallet,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/app/TripCard";
import { Money, PartyAvatar, StatCard } from "@/components/app/bits";
import { useAppState } from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import { daysUntil, formatDateRange, tripLedger, tripStatus } from "@/lib/trips";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TripMates 2.0" },
      { name: "description", content: "Premium family travel planning, offline maps, itineraries, expenses and settlements." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useAppState();
  const navigate = useNavigate();

  const { currentUser, families, activeFamilyId, activities, checklists, people } = state;
  const currentFamily = families.find((f) => f.id === activeFamilyId) || families[0];

  const liveTrips = state.trips.filter((t) => !t.archived);
  const ongoingTrips = liveTrips.filter((t) => tripStatus(t) === "ongoing");
  const upcomingTrips = liveTrips
    .filter((t) => tripStatus(t) === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const pastTrips = state.trips
    .filter((t) => tripStatus(t) === "completed" || t.archived)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const featuredTrip = ongoingTrips[0] ?? upcomingTrips[0];
  const restUpcoming = upcomingTrips.filter((t) => t.id !== featuredTrip?.id);

  // Financial ledger for active trip
  const [selectedTripId, setSelectedTripId] = useState(featuredTrip?.id ?? state.trips[0]?.id);
  const ledger = useMemo(
    () => (selectedTripId ? tripLedger(state, selectedTripId) : null),
    [state, selectedTripId],
  );

  const myBalance = ledger?.balances.find((b) => b.partyId === currentUser.id)?.net ?? 0;
  const budgetPct =
    ledger && ledger.trip.budget > 0
      ? Math.min(100, Math.round((ledger.total / ledger.trip.budget) * 100))
      : 0;

  // Next upcoming activities for featured trip
  const nextActivities = activities
    .filter((a) => a.tripId === featuredTrip?.id && !a.completed)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3);

  // Pending checklist items for featured trip
  const pendingChecklist = checklists
    .filter((c) => c.tripId === featuredTrip?.id && !c.completed)
    .slice(0, 4);

  // Countdown text
  const countdownDays = featuredTrip ? daysUntil(featuredTrip.startDate) : null;

  return (
    <div className="space-y-8 fade-up">
      {/* PERSONALIZED GREETING & WORKSPACE HERO */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-secondary/40 p-6 shadow-soft">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              {currentFamily?.name || "Family Workspace"}
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
              {currentUser.role.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {featuredTrip
              ? `Next adventure: ${featuredTrip.name} in ${featuredTrip.destination}`
              : "No active trips scheduled. Plan your next family journey."}
          </p>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="rounded-2xl gap-2 font-bold text-xs shadow-soft">
            <Link to="/trips/new">
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
          </Button>
          {featuredTrip && (
            <Button asChild variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card">
              <Link to="/trips/$tripId/map" params={{ tripId: featuredTrip.id }}>
                <MapPinned className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Explore Map
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* FEATURED NEXT TRIP CARD WITH COUNTDOWN */}
      {featuredTrip ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-foreground">Next Upcoming Trip</h2>
              {countdownDays !== null && (
                <span className="rounded-full bg-teal-600 text-white px-2.5 py-0.5 text-xs font-bold shadow-sm">
                  {countdownDays > 0
                    ? `Starts in ${countdownDays} days`
                    : countdownDays === 0
                    ? "Starting today!"
                    : "Happening now"}
                </span>
              )}
            </div>
            <Link
              to="/trips/$tripId"
              params={{ tripId: featuredTrip.id }}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              Full Details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <TripCard trip={featuredTrip} variant="feature" eager />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
          <Compass className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <h2 className="text-lg font-bold text-foreground">No upcoming family trips</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Create your next trip with destinations, maps, schedules, and expense budgets.
          </p>
          <Button asChild className="rounded-2xl">
            <Link to="/trips/new">Plan First Trip</Link>
          </Button>
        </div>
      )}

      {/* QUICK SHORTCUTS GRID */}
      {featuredTrip && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/trips/$tripId/expenses"
            params={{ tripId: featuredTrip.id }}
            search={{ add: true }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-soft hover:bg-secondary/60 transition-all group"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Receipt className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">Add Expense</div>
              <div className="text-[11px] text-muted-foreground truncate">Split fairly with members</div>
            </div>
          </Link>

          <Link
            to="/trips/$tripId/map"
            params={{ tripId: featuredTrip.id }}
            search={{ downloadModal: true }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-soft hover:bg-secondary/60 transition-all group"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <DownloadCloud className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">Offline Maps</div>
              <div className="text-[11px] text-muted-foreground truncate">Download area tiles</div>
            </div>
          </Link>

          <Link
            to="/trips/$tripId/itinerary"
            params={{ tripId: featuredTrip.id }}
            search={{ addActivity: true }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-soft hover:bg-secondary/60 transition-all group"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">Add Activity</div>
              <div className="text-[11px] text-muted-foreground truncate">Schedule daily timeline</div>
            </div>
          </Link>

          <Link
            to="/trips/$tripId/budget"
            params={{ tripId: featuredTrip.id }}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 text-left shadow-soft hover:bg-secondary/60 transition-all group"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <PieChart className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">Trip Budget</div>
              <div className="text-[11px] text-muted-foreground truncate">Analytics & burn rate</div>
            </div>
          </Link>
        </div>
      )}

      {/* FINANCIAL HEALTH & LEDGER OVERVIEW */}
      {ledger && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Expense & Balance Summary</h2>
              <p className="text-xs text-muted-foreground">Integer paise calculations, zero floating-point error</p>
            </div>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="rounded-xl border border-border bg-card py-1.5 px-3 text-xs font-semibold text-foreground"
            >
              {state.trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Trip Total Spent"
              icon={<Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
              value={<Money paise={ledger.total} />}
              hint={`${ledger.expenses.length} verified expenses`}
            />

            <StatCard
              label="Your Net Balance"
              icon={<Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              value={<Money paise={myBalance} signed />}
              hint={myBalance > 0 ? "You are owed" : myBalance < 0 ? "You owe money" : "All settled up"}
            />

            <StatCard
              label="Outstanding Settlements"
              icon={<Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              value={<Money paise={ledger.outstanding} />}
              hint={`${ledger.transfers.length} suggested repayment${ledger.transfers.length === 1 ? "" : "s"}`}
            />

            <StatCard
              label="Budget Utilization"
              icon={<PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              value={`${budgetPct}%`}
              hint={
                ledger.trip.budget > 0
                  ? `${formatINR(Math.max(0, ledger.trip.budget - ledger.total), { compact: true })} remaining`
                  : "No budget cap set"
              }
            />
          </div>
        </section>
      )}

      {/* ITINERARY ACTIVITIES & CHECKLIST DUAL ROW */}
      {featuredTrip && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UPCOMING ACTIVITIES */}
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-display text-sm font-bold text-foreground">Upcoming Itinerary</h3>
                </div>
                <Link
                  to="/trips/$tripId/itinerary"
                  params={{ tripId: featuredTrip.id }}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View timeline →
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {nextActivities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No activities scheduled for this trip yet.
                  </div>
                ) : (
                  nextActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 rounded-2xl border border-border/80 p-3 bg-secondary/30 text-xs"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 font-bold text-[11px]">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-bold text-foreground truncate">{act.title}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {act.startTime}
                          </span>
                        </div>
                        {act.location && (
                          <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {act.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs mt-4">
              <Link to="/trips/$tripId/itinerary" params={{ tripId: featuredTrip.id }}>
                Open Full Itinerary Planner
              </Link>
            </Button>
          </div>

          {/* CHECKLIST REMINDERS */}
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display text-sm font-bold text-foreground">Checklist & Bookings</h3>
                </div>
                <Link
                  to="/trips/$tripId/checklist"
                  params={{ tripId: featuredTrip.id }}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View all items →
                </Link>
              </div>

              <div className="mt-3 space-y-2">
                {pendingChecklist.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    All checklist items are completed! Great job.
                  </div>
                ) : (
                  pendingChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-border/80 p-3 bg-secondary/30 text-xs"
                    >
                      <span className="font-medium text-foreground truncate mr-2">{item.title}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0 capitalize">
                        {item.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs mt-4">
              <Link to="/trips/$tripId/checklist" params={{ tripId: featuredTrip.id }}>
                Manage Trip Checklists
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* OTHER UPCOMING TRIPS & PAST TRIPS */}
      {restUpcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Other Upcoming Trips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restUpcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {pastTrips.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Completed Trips</h2>
            <Link to="/trips" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              View all trips ({state.trips.length})
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastTrips.slice(0, 3).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
