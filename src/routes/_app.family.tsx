import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, KeyRound, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PartyAvatar, SampleBanner } from "@/components/app/bits";
import { CURRENT_USER_ID, families, INVITE_CODE_PREVIEW, people } from "@/lib/sample-data";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/_app/family")({
  head: () => ({
    meta: [
      { title: "Family — TripMates" },
      { name: "description", content: "Family groups, members, roles and the invitation code." },
      { property: "og:title", content: "Family — TripMates" },
      { property: "og:description", content: "Family groups, members and roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FamilyPage,
});

const roleMeta: Record<Role, { label: string; variant: "default" | "upcoming" | "secondary" }> = {
  family_admin: { label: "Family admin", variant: "default" },
  organizer: { label: "Trip organizer", variant: "upcoming" },
  member: { label: "Member", variant: "secondary" },
};

function FamilyPage() {
  const me = people.find((p) => p.id === CURRENT_USER_ID)!;
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="grid gap-6 fade-up">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Family</h1>
        <p className="text-sm text-muted-foreground">{people.length} members across {families.length} households (sample).</p>
      </div>
      <SampleBanner />

      {me.role === "family_admin" && (
        <section className="hero-navy rounded-3xl p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card/15">
              <KeyRound className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Invitation code</p>
              <p className="text-sm opacity-85">Share privately. New members also need their own email and password — the code alone never grants access.</p>
              <p className="mt-3 font-mono text-xl tracking-widest">{revealed ? "REDDY-7Q4M-26" : INVITE_CODE_PREVIEW}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="onImage" onClick={() => setRevealed((r) => !r)}>{revealed ? "Hide" : "Reveal"}</Button>
            <Button size="sm" variant="onImage" onClick={() => toast.message("Preview mode", { description: "Copying works once codes are stored securely (Phase 2)." })}><Copy /> Copy</Button>
            <Button size="sm" variant="onImage" onClick={() => toast.message("Preview mode", { description: "Regenerating invalidates the old code — available in Phase 2." })}><RefreshCw /> Regenerate</Button>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {families.map((f) => {
          const members = people.filter((p) => p.familyId === f.id);
          return (
            <section key={f.id} className="rounded-3xl border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{f.name}</h2>
                  <p className="text-xs text-muted-foreground">{f.city} · {members.length} members</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toast.message("Preview mode", { description: "Inviting by email arrives in Phase 2." })}>
                  <UserPlus /> Invite
                </Button>
              </div>
              <ul className="grid gap-1">
                {members.map((p) => (
                  <li key={p.id} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/60">
                    <PartyAvatar id={p.id} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {p.name}
                        {p.id === CURRENT_USER_ID && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{p.relation ?? p.email}</p>
                    </div>
                    <Badge variant={roleMeta[p.role].variant}>{roleMeta[p.role].label}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-card p-4 text-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="h-4 w-4 text-success" /> What each role can do</p>
        <ul className="grid gap-1 text-muted-foreground">
          <li><strong className="text-foreground">Family admin</strong> — manages members, roles and the invitation code.</li>
          <li><strong className="text-foreground">Trip organizer</strong> — creates trips, invites people, confirms repayments, corrects expenses.</li>
          <li><strong className="text-foreground">Member</strong> — RSVPs, uploads photos, adds expenses and repayments on their trips.</li>
        </ul>
      </section>
    </div>
  );
}
