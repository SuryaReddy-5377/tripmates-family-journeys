import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, paiseToDecimalString, parseRupeesToPaise, type Transfer } from "@/lib/ledger";
import { addSettlement, newId, tripPartyIds } from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/sample-data";
import { getParty, todayISO } from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { selectClass } from "./AddExpenseForm";

export function RepaymentForm({ trip, suggestion, onDone }: { trip: Trip; suggestion?: Transfer; onDone: () => void }) {
  const ids = tripPartyIds(trip);
  const [requestId] = useState(() => newId("req"));
  const [from, setFrom] = useState(suggestion?.from ?? CURRENT_USER_ID);
  const [to, setTo] = useState(suggestion?.to ?? ids.find((i) => i !== CURRENT_USER_ID) ?? ids[0]);
  const [amount, setAmount] = useState(suggestion ? paiseToDecimalString(suggestion.amount) : "");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paise = parseRupeesToPaise(amount);
  // Receiver-recorded repayments are confirmed immediately; otherwise the receiver confirms.
  const status = to === CURRENT_USER_ID ? "confirmed" : "pending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    if (!paise) return setError("Enter a valid amount.");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      addSettlement({ id: newId("set"), tripId: trip.id, from, to, amount: paise, status, date, note: note.trim() || undefined, recordedBy: CURRENT_USER_ID }, requestId);
      toast.success(status === "confirmed" ? "Repayment recorded" : "Repayment sent for confirmation", {
        description: `${getParty(from).name} → ${getParty(to).name}: ${formatINR(paise)}`,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="rp-from">Who paid back</Label>
          <select id="rp-from" className={selectClass} value={from} onChange={(e) => setFrom(e.target.value)}>
            {ids.map((id) => (
              <option key={id} value={id}>{getParty(id).name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rp-to">Received by</Label>
          <select id="rp-to" className={selectClass} value={to} onChange={(e) => setTo(e.target.value)}>
            {ids.map((id) => (
              <option key={id} value={id}>{getParty(id).name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="rp-amount">Amount (₹)</Label>
          <Input id="rp-amount" inputMode="decimal" className="tabular h-11 rounded-xl text-base" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rp-date">Date</Label>
          <Input id="rp-date" type="date" className="h-11 rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rp-note">Note (optional)</Label>
        <Input id="rp-note" className="h-11 rounded-xl" placeholder="e.g. UPI ref 4821" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">
        Partial amounts are fine. Repayments change balances only — never the trip's total spending.
        {status === "pending" && " The receiver confirms it before balances update."}
      </p>
      {error && <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Saving…" : "Record repayment"}
      </Button>
    </form>
  );
}
