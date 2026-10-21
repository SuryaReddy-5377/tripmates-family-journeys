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
import { useTranslation } from "@/lib/i18n";
import { DestinationWeatherCard } from "@/components/weather/DestinationWeatherCard";

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
  const { t } = useTranslation();
  const state = useAppState();
  const navigate = useNavigate();

  const { currentUser, families, activeFamilyId, activities, checklists, people, stops } = state;
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
  const featuredTripStops = featuredTrip ? stops.filter((s) => s.tripId === featuredTrip.id) : [];

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
            {t("welcomeGreeting")}, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {featuredTrip
              ? `${t("upcomingTrip")}: ${featuredTrip.name} in ${featuredTrip.destination}`
              : t("noUpcomingTrips")}
          </p>
        </div>

        {/* QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="rounded-2xl gap-2 font-bold text-xs shadow-soft">
            <Link to="/trips/new">
              <Plus className="h-4 w-4" />
              {t("createTripBtn")}
            </Link>
          </Button>
          {featuredTrip && (
            <Button asChild variant="outline" className="rounded-2xl gap-2 font-bold text-xs bg-card">
              <Link to="/trips/$tripId/map" params={{ tripId: featuredTrip.id }}>
                <MapPinned className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                {t("openMapBtn")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* FEATURED NEXT TRIP CARD WITH COUNTDOWN & WEATHER */}
      {featuredTrip ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-foreground">{t("upcomingTrip")}</h2>
                {countdownDays !== null && (
                  <span className="rounded-full bg-teal-600 text-white px-2.5 py-0.5 text-xs font-bold shadow-sm">
                    {countdownDays > 0
                      ? `${countdownDays} ${t("countdownDays")}`
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
                {t("viewSummaryOnly")} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <TripCard trip={featuredTrip} variant="feature" eager />
          </div>

          <div className="space-y-4">
            <DestinationWeatherCard
              destination={featuredTrip.destination}
              lat={featuredTripStops[0]?.lat}
              lng={featuredTripStops[0]?.lng}
            />

            {/* QUICK SHORTCUTS */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/trips/$tripId/expenses"
                params={{ tripId: featuredTrip.id }}
                search={{ add: true }}
                className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-3.5 hover:bg-secondary/60 transition-all shadow-soft group"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Receipt className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground">{t("addExpenseBtn")}</div>
                  <div className="text-[10px] text-muted-foreground truncate">Split fairly</div>
                </div>
              </Link>

              <Link
                to="/trips/$tripId/map"
                params={{ tripId: featuredTrip.id }}
                search={{ downloadModal: true }}
                className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-3.5 hover:bg-secondary/60 transition-all shadow-soft group"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <DownloadCloud className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground">{t("offlineMaps")}</div>
                  <div className="text-[10px] text-muted-foreground truncate">Save area tiles</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
          <Compass className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <h2 className="text-lg font-bold text-foreground">{t("noUpcomingTrips")}</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            {t("dashboardSubtitle")}
          </p>
          <Button asChild className="rounded-2xl">
            <Link to="/trips/new">{t("planTripNow")}</Link>
          </Button>
        </div>
      )}

      {/* FINANCIAL HEALTH & LEDGER OVERVIEW */}
      {ledger && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{t("expensesTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("expensesSubtitle")}</p>
            </div>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="rounded-xl border border-border bg-card py-1.5 px-3 text-xs font-semibold text-foreground cursor-pointer"
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
              label={t("totalTripSpent")}
              icon={<Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />}
              value={<Money paise={ledger.total} />}
              hint={`${ledger.expenses.length} verified expenses`}
            />

            <StatCard
              label={t("outstandingBalance")}
              icon={<Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              value={<Money paise={myBalance} signed />}
              hint={myBalance > 0 ? t("youAreOwed") : myBalance < 0 ? t("youOwe") : t("settledUp")}
            />

            <StatCard
              label="Outstanding Settlements"
              icon={<Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              value={<Money paise={ledger.outstanding} />}
              hint={`${ledger.transfers.length} suggested repayment${ledger.transfers.length === 1 ? "" : "s"}`}
            />

            <StatCard
              label={t("budgetUtilization")}
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
                  <h3 className="font-display text-sm font-bold text-foreground">{t("upcomingActivities")}</h3>
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
                    {t("noUpcomingActivities")}
                  </div>
                ) : (
                  nextActivities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[10px]">
                          {act.startTime}
                        </span>
                        <div>
                          <div className="font-bold text-foreground">{act.title}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {act.startTime}
                            </span>
                            {act.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {act.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        {act.bookingStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border/80 mt-4">
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold">
                <Link to="/trips/$tripId/itinerary" params={{ tripId: featuredTrip.id }} search={{ addActivity: true }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("addActivityBtn")}
                </Link>
              </Button>
            </div>
          </div>

          {/* PENDING CHECKLIST ITEMS */}
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-display text-sm font-bold text-foreground">{t("checklistTitle")}</h3>
                </div>
                <Link
                  to="/trips/$tripId/checklist"
                  params={{ tripId: featuredTrip.id }}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  View checklist →
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {pendingChecklist.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    All packing tasks completed for this trip!
                  </div>
                ) : (
                  pendingChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <div>
                          <div className="font-bold text-foreground">{item.title}</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-semibold">
                            {item.category}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground capitalize">
                        {item.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border/80 mt-4">
              <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold">
                <Link to="/trips/$tripId/checklist" params={{ tripId: featuredTrip.id }} search={{ add: true }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t("addItemBtn")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
