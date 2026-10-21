import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Camera, Compass, Home, Images, LogOut, Plus, Receipt, Users, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";
import { tripStatus } from "@/lib/trips";
import { CURRENT_USER_ID, people } from "@/lib/sample-data";
import { PartyAvatar } from "./bits";
import { ResponsiveModal } from "./ResponsiveModal";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/trips", label: "Trips", icon: Compass },
  { to: "/memories", label: "Memories", icon: Images },
  { to: "/family", label: "Family", icon: Users },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <MapPinned className="h-5 w-5" aria-hidden />
      </span>
      <span className="font-display text-xl font-semibold text-foreground">TripMates</span>
    </Link>
  );
}

function useActiveTripId() {
  const { trips } = useAppState();
  const live = trips.filter((t) => !t.archived);
  const ongoing = live.find((t) => tripStatus(t) === "ongoing");
  const upcoming = live
    .filter((t) => tripStatus(t) === "upcoming")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  return (ongoing ?? upcoming ?? live[0])?.id;
}

export function QuickActions({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const tripId = useActiveTripId();
  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };
  const items = [
    { label: "Create a trip", body: "Dates, destination, budget, who's coming", icon: Compass, run: () => navigate({ to: "/trips/new" }) },
    ...(tripId
      ? [
          { label: "Upload photos", body: "Original quality, straight from your phone", icon: Camera, run: () => navigate({ to: "/trips/$tripId/photos", params: { tripId }, search: { upload: true } }) },
          { label: "Add an expense", body: "Split it fairly among the people involved", icon: Receipt, run: () => navigate({ to: "/trips/$tripId/expenses", params: { tripId }, search: { add: true } }) },
        ]
      : []),
  ];
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Quick actions">
      <div className="grid gap-2">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => go(it.run)}
            className="flex min-h-16 items-center gap-4 rounded-2xl border bg-background p-4 text-left transition-colors hover:bg-secondary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <it.icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold text-foreground">{it.label}</span>
              <span className="block text-sm text-muted-foreground">{it.body}</span>
            </span>
          </button>
        ))}
      </div>
    </ResponsiveModal>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const me = people.find((p) => p.id === CURRENT_USER_ID)!;

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <Logo className="px-2" />
        <nav className="mt-8 grid gap-1" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setQuickOpen(true)}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden /> New
        </button>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border bg-card p-3">
          <PartyAvatar id={me.id} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{me.name}</p>
            <p className="text-xs text-muted-foreground">Family admin</p>
          </div>
          <Link to="/" aria-label="Sign out" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur lg:hidden">
        <Logo />
        <Link to="/family" aria-label="Your account">
          <PartyAvatar id={me.id} size="sm" />
        </Link>
      </header>

      <main className="pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-10">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-elevated backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {nav.slice(0, 2).map((item) => (
            <BottomLink key={item.to} {...item} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => setQuickOpen(true)}
              aria-label="Quick actions"
              className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {nav.slice(2).map((item) => (
            <BottomLink key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <QuickActions open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
}

function BottomLink({ to, label, icon: Icon }: (typeof nav)[number]) {
  return (
    <Link
      to={to}
      className="flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
      activeProps={{ className: "text-primary font-semibold" }}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </Link>
  );
}
