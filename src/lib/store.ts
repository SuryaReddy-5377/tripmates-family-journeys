import { useSyncExternalStore } from "react";
import {
  CURRENT_USER,
  families as initialFamilies,
  people as initialPeople,
  parties as initialParties,
  initialTrips,
  initialExpenses,
  initialSettlements,
  initialStops,
  initialSavedRoutes,
  initialActivities,
  initialChecklists,
  initialAuditLogs,
  initialNotifications,
} from "./sample-data";
import { validateExpense, validateSettlement } from "./ledger";
import {
  enqueueOfflineAction,
  getPendingOfflineActions,
  removeOfflineAction,
  saveOfflineCachedState,
} from "./offline-storage";
import type {
  AppNotification,
  AuditLog,
  ChecklistItem,
  Expense,
  FamilyGroup,
  ItineraryActivity,
  Party,
  Person,
  Role,
  RouteStop,
  Rsvp,
  SavedRoute,
  Settlement,
  Trip,
  User,
} from "./types";

export interface AppState {
  currentUser: User;
  isAuthenticated: boolean;
  families: FamilyGroup[];
  activeFamilyId: string;
  people: Person[];
  parties: Party[];
  trips: Trip[];
  expenses: Expense[];
  settlements: Settlement[];
  stops: RouteStop[];
  savedRoutes: SavedRoute[];
  activities: ItineraryActivity[];
  checklists: ChecklistItem[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  isOnline: boolean;
  pendingOfflineActionsCount: number;
}

export const SESSION_KEY = "tripmates_user_session";
export const STORAGE_KEY = "tripmates_v2_2_clean_state";

export const GUEST_USER: User = {
  id: "guest",
  name: "Guest Traveler",
  email: "",
  role: "member",
  familyIds: [],
  defaultFamilyId: "fam_reddy",
  createdAt: new Date().toISOString(),
};

export function getSessionUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u && typeof u.id === "string" && u.id !== "guest") {
        return u;
      }
    }
  } catch (e) {
    console.warn("Could not read user session:", e);
  }
  return null;
}

export function loginUser(user: User) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Could not write session:", e);
    }
  }
  set({
    ...state,
    currentUser: user,
    isAuthenticated: true,
  });
}

export function logoutUser() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn("Could not clear session:", e);
    }
  }
  set({
    ...state,
    currentUser: GUEST_USER,
    isAuthenticated: false,
  });
}

function getInitialState(): AppState {
  const sessionUser = getSessionUser();
  return {
    currentUser: sessionUser || GUEST_USER,
    isAuthenticated: sessionUser !== null,
    families: initialFamilies,
    activeFamilyId: "fam_reddy",
    people: initialPeople,
    parties: initialParties,
    trips: initialTrips,
    expenses: initialExpenses,
    settlements: initialSettlements,
    stops: initialStops,
    savedRoutes: initialSavedRoutes,
    activities: initialActivities,
    checklists: initialChecklists,
    auditLogs: initialAuditLogs,
    notifications: initialNotifications,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingOfflineActionsCount: 0,
  };
}

let state: AppState = getInitialState();
const listeners = new Set<() => void>();
const seenRequestIds = new Set<string>();

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Hydrate from localStorage on client with sanitization
if (typeof window !== "undefined") {
  try {
    // Purge old dirty key if it exists
    localStorage.removeItem("tripmates_v2_store_data");

    const sessionUser = getSessionUser();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Sanitize: Purge legacy mock families like fam_rao, fam_kumar, fam_varma
      const cleanFamilies = (parsed.families || []).filter(
        (f: FamilyGroup) => f.id === "fam_reddy" || !f.id.match(/^fam_(rao|kumar|varma)/i),
      );

      state = {
        ...getInitialState(),
        ...parsed,
        currentUser: sessionUser || GUEST_USER,
        isAuthenticated: sessionUser !== null,
        families: cleanFamilies.length > 0 ? cleanFamilies : initialFamilies,
        activeFamilyId: "fam_reddy",
        isOnline: navigator.onLine,
      };
    }
  } catch (e) {
    console.warn("Could not hydrate TripMates state from localStorage:", e);
  }

  // Network listeners
  window.addEventListener("online", () => {
    set({ ...state, isOnline: true });
    syncOfflineQueue();
  });
  window.addEventListener("offline", () => {
    set({ ...state, isOnline: false });
  });

  // Check pending offline actions on start
  getPendingOfflineActions().then((actions) => {
    set({ ...state, pendingOfflineActionsCount: actions.length });
  });
}

function persistState(next: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveOfflineCachedState("app_state", next).catch(() => {});
  } catch (err) {
    console.warn("Storage quota exceeded or error persisting state:", err);
  }
}

function set(next: AppState) {
  state = next;
  listeners.forEach((l) => l());
  persistState(next);
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => getInitialState(),
  );
}

export function getState(): AppState {
  return state;
}

export function tripPartyIds(trip: Trip): string[] {
  return trip.participants.filter((p) => p.rsvp !== "declined").map((p) => p.partyId);
}

function guardDuplicate(requestId?: string) {
  if (!requestId) return;
  if (seenRequestIds.has(requestId)) throw new Error("This action was already processed.");
  seenRequestIds.add(requestId);
}

function logAudit(action: string, entityType: string, entityId: string, details: string, tripId?: string) {
  const audit: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId: state.currentUser.id,
    actorName: state.currentUser.name,
    action,
    entityType,
    entityId,
    details,
    familyId: state.activeFamilyId,
    tripId,
  };
  return audit;
}

// ----------------- USER & WORKSPACE -----------------

export function setCurrentUser(user: User) {
  set({ ...state, currentUser: user });
}

export function switchActiveFamily(familyId: string) {
  set({ ...state, activeFamilyId: familyId });
}

export function createFamily(name: string, city: string, inviteCode: string) {
  const newFam: FamilyGroup = {
    id: `fam_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    name,
    city,
    inviteCode: inviteCode.toUpperCase(),
    adminId: state.currentUser.id,
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };
  const audit = logAudit("create_family", "family", newFam.id, `Created family workspace ${name} in ${city}`);
  set({
    ...state,
    families: [...state.families, newFam],
    activeFamilyId: newFam.id,
    currentUser: {
      ...state.currentUser,
      familyIds: [...state.currentUser.familyIds, newFam.id],
    },
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function addMember(person: Person) {
  const audit = logAudit("add_member", "person", person.id, `Added member ${person.name} (${person.role}) to family`);
  const newParty: Party = {
    id: person.id,
    kind: "person",
    name: person.name,
    familyId: person.familyId,
    headcount: 1,
    relation: person.relation,
  };
  set({
    ...state,
    people: [...state.people, person],
    parties: [...state.parties, newParty],
    families: state.families.map((f) =>
      f.id === person.familyId ? { ...f, memberCount: f.memberCount + 1 } : f,
    ),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function updateMemberRole(personId: string, role: Role) {
  const person = state.people.find((p) => p.id === personId);
  const audit = logAudit("update_role", "person", personId, `Changed ${person?.name ?? personId} role to ${role}`);
  set({
    ...state,
    people: state.people.map((p) => (p.id === personId ? { ...p, role } : p)),
    auditLogs: [audit, ...state.auditLogs],
  });
}

// ----------------- TRIPS -----------------

export function addTrip(trip: Trip, requestId?: string) {
  if (!trip.name.trim()) throw new Error("Give the trip a name");
  if (trip.endDate < trip.startDate) throw new Error("End date must be on or after start date");
  guardDuplicate(requestId);

  const audit = logAudit("create_trip", "trip", trip.id, `Created trip: ${trip.name} to ${trip.destination}`, trip.id);
  set({
    ...state,
    trips: [trip, ...state.trips],
    auditLogs: [audit, ...state.auditLogs],
  });

  if (!state.isOnline) {
    enqueueOfflineAction({ entityType: "trip", action: "create", payload: trip }).catch(() => {});
    set({ ...state, pendingOfflineActionsCount: state.pendingOfflineActionsCount + 1 });
  }
}

export function updateTrip(trip: Trip) {
  const audit = logAudit("update_trip", "trip", trip.id, `Updated trip details: ${trip.name}`, trip.id);
  set({
    ...state,
    trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function archiveTrip(tripId: string, archived: boolean) {
  const audit = logAudit(archived ? "archive_trip" : "unarchive_trip", "trip", tripId, `Trip ${tripId} ${archived ? "archived" : "unarchived"}`, tripId);
  set({
    ...state,
    trips: state.trips.map((t) => (t.id === tripId ? { ...t, archived } : t)),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function setRsvp(tripId: string, partyId: string, rsvp: Rsvp) {
  set({
    ...state,
    trips: state.trips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            participants: t.participants.map((p) => (p.partyId === partyId ? { ...p, rsvp } : p)),
          }
        : t,
    ),
  });
}

export function addTripParticipant(tripId: string, partyId: string) {
  set({
    ...state,
    trips: state.trips.map((t) => {
      if (t.id !== tripId) return t;
      if (t.participants.some((p) => p.partyId === partyId)) return t;
      return {
        ...t,
        participants: [...t.participants, { partyId, rsvp: "going" }],
      };
    }),
  });
}

export function removeTripParticipant(tripId: string, partyId: string) {
  set({
    ...state,
    trips: state.trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        participants: t.participants.filter((p) => p.partyId !== partyId),
      };
    }),
  });
}

export function clearAllDemoData() {
  set({
    ...state,
    trips: [],
    expenses: [],
    settlements: [],
    stops: [],
    savedRoutes: [],
    activities: [],
    checklists: [],
  });
}

export function resetWorkspaceToClean() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("tripmates_v2_store_data");
    } catch {}
  }
  const sessionUser = getSessionUser();
  set({
    ...getInitialState(),
    currentUser: sessionUser || GUEST_USER,
    isAuthenticated: sessionUser !== null,
  });
}

export function restoreDemoData() {
  set({
    ...state,
    trips: initialTrips,
    expenses: initialExpenses,
    settlements: initialSettlements,
    stops: initialStops,
    savedRoutes: initialSavedRoutes,
    activities: initialActivities,
    checklists: initialChecklists,
  });
}

// ----------------- EXPENSES & SETTLEMENTS -----------------

export function addExpense(expense: Expense, requestId?: string) {
  const trip = state.trips.find((t) => t.id === expense.tripId);
  if (!trip) throw new Error("Trip not found");
  validateExpense(expense, tripPartyIds(trip));
  guardDuplicate(requestId);

  const audit = logAudit(
    "create_expense",
    "expense",
    expense.id,
    `Added expense "${expense.description}" (₹${(expense.amount / 100).toFixed(2)}) paid by ${expense.paidBy}`,
    expense.tripId,
  );

  set({
    ...state,
    expenses: [expense, ...state.expenses],
    auditLogs: [audit, ...state.auditLogs],
  });

  if (!state.isOnline) {
    enqueueOfflineAction({ entityType: "expense", action: "create", payload: expense }).catch(() => {});
    set({ ...state, pendingOfflineActionsCount: state.pendingOfflineActionsCount + 1 });
  }
}

export function updateExpense(expense: Expense) {
  const trip = state.trips.find((t) => t.id === expense.tripId);
  if (!trip) throw new Error("Trip not found");
  validateExpense(expense, tripPartyIds(trip));

  const audit = logAudit(
    "update_expense",
    "expense",
    expense.id,
    `Updated expense "${expense.description}" to ₹${(expense.amount / 100).toFixed(2)}`,
    expense.tripId,
  );

  set({
    ...state,
    expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function deleteExpense(expenseId: string) {
  const exp = state.expenses.find((e) => e.id === expenseId);
  const audit = logAudit(
    "delete_expense",
    "expense",
    expenseId,
    `Deleted expense "${exp?.description ?? expenseId}"`,
    exp?.tripId,
  );
  set({
    ...state,
    expenses: state.expenses.filter((e) => e.id !== expenseId),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function addSettlement(s: Settlement, requestId?: string) {
  const trip = state.trips.find((t) => t.id === s.tripId);
  if (!trip) throw new Error("Trip not found");
  validateSettlement(s, tripPartyIds(trip));
  guardDuplicate(requestId);

  const audit = logAudit(
    "record_settlement",
    "settlement",
    s.id,
    `Recorded repayment of ₹${(s.amount / 100).toFixed(2)} from ${s.from} to ${s.to}`,
    s.tripId,
  );

  set({
    ...state,
    settlements: [s, ...state.settlements],
    auditLogs: [audit, ...state.auditLogs],
  });

  if (!state.isOnline) {
    enqueueOfflineAction({ entityType: "settlement", action: "create", payload: s }).catch(() => {});
    set({ ...state, pendingOfflineActionsCount: state.pendingOfflineActionsCount + 1 });
  }
}

export function confirmSettlement(id: string) {
  set({
    ...state,
    settlements: state.settlements.map((s) => (s.id === id ? { ...s, status: "confirmed" } : s)),
  });
}

export function deleteSettlement(id: string) {
  set({
    ...state,
    settlements: state.settlements.filter((s) => s.id !== id),
  });
}

// ----------------- MAP STOPS & ROUTES -----------------

export function addStop(stop: RouteStop) {
  set({
    ...state,
    stops: [...state.stops, stop],
  });
}

export function updateStop(stop: RouteStop) {
  set({
    ...state,
    stops: state.stops.map((s) => (s.id === stop.id ? stop : s)),
  });
}

export function deleteStop(stopId: string) {
  set({
    ...state,
    stops: state.stops.filter((s) => s.id !== stopId),
  });
}

export function reorderStops(tripId: string, orderedStopIds: string[]) {
  const stopMap = new Map(state.stops.map((s) => [s.id, s]));
  const updatedStops = state.stops.map((s) => {
    if (s.tripId !== tripId) return s;
    const newIdx = orderedStopIds.indexOf(s.id);
    return newIdx >= 0 ? { ...s, order: newIdx + 1 } : s;
  });
  set({ ...state, stops: updatedStops });
}

export function saveRoute(route: SavedRoute) {
  const existing = state.savedRoutes.some((r) => r.id === route.id);
  set({
    ...state,
    savedRoutes: existing
      ? state.savedRoutes.map((r) => (r.id === route.id ? route : r))
      : [route, ...state.savedRoutes],
  });
}

export function deleteRoute(routeId: string) {
  set({
    ...state,
    savedRoutes: state.savedRoutes.filter((r) => r.id !== routeId),
  });
}

// ----------------- ITINERARY -----------------

export function addActivity(activity: ItineraryActivity) {
  set({
    ...state,
    activities: [...state.activities, activity],
  });
}

export function updateActivity(activity: ItineraryActivity) {
  set({
    ...state,
    activities: state.activities.map((a) => (a.id === activity.id ? activity : a)),
  });
}

export function deleteActivity(activityId: string) {
  set({
    ...state,
    activities: state.activities.filter((a) => a.id !== activityId),
  });
}

export function toggleActivityComplete(activityId: string) {
  set({
    ...state,
    activities: state.activities.map((a) =>
      a.id === activityId ? { ...a, completed: !a.completed } : a,
    ),
  });
}

// ----------------- CHECKLIST -----------------

export function addChecklistItem(item: ChecklistItem) {
  set({
    ...state,
    checklists: [...state.checklists, item],
  });
}

export function updateChecklistItem(item: ChecklistItem) {
  set({
    ...state,
    checklists: state.checklists.map((c) => (c.id === item.id ? item : c)),
  });
}

export function deleteChecklistItem(itemId: string) {
  set({
    ...state,
    checklists: state.checklists.filter((c) => c.id !== itemId),
  });
}

export function toggleChecklistItem(itemId: string) {
  set({
    ...state,
    checklists: state.checklists.map((c) =>
      c.id === itemId ? { ...c, completed: !c.completed } : c,
    ),
  });
}

// ----------------- NOTIFICATIONS -----------------

export function markNotificationRead(id: string) {
  set({
    ...state,
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  });
}

export function markAllNotificationsRead() {
  set({
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  });
}

export function clearNotifications() {
  set({
    ...state,
    notifications: [],
  });
}

// ----------------- SUPER ADMIN -----------------

export function suspendFamily(familyId: string, suspended: boolean) {
  const fam = state.families.find((f) => f.id === familyId);
  const audit = logAudit(
    suspended ? "suspend_family" : "unsuspend_family",
    "family",
    familyId,
    `Admin ${suspended ? "suspended" : "restored"} workspace ${fam?.name ?? familyId}`,
  );
  set({
    ...state,
    families: state.families.map((f) => (f.id === familyId ? { ...f, suspended } : f)),
    auditLogs: [audit, ...state.auditLogs],
  });
}

export function correctLedgerRecord(action: string, details: string, reason: string) {
  const audit = logAudit(
    "admin_correction",
    "ledger",
    "global",
    `Administrative correction [${action}]: ${details}. Reason: ${reason}`,
  );
  set({
    ...state,
    auditLogs: [audit, ...state.auditLogs],
  });
}

// ----------------- OFFLINE SYNC RECONCILIATION -----------------

export async function syncOfflineQueue(): Promise<{ syncedCount: number; errors: string[] }> {
  const actions = await getPendingOfflineActions();
  if (actions.length === 0) {
    set({ ...state, pendingOfflineActionsCount: 0 });
    return { syncedCount: 0, errors: [] };
  }

  let synced = 0;
  const errors: string[] = [];

  for (const act of actions) {
    try {
      // Reconcile and deduplicate
      if (act.entityType === "expense" && act.action === "create") {
        const exp = act.payload as Expense;
        if (!state.expenses.some((e) => e.id === exp.id)) {
          set({ ...state, expenses: [exp, ...state.expenses] });
        }
      } else if (act.entityType === "settlement" && act.action === "create") {
        const stl = act.payload as Settlement;
        if (!state.settlements.some((s) => s.id === stl.id)) {
          set({ ...state, settlements: [stl, ...state.settlements] });
        }
      }
      await removeOfflineAction(act.id);
      synced++;
    } catch (err: any) {
      errors.push(`Action ${act.id} failed: ${err.message}`);
    }
  }

  const remaining = await getPendingOfflineActions();
  set({ ...state, pendingOfflineActionsCount: remaining.length });

  // Post sync notification
  if (synced > 0) {
    const syncNotif: AppNotification = {
      id: `sync_${Date.now()}`,
      userId: state.currentUser.id,
      title: "Offline Sync Complete",
      message: `Successfully synchronized ${synced} pending offline changes.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    set({ ...state, notifications: [syncNotif, ...state.notifications] });
  }

  return { syncedCount: synced, errors };
}
