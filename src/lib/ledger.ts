/**
 * TripMates ledger engine.
 *
 * All money is integer paise (₹1 = 100 paise). No floating point is ever used
 * for amounts. This module is pure (no I/O) so the same code can run in the
 * browser for previews and on the server for authoritative validation.
 */

export type Paise = number;
export type PartyId = string;

export type SplitMethod = "equal" | "shares" | "exact";

export interface ExpenseInput {
  id: string;
  amount: Paise;
  paidBy: PartyId;
  participants: PartyId[];
  splitMethod: SplitMethod;
  /** shares: weight per participant (positive integers). exact: paise per participant. */
  splitValues?: Record<PartyId, number>;
  category?: string;
  voided?: boolean;
}

export type SettlementStatus = "confirmed" | "pending" | "reversed";

export interface SettlementInput {
  id: string;
  from: PartyId; // person paying back
  to: PartyId; // person receiving
  amount: Paise;
  status: SettlementStatus;
}

export interface PartyBalance {
  partyId: PartyId;
  paid: Paise; // paid toward shared expenses
  share: Paise; // allocated expense share
  repaymentsSent: Paise;
  repaymentsReceived: Paise;
  /** positive = is owed money, negative = owes money */
  net: Paise;
}

export interface Transfer {
  from: PartyId;
  to: PartyId;
  amount: Paise;
}

export class LedgerError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

const MAX_AMOUNT: Paise = 1_000_000_000_00; // ₹1,000,000,000 safety cap

export function isValidPaise(n: unknown): n is Paise {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= MAX_AMOUNT;
}

/**
 * Parse a user-typed rupee string ("1,250.5", "₹ 99", "12.05") into paise
 * without floating point. Returns null for invalid input or more than 2 decimals.
 */
export function parseRupeesToPaise(input: string): Paise | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  const m = /^(\d{1,12})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!m) return null;
  const rupees = Number(m[1]);
  const frac = (m[2] ?? "").padEnd(2, "0");
  const paise = rupees * 100 + Number(frac || "0");
  return isValidPaise(paise) ? paise : null;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats paise as INR. Uses integer division for the rupee part. */
export function formatINR(paise: Paise, opts: { compact?: boolean } = {}): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  if (opts.compact && abs % 100 === 0) return sign + inrCompact.format(abs / 100);
  const rupees = Math.trunc(abs / 100);
  const rem = abs % 100;
  // Build from the integer rupee value, then append paise exactly.
  const whole = inrFormatter.format(rupees).replace(/\.00$/, "");
  return `${sign}${whole}.${String(rem).padStart(2, "0")}`;
}

function sortedUnique(ids: PartyId[]): PartyId[] {
  return Array.from(new Set(ids)).sort();
}

/**
 * Allocate `amount` across participants proportionally to integer weights
 * using the largest-remainder method. Leftover paise go to the participants
 * with the largest fractional remainder; ties break by ascending party id so
 * the result is fully deterministic regardless of input order.
 */
export function allocateByWeights(amount: Paise, weights: Record<PartyId, number>): Record<PartyId, Paise> {
  if (!isValidPaise(amount)) throw new LedgerError("Amount must be a non-negative whole number of paise", "invalid_amount");
  const ids = Object.keys(weights).sort();
  if (ids.length === 0) throw new LedgerError("Select at least one participant", "no_participants");
  for (const id of ids) {
    const w = weights[id];
    if (!Number.isSafeInteger(w) || w <= 0) throw new LedgerError("Shares must be positive whole numbers", "invalid_weight");
  }
  const totalWeight = ids.reduce((s, id) => s + weights[id], 0);
  const result: Record<PartyId, Paise> = {};
  const remainders: { id: PartyId; rem: number }[] = [];
  let allocated = 0;
  for (const id of ids) {
    const numerator = amount * weights[id];
    if (!Number.isSafeInteger(numerator)) throw new LedgerError("Amount too large", "overflow");
    const base = Math.floor(numerator / totalWeight);
    result[id] = base;
    allocated += base;
    remainders.push({ id, rem: numerator % totalWeight });
  }
  let leftover = amount - allocated;
  remainders.sort((a, b) => b.rem - a.rem || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = 0; leftover > 0; i++, leftover--) {
    result[remainders[i % remainders.length].id] += 1;
  }
  return result;
}

export function splitEqual(amount: Paise, participants: PartyId[]): Record<PartyId, Paise> {
  const ids = sortedUnique(participants);
  return allocateByWeights(
    amount,
    Object.fromEntries(ids.map((id) => [id, 1])),
  );
}

/** Returns each participant's share of one expense. Throws LedgerError on invalid splits. */
export function computeShares(expense: ExpenseInput): Record<PartyId, Paise> {
  const participants = sortedUnique(expense.participants);
  if (participants.length === 0) throw new LedgerError("Select at least one participant", "no_participants");
  if (participants.length !== expense.participants.length) throw new LedgerError("Duplicate participant", "duplicate_participant");
  if (!isValidPaise(expense.amount) || expense.amount === 0) throw new LedgerError("Amount must be greater than zero", "invalid_amount");

  switch (expense.splitMethod) {
    case "equal":
      return splitEqual(expense.amount, participants);
    case "shares": {
      const values = expense.splitValues ?? {};
      const weights: Record<PartyId, number> = {};
      for (const id of participants) weights[id] = values[id] ?? 1;
      for (const k of Object.keys(values)) {
        if (!participants.includes(k)) throw new LedgerError("Shares given for a non-participant", "nonparticipant_share");
      }
      return allocateByWeights(expense.amount, weights);
    }
    case "exact": {
      const values = expense.splitValues ?? {};
      const out: Record<PartyId, Paise> = {};
      let sum = 0;
      for (const k of Object.keys(values)) {
        if (!participants.includes(k)) throw new LedgerError("Amount given for a non-participant", "nonparticipant_share");
      }
      for (const id of participants) {
        const v = values[id];
        if (!isValidPaise(v)) throw new LedgerError("Each exact amount must be a valid amount", "invalid_exact");
        out[id] = v;
        sum += v;
      }
      if (sum !== expense.amount) throw new LedgerError("Exact amounts must add up to the expense total", "exact_mismatch");
      return out;
    }
    default:
      throw new LedgerError("Unknown split method", "invalid_method");
  }
}

export interface TripLedgerInput {
  parties: PartyId[]; // everyone on the trip ledger (people and family-level parties)
  expenses: ExpenseInput[];
  settlements: SettlementInput[];
}

/** Server-side style validation of a new expense against the trip's parties. */
export function validateExpense(expense: ExpenseInput, tripParties: PartyId[]): void {
  const set = new Set(tripParties);
  if (!set.has(expense.paidBy)) throw new LedgerError("Payer is not on this trip", "payer_not_member");
  for (const p of expense.participants) {
    if (!set.has(p)) throw new LedgerError("A participant is not on this trip", "participant_not_member");
  }
  const shares = computeShares(expense);
  const total = Object.values(shares).reduce((s, v) => s + v, 0);
  if (total !== expense.amount) throw new LedgerError("Split does not add up", "split_mismatch");
}

export function validateSettlement(s: SettlementInput, tripParties: PartyId[]): void {
  const set = new Set(tripParties);
  if (s.from === s.to) throw new LedgerError("Payer and receiver must be different", "same_party");
  if (!set.has(s.from) || !set.has(s.to)) throw new LedgerError("Both people must be on this trip", "not_member");
  if (!isValidPaise(s.amount) || s.amount === 0) throw new LedgerError("Amount must be greater than zero", "invalid_amount");
}

/**
 * Net balance per party:
 *   net = paid − share + repaymentsSent − repaymentsReceived
 * Paying someone back moves you toward zero; receiving a repayment reduces
 * what you are still owed. Only confirmed settlements count.
 */
export function computeBalances(input: TripLedgerInput): PartyBalance[] {
  const map = new Map<PartyId, PartyBalance>();
  const get = (id: PartyId) => {
    let b = map.get(id);
    if (!b) {
      b = { partyId: id, paid: 0, share: 0, repaymentsSent: 0, repaymentsReceived: 0, net: 0 };
      map.set(id, b);
    }
    return b;
  };
  for (const id of input.parties) get(id);

  for (const e of input.expenses) {
    if (e.voided) continue;
    const shares = computeShares(e);
    get(e.paidBy).paid += e.amount;
    for (const [id, amt] of Object.entries(shares)) get(id).share += amt;
  }
  for (const s of input.settlements) {
    if (s.status !== "confirmed") continue;
    get(s.from).repaymentsSent += s.amount;
    get(s.to).repaymentsReceived += s.amount;
  }
  for (const b of map.values()) {
    b.net = b.paid - b.share + b.repaymentsSent - b.repaymentsReceived;
  }
  return Array.from(map.values()).sort((a, b) => (a.partyId < b.partyId ? -1 : 1));
}

/** Total trip spending. Repayments never change this. */
export function totalSpent(expenses: ExpenseInput[]): Paise {
  return expenses.filter((e) => !e.voided).reduce((s, e) => s + e.amount, 0);
}

/**
 * Suggest a minimal-ish set of transfers to settle all balances
 * (greedy: largest debtor pays largest creditor). Deterministic ordering.
 */
export function suggestTransfers(balances: PartyBalance[]): Transfer[] {
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ id: b.partyId, amt: -b.net }));
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ id: b.partyId, amt: b.net }));
  const order = (a: { id: string; amt: number }, b: { id: string; amt: number }) =>
    b.amt - a.amt || (a.id < b.id ? -1 : 1);
  const transfers: Transfer[] = [];
  debtors.sort(order);
  creditors.sort(order);
  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const amt = Math.min(d.amt, c.amt);
    transfers.push({ from: d.id, to: c.id, amount: amt });
    d.amt -= amt;
    c.amt -= amt;
    if (d.amt === 0) debtors.shift();
    if (c.amt === 0) creditors.shift();
    debtors.sort(order);
    creditors.sort(order);
  }
  return transfers;
}

export function totalsByCategory(expenses: ExpenseInput[]): Record<string, Paise> {
  const out: Record<string, Paise> = {};
  for (const e of expenses) {
    if (e.voided) continue;
    const k = e.category ?? "other";
    out[k] = (out[k] ?? 0) + e.amount;
  }
  return out;
}

/** Minimal RFC 4180 CSV cell escaping. Also neutralises spreadsheet formula injection. */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && typeof value === "string") s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Paise as a plain decimal string for CSV ("1250.05"), no float math. */
export function paiseToDecimalString(paise: Paise): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
