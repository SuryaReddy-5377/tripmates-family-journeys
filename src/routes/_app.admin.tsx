import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  Users,
  Compass,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  Ban,
  RotateCcw,
  Activity,
  History,
  FileCheck,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAppState,
  suspendFamily,
  correctLedgerRecord,
  updateMemberRole,
} from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Super Admin Console — TripMates 2.0" },
      { name: "description", content: "Master administration, family workspaces, ledger correction, audit logs and telemetry." },
    ],
  }),
  component: SuperAdminRoute,
});

function SuperAdminRoute() {
  const { currentUser, families, people, trips, expenses, auditLogs, isOnline } = useAppState();

  const isSuperAdmin = currentUser.role === "super_admin";

  // Active sub-tab
  const [tab, setTab] = useState<"families" | "members" | "trips" | "audit">("families");

  // Search
  const [search, setSearch] = useState("");

  // Ledger Correction Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [details, setDetails] = useState("");
  const [reason, setReason] = useState("");

  // Unauthorized Barrier
  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 text-center fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive mb-4 shadow-soft">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Super Admin Access Denied</h1>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Your current account role is <span className="font-bold text-foreground capitalize">{currentUser.role.replace("_", " ")}</span>.
          Access to master administration, workspace suspensions, and financial correction is restricted to Super Admins.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild className="rounded-xl">
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl text-xs">
            <Link to="/settings">Switch to Admin Persona in Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleApplyCorrection = () => {
    if (!actionTitle.trim() || !details.trim() || !reason.trim()) {
      alert("All fields are required for the administrative audit trail");
      return;
    }
    correctLedgerRecord(actionTitle.trim(), details.trim(), reason.trim());
    toast.success("Administrative ledger correction logged");
    setCorrectionModalOpen(false);
    setActionTitle("");
    setDetails("");
    setReason("");
  };

  const filteredFamilies = families.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.city.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPeople = people.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalTripBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const totalExpensesLogged = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 fade-up">
      {/* HEADER BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 shadow-soft">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-soft">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">Super Admin Console</h1>
              <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white tracking-wider">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Signed in as <span className="font-bold text-foreground">{currentUser.name}</span>. Full multi-family governance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCorrectionModalOpen(true)}
            size="sm"
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Audit Ledger Correction
          </Button>
        </div>
      </div>

      {/* SYSTEM TELEMETRY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border/80 bg-card p-4.5 shadow-soft">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Registered Families</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">{families.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active workspaces</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4.5 shadow-soft">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Family Relatives</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">{people.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active accounts</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4.5 shadow-soft">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Trips Managed</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">{trips.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{formatINR(totalTripBudget)} combined budget</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-4.5 shadow-soft">
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Expenses Logged</div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">{formatINR(totalExpensesLogged)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{expenses.length} records verified</div>
        </div>
      </div>

      {/* ADMIN TABS & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "families", label: "Family Workspaces", count: families.length },
              { id: "members", label: "All Members", count: people.length },
              { id: "trips", label: "Trips Across Families", count: trips.length },
              { id: "audit", label: "Audit Logs", count: auditLogs.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5",
                tab === t.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{t.label}</span>
              <span className="text-[10px] opacity-75">({t.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full rounded-xl border border-input bg-card py-1.5 pl-8 pr-3 text-xs font-medium text-foreground focus:outline-none"
          />
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* TAB 1: FAMILIES */}
      {tab === "families" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFamilies.map((fam) => (
            <div
              key={fam.id}
              className={cn(
                "rounded-3xl border p-5 bg-card shadow-soft flex flex-col justify-between",
                fam.suspended ? "border-destructive/40 bg-destructive/5 opacity-80" : "border-border/80",
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">{fam.name}</h3>
                  {fam.suspended ? (
                    <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-bold">
                      SUSPENDED
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{fam.city}</div>

                <div className="mt-3 text-xs bg-secondary/60 rounded-xl p-2.5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invite Code:</span>
                    <span className="font-mono font-bold text-foreground">{fam.inviteCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-semibold text-foreground">{fam.memberCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-foreground">{new Date(fam.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button
                  onClick={() => suspendFamily(fam.id, !fam.suspended)}
                  variant={fam.suspended ? "outline" : "destructive"}
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  {fam.suspended ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Restore Workspace
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {tab === "members" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-semibold">Name & Email</th>
                <th className="pb-3 font-semibold">Family</th>
                <th className="pb-3 font-semibold">Current Role</th>
                <th className="pb-3 font-semibold text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPeople.map((p) => {
                const fam = families.find((f) => f.id === p.familyId);
                return (
                  <tr key={p.id} className="py-3">
                    <td className="py-3">
                      <div className="font-bold text-foreground">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.email}</div>
                    </td>
                    <td className="py-3 font-medium text-foreground">{fam?.name || p.familyId}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 font-bold uppercase text-[10px] text-foreground">
                        {p.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={p.role}
                        onChange={(e) => updateMemberRole(p.id, e.target.value as any)}
                        className="rounded-xl border border-input bg-background py-1 px-2.5 text-xs font-semibold text-foreground cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="organizer">Organizer</option>
                        <option value="family_admin">Family Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TRIPS */}
      {tab === "trips" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-semibold">Trip Name & Destination</th>
                <th className="pb-3 font-semibold">Family</th>
                <th className="pb-3 font-semibold">Dates</th>
                <th className="pb-3 font-semibold">Budget</th>
                <th className="pb-3 font-semibold">Participants</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {trips.map((t) => {
                const fam = families.find((f) => f.id === t.familyId);
                return (
                  <tr key={t.id} className="py-3">
                    <td className="py-3">
                      <div className="font-bold text-foreground">{t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.destination}</div>
                    </td>
                    <td className="py-3 font-semibold">{fam?.name || "Global"}</td>
                    <td className="py-3 text-muted-foreground">
                      {t.startDate} to {t.endDate}
                    </td>
                    <td className="py-3 font-bold text-foreground">{formatINR(t.budget)}</td>
                    <td className="py-3 font-medium">{t.participants.length} members</td>
                    <td className="py-3 text-right">
                      <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
                        <Link to="/trips/$tripId" params={{ tripId: t.id }}>
                          Inspect
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {tab === "audit" && (
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-3">
          <div className="text-xs font-bold text-foreground">Immutable Administrative Audit Trail</div>
          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="font-bold text-[10px] uppercase text-purple-700 dark:text-purple-300">
                    {log.action}
                  </span>
                </div>
                <div className="mt-0.5 text-foreground">
                  <span className="font-bold">{log.actorName}</span>: {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CORRECTION MODAL */}
      <ResponsiveModal open={correctionModalOpen} onOpenChange={setCorrectionModalOpen} title="Administrative Ledger Correction">
        <div className="grid gap-3.5 p-1 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Action Title *</label>
            <input
              type="text"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="e.g. Reverse accidental double payment"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Correction Details *</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Specify affected expense, parties, and adjusted paise amount"
              className="w-full rounded-xl border border-input bg-background p-2 text-xs font-medium text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Justification / Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. UPI transaction bounced / verified bank statement"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <Button onClick={handleApplyCorrection} className="w-full rounded-xl mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">
            Log Administrative Correction
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
