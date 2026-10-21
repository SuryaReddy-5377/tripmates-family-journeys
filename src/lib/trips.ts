import { format, parseISO } from "date-fns";
import {
  computeBalances,
  csvCell,
  paiseToDecimalString,
  suggestTransfers,
  totalSpent,
  totalsByCategory,
} from "./ledger";
import { parties, people } from "./sample-data";
import type { AppState } from "./store";
import { tripPartyIds } from "./store";
import type { ExpenseCategory, Party, Trip, TripStatus, Expense, Settlement } from "./types";
import type { Paise, PartyBalance, Transfer } from "./ledger";

export interface TripLedgerResult {
  trip: Trip;
  expenses: Expense[];
  settlements: Settlement[];
  balances: PartyBalance[];
  transfers: Transfer[];
  total: Paise;
  byCategory: Record<ExpenseCategory, Paise>;
  outstanding: Paise;
}

export function todayISO(now = new Date()) {
  return format(now, "yyyy-MM-dd");
}

export function tripStatus(trip: Pick<Trip, "startDate" | "endDate">, now = new Date()): TripStatus {
  const today = todayISO(now);
  if (today < trip.startDate) return "upcoming";
  if (today > trip.endDate) return "completed";
  return "ongoing";
}

export const statusLabel: Record<TripStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Happening now",
  completed: "Completed",
};

export function formatDateRange(start: string, end: string) {
  const s = parseISO(start);
  const e = parseISO(end);
  if (s.getFullYear() !== e.getFullYear()) return `${format(s, "d MMM yyyy")} – ${format(e, "d MMM yyyy")}`;
  if (s.getMonth() === e.getMonth()) return `${format(s, "d")}–${format(e, "d MMM yyyy")}`;
  return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
}

export function daysUntil(date: string, now = new Date()) {
  const [y1, m1, d1] = date.split("-").map(Number);
  const ms = Date.UTC(y1, m1 - 1, d1) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(ms / 86_400_000);
}

const partyMap = new Map(parties.map((p) => [p.id, p]));
const personMap = new Map(people.map((p) => [p.id, p]));

export function getParty(id: string): Party {
  return partyMap.get(id) ?? { id, kind: "person", name: "Unknown", familyId: "", headcount: 1 };
}
export function partyName(id: string) {
  return getParty(id).name;
}
export function personName(id: string) {
  return personMap.get(id)?.name ?? partyName(id);
}
export function firstName(id: string) {
  const p = getParty(id);
  return p.kind === "family" ? p.name : p.name.split(" ")[0];
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const categoryLabel: Record<ExpenseCategory, string> = {
  transport: "Transport",
  accommodation: "Stay",
  food: "Food",
  tickets: "Tickets",
  fuel: "Fuel",
  shopping: "Shopping",
  groceries: "Groceries",
  other: "Other",
};

const ledgerMemo = new Map<string, TripLedgerResult>();

export function tripLedger(state: AppState, tripId: string): TripLedgerResult {
  const trip = state.trips.find((t) => t.id === tripId)!;
  const expenses = state.expenses.filter((e) => e.tripId === tripId);
  const settlements = state.settlements.filter((s) => s.tripId === tripId);
  const cacheKey = `${tripId}:${trip?.budget}:${expenses.length}:${settlements.length}:${expenses[expenses.length - 1]?.id ?? ""}:${settlements[settlements.length - 1]?.id ?? ""}`;
  const hit = ledgerMemo.get(cacheKey);
  if (hit) return hit;
  const partyIds = Array.from(
    new Set([...tripPartyIds(trip), ...expenses.flatMap((e) => [e.paidBy, ...e.participants]), ...settlements.flatMap((s) => [s.from, s.to])]),
  );
  const balances = computeBalances({ parties: partyIds, expenses, settlements });
  const transfers = suggestTransfers(balances);
  const total = totalSpent(expenses);
  const byCategory = totalsByCategory(expenses);
  const outstanding = balances.reduce((s, b) => s + (b.net > 0 ? b.net : 0), 0);
  const result = { trip, expenses, settlements, balances, transfers, total, byCategory, outstanding };
  ledgerMemo.set(cacheKey, result);
  return result;
}

export function expensesCsv(state: AppState, tripId: string): string {
  const { trip, expenses, balances, total, byCategory, settlements } = tripLedger(state, tripId);
  const rows: (string | number)[][] = [
    ["TripMates expense statement", trip.name],
    ["Dates", formatDateRange(trip.startDate, trip.endDate)],
    ["Total spent (INR)", paiseToDecimalString(total)],
    ["Budget (INR)", paiseToDecimalString(trip.budget)],
    [],
    ["Date", "Description", "Category", "Amount (INR)", "Paid by", "Split", "Participants"],
    ...expenses
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => [e.date, e.description, categoryLabel[e.category], paiseToDecimalString(e.amount), partyName(e.paidBy), e.splitMethod, e.participants.map(partyName).join("; ")]),
    [],
    ["Category", "Amount (INR)"],
    ...Object.entries(byCategory).map(([k, v]) => [categoryLabel[k as ExpenseCategory] ?? k, paiseToDecimalString(v)]),
    [],
    ["Participant", "Paid", "Share", "Repaid", "Received", "Net"],
    ...balances.map((b) => [partyName(b.partyId), paiseToDecimalString(b.paid), paiseToDecimalString(b.share), paiseToDecimalString(b.repaymentsSent), paiseToDecimalString(b.repaymentsReceived), paiseToDecimalString(b.net)]),
    [],
    ["Repayment date", "From", "To", "Amount (INR)", "Status"],
    ...settlements.map((s) => [s.date, partyName(s.from), partyName(s.to), paiseToDecimalString(s.amount), s.status]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export function downloadText(filename: string, text: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff", text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
