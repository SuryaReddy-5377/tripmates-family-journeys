import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Building,
  Check,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PartyAvatar } from "@/components/app/bits";
import { useAppState, addMember } from "@/lib/store";
import type { Person, Role } from "@/lib/types";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";

export const Route = createFileRoute("/_app/family")({
  head: () => ({
    meta: [
      { title: "Family Members & Workspaces — TripMates 2.0" },
      { name: "description", content: "Family workspaces, relatives, roles, and invitation codes." },
      { property: "og:title", content: "Family Members — TripMates 2.0" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FamilyPage,
});

const roleMeta: Record<Role, { label: string; variant: "default" | "upcoming" | "secondary" }> = {
  super_admin: { label: "Super Admin", variant: "default" },
  family_admin: { label: "Family Admin", variant: "default" },
  organizer: { label: "Trip Organizer", variant: "upcoming" },
  member: { label: "Member", variant: "secondary" },
};

function FamilyPage() {
  const { currentUser, families, people, activeFamilyId } = useAppState();
  const currentFamily = families.find((f) => f.id === activeFamilyId) || families[0];

  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Role>("member");
  const [targetFamilyId, setTargetFamilyId] = useState(currentFamily.id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentFamily.inviteCode);
    setCopied(true);
    toast.success("Family invite code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert("Name and email are required");
      return;
    }
    const id = newMemberName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const person: Person = {
      id,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      familyId: targetFamilyId,
      role: newMemberRole,
      relation: newMemberRelation.trim() || undefined,
    };
    addMember(person);
    toast.success(`Added ${person.name} to family`);
    setInviteModalOpen(false);
    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRelation("");
  };

  return (
    <div className="grid gap-6 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Family Members</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {people.length} family members across {families.length} extended households
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="rounded-xl gap-2 font-bold text-xs">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* INVITATION CODE CARD */}
      <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-primary to-slate-900 text-white p-6 shadow-card">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-300 shadow-soft">
            <KeyRound className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-teal-300 uppercase tracking-wider">
                {currentFamily.name} Invitation Code
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Share this code privately with relatives so they can register and automatically link to your family workspace.
            </p>
            <div className="mt-3 font-mono text-2xl font-bold tracking-widest text-white">
              {revealed ? currentFamily.inviteCode : "••••••••••••"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button
            size="sm"
            onClick={() => setRevealed((r) => !r)}
            className="rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20"
          >
            {revealed ? "Hide Code" : "Reveal Code"}
          </Button>
          <Button
            size="sm"
            onClick={handleCopyCode}
            className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
        </div>
      </section>

      {/* HOUSEHOLDS LIST */}
      <div className="grid gap-6 lg:grid-cols-2">
        {families.map((f) => {
          const members = people.filter((p) => p.familyId === f.id);
          const isSelected = f.id === activeFamilyId;
          return (
            <section
              key={f.id}
              className={cn(
                "rounded-3xl border p-5 bg-card shadow-soft space-y-4",
                isSelected ? "border-teal-500/50 ring-1 ring-teal-500/30" : "border-border/80",
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-foreground">{f.name}</h2>
                    {isSelected && (
                      <span className="rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {f.city} • {members.length} relatives
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTargetFamilyId(f.id);
                    setInviteModalOpen(true);
                  }}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>

              <ul className="space-y-2">
                {members.map((p) => (
                  <li
                    key={p.id}
                    className="flex min-h-12 items-center gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-3.5 py-2 hover:bg-secondary/40 transition-colors"
                  >
                    <PartyAvatar name={p.name} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">
                        {p.name}
                        {p.id === currentUser.id && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.relation ?? p.email}</p>
                    </div>
                    <Badge variant={roleMeta[p.role]?.variant || "secondary"} className="rounded-lg text-[10px] font-bold">
                      {roleMeta[p.role]?.label || p.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* ROLE PERMISSIONS EXPLANATION */}
      <section className="rounded-3xl border border-border/80 bg-card p-5 text-xs shadow-soft space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>Role Permissions Matrix</span>
        </div>
        <ul className="grid gap-2 text-muted-foreground sm:grid-cols-2">
          <li className="rounded-xl border border-border/60 p-2.5 bg-secondary/30">
            <strong className="text-foreground block font-bold mb-0.5">Super Admin</strong>
            Master console access, cross-family oversight, workspace suspension, and immutable ledger corrections.
          </li>
          <li className="rounded-xl border border-border/60 p-2.5 bg-secondary/30">
            <strong className="text-foreground block font-bold mb-0.5">Family Admin</strong>
            Manages family relatives, roles, workspace invite codes, and default preferences.
          </li>
          <li className="rounded-xl border border-border/60 p-2.5 bg-secondary/30">
            <strong className="text-foreground block font-bold mb-0.5">Trip Organizer</strong>
            Creates trips, invites participants, manages itineraries and route stops.
          </li>
          <li className="rounded-xl border border-border/60 p-2.5 bg-secondary/30">
            <strong className="text-foreground block font-bold mb-0.5">Member</strong>
            RSVPs to trips, views offline maps, records shared expenses, and settles repayments.
          </li>
        </ul>
      </section>

      {/* ADD MEMBER MODAL */}
      <ResponsiveModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} title="Add Family Relative">
        <div className="grid gap-3.5 p-1 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Full Name *</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="e.g. Rohini Reddy"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Email Address *</label>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="e.g. rohini@example.com"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Family Workspace</label>
              <select
                value={targetFamilyId}
                onChange={(e) => setTargetFamilyId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                {families.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as Role)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                <option value="member">Member</option>
                <option value="organizer">Trip Organizer</option>
                <option value="family_admin">Family Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Relationship (optional)</label>
            <input
              type="text"
              value={newMemberRelation}
              onChange={(e) => setNewMemberRelation(e.target.value)}
              placeholder="e.g. Cousin, Aunt, Grandfather"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <Button onClick={handleAddMember} className="w-full rounded-xl mt-2 font-bold text-xs">
            Save Family Member
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
