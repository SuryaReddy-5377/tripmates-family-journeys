import type {
  Expense,
  FamilyGroup,
  Party,
  Person,
  Settlement,
  Trip,
  RouteStop,
  SavedRoute,
  ItineraryActivity,
  ChecklistItem,
  AuditLog,
  AppNotification,
  User,
} from "./types";

export const CURRENT_USER: User = {
  id: "surya",
  name: "Surya Reddy",
  email: "surya.reddy@gmail.com",
  role: "super_admin",
  phone: "+91 98765 43210",
  familyIds: ["fam_reddy"],
  defaultFamilyId: "fam_reddy",
  createdAt: "2026-01-01T10:00:00Z",
};

export const CURRENT_USER_ID = CURRENT_USER.id;

// Single real family circle: Reddy Family (Hyderabad)
export const families: FamilyGroup[] = [
  {
    id: "fam_reddy",
    name: "Reddy Family",
    city: "Hyderabad",
    inviteCode: "REDDY2026",
    adminId: "surya",
    memberCount: 1,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const people: Person[] = [
  {
    id: "surya",
    name: "Surya Reddy",
    email: "surya.reddy@gmail.com",
    familyId: "fam_reddy",
    role: "super_admin",
    relation: "Self / Admin",
  },
];

export const parties: Party[] = [
  {
    id: "surya",
    kind: "person",
    name: "Surya Reddy",
    familyId: "fam_reddy",
    headcount: 1,
    relation: "Self",
  },
];

// Clean start: No fake demo trips or random expenses
export const initialTrips: Trip[] = [];
export const initialExpenses: Expense[] = [];
export const initialSettlements: Settlement[] = [];
export const initialStops: RouteStop[] = [];
export const initialSavedRoutes: SavedRoute[] = [];
export const initialActivities: ItineraryActivity[] = [];
export const initialChecklists: ChecklistItem[] = [];

export const initialAuditLogs: AuditLog[] = [
  {
    id: "audit_1",
    timestamp: new Date().toISOString(),
    actorId: "surya",
    actorName: "Surya Reddy",
    action: "create_family",
    entityType: "family",
    entityId: "fam_reddy",
    details: "Initialized Reddy Family workspace in Hyderabad",
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif_1",
    userId: "surya",
    title: "Welcome to TripMates 2.0",
    message: "Your private family travel workspace is ready. Create your first trip to get started!",
    type: "info",
    read: false,
    createdAt: new Date().toISOString(),
    linkTo: "/trips/new",
  },
];
