/**
 * PHASE 1 in-memory store. Lets the sample UI behave like the real app
 * (add expenses, record repayments, RSVP, add photos) using the real ledger
 * rules. Nothing persists across a page refresh — Phase 2 replaces this with
 * the database behind authorised server functions.
 */
import { useSyncExternalStore } from "react";
import { initialExpenses, initialPhotos, initialSettlements, initialTrips } from "./sample-data";
import { validateExpense, validateSettlement } from "./ledger";
import type { Expense, Photo, Rsvp, Settlement, Trip } from "./types";

export interface AppState {
  trips: Trip[];
  expenses: Expense[];
  settlements: Settlement[];
  photos: Photo[];
}

const initialState: AppState = {
  trips: initialTrips,
  expenses: initialExpenses,
  settlements: initialSettlements,
  photos: initialPhotos,
};

let state = initialState;
const listeners = new Set<() => void>();
const seenRequestIds = new Set<string>();

function set(next: AppState) {
  state = next;
  listeners.forEach((l) => l());
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => initialState,
  );
}

export function getState() {
  return state;
}

export function tripPartyIds(trip: Trip): string[] {
  return trip.participants.filter((p) => p.rsvp !== "declined").map((p) => p.partyId);
}

/** Rejects a repeated submission of the same form (double tap, retry). */
function guardDuplicate(requestId: string) {
  if (seenRequestIds.has(requestId)) throw new Error("This was already saved.");
  seenRequestIds.add(requestId);
}

export function addExpense(expense: Expense, requestId: string) {
  const trip = state.trips.find((t) => t.id === expense.tripId);
  if (!trip) throw new Error("Trip not found");
  validateExpense(expense, tripPartyIds(trip));
  guardDuplicate(requestId);
  set({ ...state, expenses: [expense, ...state.expenses] });
}

export function addSettlement(s: Settlement, requestId: string) {
  const trip = state.trips.find((t) => t.id === s.tripId);
  if (!trip) throw new Error("Trip not found");
  validateSettlement(s, tripPartyIds(trip));
  guardDuplicate(requestId);
  set({ ...state, settlements: [s, ...state.settlements] });
}

export function confirmSettlement(id: string) {
  set({
    ...state,
    settlements: state.settlements.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s)),
  });
}

export function setRsvp(tripId: string, partyId: string, rsvp: Rsvp) {
  set({
    ...state,
    trips: state.trips.map((t) =>
      t.id === tripId
        ? { ...t, participants: t.participants.map((p) => (p.partyId === partyId ? { ...p, rsvp } : p)) }
        : t,
    ),
  });
}

export function addTrip(trip: Trip, requestId: string) {
  guardDuplicate(requestId);
  set({ ...state, trips: [trip, ...state.trips] });
}

export function addPhotos(photos: Photo[]) {
  set({ ...state, photos: [...photos, ...state.photos] });
}

export function updatePhoto(id: string, patch: Partial<Photo>) {
  set({ ...state, photos: state.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function deletePhotos(ids: string[]) {
  const s = new Set(ids);
  set({ ...state, photos: state.photos.filter((p) => !s.has(p.id)) });
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
