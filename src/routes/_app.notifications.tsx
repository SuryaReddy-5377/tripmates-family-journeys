import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Info,
  ShieldAlert,
  Trash2,
  Wallet,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppState,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — TripMates 2.0" },
      { name: "description", content: "Trip updates, balance alerts, checklist assignments and sync notices." },
    ],
  }),
  component: NotificationsRoute,
});

const TYPE_ICONS = {
  info: Info,
  warning: ShieldAlert,
  success: Sparkles,
  balance: Wallet,
};

function NotificationsRoute() {
  const { notifications } = useAppState();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-up">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}` : "All notifications caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllNotificationsRead}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              onClick={clearNotifications}
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground bg-card">
            <Bell className="mx-auto h-12 w-12 opacity-30 mb-2" />
            <div className="font-semibold text-sm">No notifications</div>
            <div className="text-xs text-muted-foreground mt-1">You're all up to date with trip alerts and settlements.</div>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markNotificationRead(n.id)}
                className={cn(
                  "flex items-start gap-3.5 rounded-2xl border p-4 transition-all shadow-sm bg-card cursor-pointer",
                  !n.read ? "border-teal-500/40 bg-teal-500/5 ring-1 ring-teal-500/20" : "border-border/80 opacity-80",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    n.type === "balance"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : n.type === "warning"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : n.type === "success"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-foreground truncate">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>

                  <div className="mt-2 flex items-center justify-between">
                    {n.linkTo ? (
                      <Link
                        to={n.linkTo as any}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        View details →
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!n.read && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
