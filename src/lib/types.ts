import type { ExpenseInput, Paise, SettlementInput, SplitMethod, SettlementStatus } from "./ledger";

export type Role = "super_admin" | "family_admin" | "organizer" | "member";
export type Rsvp = "going" | "maybe" | "declined" | "invited";
export type ExpenseCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "tickets"
  | "shopping"
  | "fuel"
  | "groceries"
  | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: Role;
  familyIds: string[];
  defaultFamilyId: string;
  createdAt: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  city: string;
  inviteCode: string;
  adminId: string;
  memberCount: number;
  createdAt: string;
  suspended?: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: Role;
  relation?: string;
  avatar?: string;
  phone?: string;
}

/** A ledger party: either one person, or a whole family accounted together. */
export interface Party {
  id: string;
  kind: "person" | "family";
  name: string;
  familyId: string;
  headcount: number;
  relation?: string;
}

export interface TripParticipant {
  partyId: string;
  rsvp: Rsvp;
  role?: "organizer" | "attendee";
}

export interface Trip {
  id: string;
  familyId: string;
  name: string;
  destination: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  budget: Paise; // in paise (₹1 = 100 paise)
  cover: string;
  organizerId: string;
  archived: boolean;
  participants: TripParticipant[];
  createdAt?: string;
}

export interface Expense extends ExpenseInput {
  tripId: string;
  description: string;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  notes?: string;
  receiptUrl?: string;
  hasReceipt?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Settlement extends SettlementInput {
  tripId: string;
  date: string;
  note?: string;
  recordedBy: string;
  createdAt?: string;
}

export interface RouteStop {
  id: string;
  tripId: string;
  dayNumber: number;
  order: number;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  notes?: string;
  plannedArrival?: string;
  estimatedDurationMinutes?: number;
}

export interface SavedRoute {
  id: string;
  tripId: string;
  name: string;
  travelMode: "driving" | "walking" | "bicycling";
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  stops: RouteStop[];
  geometryCoordinates?: [number, number][]; // [lat, lng] points for route line
}

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "none";

export interface ItineraryActivity {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  title: string;
  location?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  bookingRef?: string;
  bookingStatus?: BookingStatus;
  assignedPartyIds: string[];
  estimatedDurationMinutes?: number;
  estimatedCostPaise?: Paise;
  completed: boolean;
}

export type ChecklistCategory =
  | "tickets"
  | "hotel"
  | "vehicle"
  | "identification"
  | "medicines"
  | "luggage"
  | "electronics"
  | "snacks"
  | "emergency"
  | "payments"
  | "custom";

export interface ChecklistItem {
  id: string;
  tripId: string;
  category: ChecklistCategory;
  title: string;
  completed: boolean;
  assignedPartyId?: string;
  dueDate?: string;
  notes?: string;
}

export interface OfflineRegion {
  id: string;
  name: string;
  destination: string;
  minZoom: number;
  maxZoom: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  tileCount: number;
  sizeBytes: number;
  downloadedAt: string;
  status: "ready" | "downloading" | "failed";
}

export interface OfflineAction {
  id: string;
  entityType: "expense" | "settlement" | "itinerary" | "checklist" | "stop" | "trip";
  action: "create" | "update" | "delete";
  payload: any;
  timestamp: number;
  status: "pending" | "synced" | "failed";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  familyId?: string;
  tripId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "balance";
  read: boolean;
  createdAt: string;
  linkTo?: string;
}

export interface Photo {
  id: string;
  tripId: string;
  album: string;
  src: string;
  uploaderId: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  takenAt: string;
  uploadedAt: string;
  caption?: string;
  location?: string;
}

export type TripStatus = "upcoming" | "ongoing" | "completed";
