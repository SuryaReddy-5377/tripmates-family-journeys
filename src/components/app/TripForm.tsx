import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { paiseToDecimalString, parseRupeesToPaise } from "@/lib/ledger";
import { families, parties } from "@/lib/sample-data";
import type { Trip } from "@/lib/types";
import { PartyAvatar } from "./bits";

export interface TripFormValues {
  name: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  participantIds: string[];
}

export function TripForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<Trip>;
  submitLabel: string;
  onSubmit: (v: TripFormValues) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStart] = useState(initial?.startDate ?? "");
  const [endDate, setEnd] = useState(initial?.endDate ?? "");
  const [budget, setBudget] = useState(initial?.budget ? paiseToDecimalString(initial.budget) : "");
  const [ids, setIds] = useState<string[]>(initial?.participants?.map((p) => p.partyId) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (!name.trim()) return setError("Give the trip a name.");
    if (!destination.trim()) return setError("Add a destination.");
    if (!startDate || !endDate) return setError("Choose start and end dates.");
    if (endDate < startDate) return setError("End date must be on or after the start date.");
    const b = budget.trim() === "" ? 0 : parseRupeesToPaise(budget);
    if (b === null) return setError("Budget must be a valid amount.");
    if (ids.length === 0) return setError("Invite at least one person.");
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), destination: destination.trim(), description: description.trim(), startDate, endDate, budget: b, participantIds: ids });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="t-name">Trip name</Label>
        <Input id="t-name" className="h-11 rounded-xl" placeholder="e.g. Ooty Summer 2027" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="t-dest">Destination</Label>
        <Input id="t-dest" className="h-11 rounded-xl" placeholder="City, State" value={destination} maxLength={100} onChange={(e) => setDestination(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="t-start">Start date</Label>
          <Input id="t-start" type="date" className="h-11 rounded-xl" value={startDate} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="t-end">End date</Label>
          <Input id="t-end" type="date" className="h-11 rounded-xl" value={endDate} min={startDate || undefined} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="t-budget">Estimated budget (₹, optional)</Label>
        <Input id="t-budget" inputMode="decimal" className="tabular h-11 rounded-xl" placeholder="e.g. 250000" value={budget} onChange={(e) => setBudget(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="t-desc">Description (optional)</Label>
        <Textarea id="t-desc" rows={3} className="rounded-xl" value={description} maxLength={1000} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium text-foreground">Who's invited</legend>
        <p className="-mt-2 text-xs text-muted-foreground">Pick people individually, or a whole family to account for them together.</p>
        {families.map((f) => {
          const members = parties.filter((p) => p.familyId === f.id);
          return (
            <div key={f.id} className="rounded-2xl border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.name} · {f.city}</p>
              <div className="flex flex-wrap gap-2">
                {members.map((p) => {
                  const on = ids.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      aria-pressed={on}
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-full border pl-1 pr-3 text-sm font-medium transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-secondary",
                      )}
                    >
                      <PartyAvatar id={p.id} size="sm" className="ring-0" />
                      {p.kind === "family" ? `Whole family (${p.headcount})` : p.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </fieldset>

      {error && <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
