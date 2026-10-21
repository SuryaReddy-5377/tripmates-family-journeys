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

export function PartyAvatar({ id, size = "md", className }: { id: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const party = getParty(id);
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <span
      title={party.name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold ring-2 ring-card",
        toneFor(id),
        sz,
        className,
      )}
    >
      {party.kind === "family" ? <Users className="h-[45%] w-[45%]" aria-hidden /> : initials(party.name)}
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
    <Badge variant={onImage ? "onImage" : status}>
      {status === "ongoing" && <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />}
      {statusLabel[status]}
    </Badge>
  );
}

export function Money({ paise, signed, className }: { paise: Paise; signed?: boolean; className?: string }) {
  const tone = !signed ? "" : paise > 0 ? "text-success" : paise < 0 ? "text-destructive" : "text-muted-foreground";
  const text = signed && paise > 0 ? `+${formatINR(paise)}` : formatINR(paise);
  return <span className={cn("tabular font-semibold", tone, className)}>{text}</span>;
}

export function SectionHeader({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">{icon}</div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {icon && <span className="text-accent [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      </div>
      <div className="mt-2 text-xl text-foreground sm:text-2xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function SampleBanner() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs text-foreground">
      <strong className="font-semibold">Preview mode:</strong> sample family data. Changes you make stay until you refresh the page.
    </div>
  );
}
