import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatINR, type Paise } from "@/lib/ledger";
import { getParty, initials, statusLabel } from "@/lib/trips";
import type { TripStatus } from "@/lib/types";

const avatarTones = [
  "bg-chart-1 text-primary-foreground",
  "bg-chart-2 text-accent-foreground",
  "bg-chart-3 text-navy",
  "bg-chart-4 text-navy",
  "bg-chart-5 text-success-foreground",
  "bg-secondary text-secondary-foreground",
];

function toneFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return avatarTones[h % avatarTones.length];
}

export function PartyAvatar({
  id,
  name,
  size = "md",
  className,
}: {
  id?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const party = id ? getParty(id) : { name: name || "User", kind: "person" as const };
  const displayName = name || party.name;
  const hashKey = id || name || "user";
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <span
      title={displayName}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold ring-2 ring-card",
        toneFor(hashKey),
        sz,
        className,
      )}
    >
      {party.kind === "family" ? <Users className="h-[45%] w-[45%]" aria-hidden /> : initials(displayName)}
    </span>
  );
}

export function AvatarStack({ ids, max = 5 }: { ids: string[]; max?: number }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((id) => (
        <PartyAvatar key={id} id={id} size="sm" />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function StatusBadge({ status, onImage }: { status: TripStatus; onImage?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        onImage && "bg-card/90 text-foreground backdrop-blur",
        !onImage && status === "ongoing" && "bg-success-soft text-success",
        !onImage && status === "upcoming" && "bg-info-soft text-accent",
        !onImage && status === "completed" && "bg-muted text-muted-foreground",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function Money({ paise, signed, className }: { paise: Paise; signed?: boolean; className?: string }) {
  return <span className={cn("tabular", className)}>{formatINR(paise, { compact: false })}</span>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-card p-12 text-center shadow-soft">
      {icon && <span className="mb-3 text-muted-foreground [&_svg]:h-10 [&_svg]:w-10">{icon}</span>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
