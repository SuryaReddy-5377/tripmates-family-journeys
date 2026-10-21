import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bed, Bus, Fuel, MoreHorizontal, ShoppingBag, Ticket, Utensils, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { computeShares, formatINR, LedgerError, parseRupeesToPaise, type SplitMethod } from "@/lib/ledger";
import { addExpense, newId, tripPartyIds } from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/sample-data";
import { categoryLabel, firstName, getParty, todayISO } from "@/lib/trips";
import type { Expense, ExpenseCategory, Trip } from "@/lib/types";
import { PartyAvatar } from "./bits";

export const categoryIcons: Record<ExpenseCategory, typeof Bus> = {
  transport: Bus,
  accommodation: Bed,
  food: Utensils,
  tickets: Ticket,
  fuel: Fuel,
  shopping: ShoppingBag,
  other: MoreHorizontal,
};

export const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Draft {
  description: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  paidBy: string;
  participants: string[];
  split: SplitMethod;
  notes: string;
}

// Keeps unsaved input if the sheet is closed by accident (per trip, this session).
const drafts = new Map<string, Draft>();

export function AddExpenseForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const partyIds = tripPartyIds(trip);
  const [requestId] = useState(() => newId("req"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [d, setD] = useState<Draft>(
    () =>
      drafts.get(trip.id) ?? {
        description: "",
        category: "food",
        amount: "",
        date: todayISO() >= trip.startDate && todayISO() <= trip.endDate ? todayISO() : trip.startDate,
        paidBy: partyIds.includes(CURRENT_USER_ID) ? CURRENT_USER_ID : partyIds[0],
        participants: partyIds,
        split: "equal",
        notes: "",
      },
  );
  const update = (patch: Partial<Draft>) =>
    setD((prev) => {
      const next = { ...prev, ...patch };
      drafts.set(trip.id, next);
      return next;
    });

  const amount = parseRupeesToPaise(d.amount);
  const preview = useMemo(() => {
    if (!amount || d.participants.length === 0) return null;
    try {
      return computeShares({
        id: "preview",
        amount,
        paidBy: d.paidBy,
        participants: d.participants,
        splitMethod: d.split,
        splitValues: d.split === "shares" ? Object.fromEntries(d.participants.map((id) => [id, getParty(id).headcount])) : undefined,
      });
    } catch {
      return null;
    }
  }, [amount, d.participants, d.split, d.paidBy]);

  const toggle = (id: string) =>
    update({ participants: d.participants.includes(id) ? d.participants.filter((p) => p !== id) : [...d.participants, id] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (!d.description.trim()) return setError("Add a short description.");
    if (!amount) return setError("Enter a valid amount, e.g. 1250 or 1250.50");
    if (d.participants.length === 0) return setError("Select who shared this expense.");
    setSaving(true);
    const expense: Expense = {
      id: newId("exp"),
      tripId: trip.id,
      description: d.description.trim().slice(0, 120),
      category: d.category,
      amount,
      date: d.date,
      paidBy: d.paidBy,
      participants: d.participants,
      splitMethod: d.split,
      splitValues: d.split === "shares" ? Object.fromEntries(d.participants.map((id) => [id, getParty(id).headcount])) : undefined,
      notes: d.notes.trim() || undefined,
      hasReceipt: !!receipt,
      createdBy: CURRENT_USER_ID,
      createdAt: new Date().toISOString(),
    };
    await new Promise((r) => setTimeout(r, 350));
    try {
      addExpense(expense, requestId);
      drafts.delete(trip.id);
      toast.success("Expense added", { description: `${formatINR(amount)} split among ${d.participants.length}` });
      onDone();
    } catch (err) {
      setError(err instanceof LedgerError || err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="exp-desc">What was it for?</Label>
        <Input id="exp-desc" className="h-11 rounded-xl" placeholder="e.g. Dinner at Chokhi Dhani" value={d.description} maxLength={120} onChange={(e) => update({ description: e.target.value })} />
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Category</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabel) as ExpenseCategory[]).map((c) => {
            const Icon = categoryIcons[c];
            const active = d.category === c;
            return (
              <button
                type="button"
                key={c}
                onClick={() => update({ category: c })}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden /> {categoryLabel[c]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="exp-amount">Amount (₹)</Label>
          <Input id="exp-amount" inputMode="decimal" autoComplete="off" className="tabular h-11 rounded-xl text-base" placeholder="0.00" value={d.amount} onChange={(e) => update({ amount: e.target.value })} aria-invalid={d.amount !== "" && !amount} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="exp-date">Date</Label>
          <Input id="exp-date" type="date" className="h-11 rounded-xl" value={d.date} onChange={(e) => update({ date: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="exp-payer">Paid by</Label>
        <select id="exp-payer" className={selectClass} value={d.paidBy} onChange={(e) => update({ paidBy: e.target.value })}>
          {partyIds.map((id) => (
            <option key={id} value={id}>
              {getParty(id).name}
              {id === CURRENT_USER_ID ? " (you)" : ""}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="grid gap-2">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium text-foreground">Split between</legend>
          <div className="flex gap-1 text-xs">
            <button type="button" className="rounded-md px-2 py-1 font-semibold text-accent hover:bg-secondary" onClick={() => update({ participants: partyIds })}>All</button>
            <button type="button" className="rounded-md px-2 py-1 font-semibold text-muted-foreground hover:bg-secondary" onClick={() => update({ participants: [] })}>None</button>
          </div>
        </div>
        <div className="grid gap-1.5">
          {partyIds.map((id) => {
            const on = d.participants.includes(id);
            return (
              <label key={id} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 transition-colors", on ? "border-accent/40 bg-info-soft" : "bg-card")}>
                <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={on} onChange={() => toggle(id)} />
                <PartyAvatar id={id} size="sm" />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {firstName(id)}
                  {getParty(id).kind === "family" && <span className="ml-1 text-xs text-muted-foreground">· {getParty(id).headcount} people</span>}
                </span>
                {preview?.[id] !== undefined && <span className="tabular text-sm font-semibold text-foreground">{formatINR(preview[id])}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Split method</legend>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["equal", "Equally", "Same amount for each selected"],
            ["shares", "By headcount", "Families count per person"],
          ] as const).map(([v, l, b]) => (
            <button
              key={v}
              type="button"
              aria-pressed={d.split === v}
              onClick={() => update({ split: v })}
              className={cn("rounded-xl border p-3 text-left transition-colors", d.split === v ? "border-primary bg-secondary" : "bg-card hover:bg-secondary")}
            >
              <span className="block text-sm font-semibold text-foreground">{l}</span>
              <span className="block text-xs text-muted-foreground">{b}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="exp-notes">Notes (optional)</Label>
        <Textarea id="exp-notes" className="rounded-xl" rows={2} value={d.notes} maxLength={500} onChange={(e) => update({ notes: e.target.value })} />
      </div>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 text-sm text-muted-foreground hover:bg-secondary">
        <Paperclip className="h-4 w-4" aria-hidden />
        <span className="flex-1 truncate">{receipt ? receipt.name : "Attach receipt (optional)"}</span>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={saving} className="w-full">
        {saving ? <Loader2 className="animate-spin" /> : null}
        {saving ? "Saving…" : amount ? `Add ${formatINR(amount)}` : "Add expense"}
      </Button>
    </form>
  );
}
