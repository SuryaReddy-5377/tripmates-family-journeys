import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Home,
  Receipt,
  Users,
  MapPinned,
  CalendarCheck,
  PieChart,
  CheckSquare,
  Bell,
  Settings,
  ShieldCheck,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  Building2,
  Menu,
  X,
  MapPin,
  Clock,
  Sparkles,
  DownloadCloud,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppState, switchActiveFamily, syncOfflineQueue, logoutUser } from "@/lib/store";
import { ResponsiveModal } from "./ResponsiveModal";
import { PartyAvatar } from "./bits";
import { useTranslation } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLanguage } = useTranslation();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border/80 bg-secondary/80 p-0.5 text-xs font-semibold shadow-xs select-none",
        className,
      )}
    >
      <button
        onClick={() => setLanguage("en")}
        type="button"
        className={cn(
          "rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
          lang === "en"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("te")}
        type="button"
        className={cn(
          "rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all",
          lang === "te"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        తెలుగు
      </button>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2.5 group", className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-slate-800 text-white shadow-soft group-hover:scale-105 transition-transform">
        <MapPinned className="h-5 w-5 text-teal-300" aria-hidden />
      </span>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">TripMates</span>
          <span className="rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 border border-teal-500/20">
            2.0
          </span>
        </div>
        <span className="block text-[11px] font-medium text-muted-foreground leading-tight">Family Planner</span>
      </div>
    </Link>
  );
}

export function QuickActionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trips } = useAppState();
  const liveTrips = trips.filter((t) => !t.archived);
  const activeTrip = liveTrips[0];

  const go = (path: string, params?: Record<string, string>, search?: Record<string, any>) => {
    onOpenChange(false);
    navigate({ to: path as any, params: params as any, search: search as any });
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={t("quickActions")}>
      <div className="grid gap-2.5 p-1">
        <button
          onClick={() => go("/trips/new")}
          className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-secondary/60 hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Compass className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground text-sm">{t("createTripBtn")}</div>
            <div className="text-xs text-muted-foreground truncate">Destination, dates, budget and invite family</div>
          </div>
        </button>

        {activeTrip && (
          <>
            <button
              onClick={() => go("/trips/$tripId/expenses", { tripId: activeTrip.id }, { add: true })}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-secondary/60 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{t("addExpenseBtn")}</div>
                <div className="text-xs text-muted-foreground truncate">Split fairly for {activeTrip.name}</div>
              </div>
            </button>

            <button
              onClick={() => go("/trips/$tripId/map", { tripId: activeTrip.id }, { addStop: true })}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-secondary/60 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{t("addStop")}</div>
                <div className="text-xs text-muted-foreground truncate">Search place or pin on offline map</div>
              </div>
            </button>

            <button
              onClick={() => go("/trips/$tripId/itinerary", { tripId: activeTrip.id }, { addActivity: true })}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-secondary/60 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{t("addActivityBtn")}</div>
                <div className="text-xs text-muted-foreground truncate">Schedule day event with timing & booking</div>
              </div>
            </button>

            <button
              onClick={() => go("/trips/$tripId/map", { tripId: activeTrip.id }, { downloadModal: true })}
              className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 text-left transition-all hover:bg-secondary/60 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <DownloadCloud className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">{t("offlineMaps")}</div>
                <div className="text-xs text-muted-foreground truncate">Save area tiles for navigation without Wi-Fi</div>
              </div>
            </button>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [quickOpen, setQuickOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { currentUser, families, activeFamilyId, notifications, isOnline, pendingOfflineActionsCount, trips } = useAppState();

  const navigate = useNavigate();
  const currentFamily = families.find((f) => f.id === activeFamilyId) || families[0];
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const activeTrip = trips.filter((t) => !t.archived)[0];

  const handleSignOut = () => {
    logoutUser();
    toast.success("Signed out successfully");
    navigate({ to: "/auth" });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  const navItems = [
    { to: "/dashboard", label: t("navDashboard"), icon: Home },
    { to: "/trips", label: t("navTrips"), icon: Compass },
    {
      to: "/map",
      label: t("navMap"),
      icon: MapPinned,
      badge: "Offline",
    },
    {
      to: activeTrip ? `/trips/${activeTrip.id}/itinerary` : "/trips",
      label: t("navItinerary"),
      icon: CalendarCheck,
    },
    {
      to: activeTrip ? `/trips/${activeTrip.id}/expenses` : "/trips",
      label: t("navExpenses"),
      icon: Receipt,
    },
    {
      to: activeTrip ? `/trips/${activeTrip.id}/budget` : "/trips",
      label: t("navBudget"),
      icon: PieChart,
    },
    {
      to: activeTrip ? `/trips/${activeTrip.id}/checklist` : "/trips",
      label: t("navChecklist"),
      icon: CheckSquare,
    },
    { to: "/family", label: t("navFamily"), icon: Users },
    {
      to: "/notifications",
      label: t("navNotifications"),
      icon: Bell,
      count: unreadNotifs,
    },
    { to: "/settings", label: t("navSettings"), icon: Settings },
    ...(currentUser.role === "super_admin"
      ? [{ to: "/admin", label: t("navSuperAdmin"), icon: ShieldCheck, admin: true }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/80 bg-sidebar px-4 py-5 lg:flex select-none">
        <div className="flex items-center justify-between px-1">
          <Logo />
          <LanguageSwitcher />
        </div>

        {/* FAMILY WORKSPACE PICKER */}
        <div className="mt-5 rounded-2xl border border-border/80 bg-card/60 p-2.5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">
            <span>Workspace</span>
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="relative">
            <select
              value={activeFamilyId}
              onChange={(e) => switchActiveFamily(e.target.value)}
              className="w-full appearance-none rounded-xl bg-secondary/80 py-2 pl-3 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50 cursor-pointer"
            >
              {families.map((fam) => (
                <option key={fam.id} value={fam.id}>
                  {fam.name} ({fam.city})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* QUICK ACTION BUTTON */}
        <button
          onClick={() => setQuickOpen(true)}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-soft hover:bg-primary/95 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t("quickActions")}
        </button>

        {/* NAVIGATION LINKS */}
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1 text-xs" aria-label="Main Navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to as any}
              className={cn(
                "flex h-10 items-center justify-between rounded-xl px-3 font-medium transition-colors",
                item.admin
                  ? "text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              activeProps={{
                className: item.admin
                  ? "bg-purple-500/15 text-purple-800 dark:text-purple-200 font-semibold"
                  : "bg-primary/10 text-primary font-semibold border-l-2 border-primary",
              }}
            >
              <span className="flex items-center gap-2.5 truncate">
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[9px] font-bold text-teal-700 dark:text-teal-300">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-destructive-foreground">
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* OFFLINE / SYNC STATUS PILL */}
        <div className="mt-3 rounded-2xl border border-border/80 bg-card p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500",
                )}
              />
              <span className="font-semibold text-foreground">
                {isOnline ? t("online") : t("offline")}
              </span>
            </div>
            {pendingOfflineActionsCount > 0 && (
              <button
                onClick={handleSync}
                disabled={!isOnline || syncing}
                title="Sync offline actions now"
                className="flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
                {pendingOfflineActionsCount} sync
              </button>
            )}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {isOnline
              ? "All changes live & synced"
              : `${pendingOfflineActionsCount} change${pendingOfflineActionsCount === 1 ? "" : "s"} stored locally`}
          </div>
        </div>

        {/* USER PROFILE CARD */}
        <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-3 px-1">
          <Link to="/settings" className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity">
            <PartyAvatar name={currentUser.name} className="h-8 w-8 text-xs shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-foreground">{currentUser.name}</div>
              <div className="truncate text-[10px] text-muted-foreground capitalize">
                {currentUser.role.replace("_", " ")}
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title={t("navSignOut") || "Sign Out"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-md lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
              isOnline
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
            )}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? t("online") : t("offline")}</span>
          </div>

          <button
            onClick={() => setQuickOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft"
            aria-label="Quick Actions"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* MOBILE FULLSCREEN DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/98 p-5 backdrop-blur-lg lg:hidden fade-up">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <Logo />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* FAMILY SWITCHER MOBILE */}
          <div className="mt-4 rounded-xl border border-border/80 bg-card p-3">
            <div className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">{t("switchFamily")}</div>
            <select
              value={activeFamilyId}
              onChange={(e) => {
                switchActiveFamily(e.target.value);
              }}
              className="w-full rounded-lg bg-secondary py-2 px-3 text-sm font-semibold text-foreground border border-border"
            >
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.city})
                </option>
              ))}
            </select>
          </div>

          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to as any}
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-12 items-center justify-between rounded-xl px-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "bg-primary text-primary-foreground" }}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border/80 pt-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PartyAvatar name={currentUser.name} className="h-9 w-9 text-sm" />
                <div>
                  <div className="font-semibold text-sm text-foreground">{currentUser.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{currentUser.role.replace("_", " ")}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  {t("navSettings")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  title="Sign Out"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 px-2 backdrop-blur-md lg:hidden pb-safe"
        aria-label="Mobile Navigation"
      >
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <Home className="h-5 w-5" />
          <span>{t("navDashboard")}</span>
        </Link>

        <Link
          to="/trips"
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <Compass className="h-5 w-5" />
          <span>{t("navTrips")}</span>
        </Link>

        <Link
          to="/map"
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <MapPinned className="h-5 w-5" />
          <span>{t("navMap")}</span>
        </Link>

        <Link
          to={activeTrip ? (`/trips/${activeTrip.id}/expenses` as any) : "/trips"}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          activeProps={{ className: "text-primary font-bold" }}
        >
          <Receipt className="h-5 w-5" />
          <span>{t("navExpenses")}</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span>{t("actions")}</span>
        </button>
      </nav>

      {/* QUICK ACTION MODAL */}
      <QuickActionModal open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}
