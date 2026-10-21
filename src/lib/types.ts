import type { ExpenseInput, Paise, SettlementInput } from "./ledger";

export type Role = "family_admin" | "organizer" | "member";
export type Rsvp = "going" | "maybe" | "declined" | "invited";
export type ExpenseCategory = "transport" | "accommodation" | "food" | "tickets" | "fuel" | "shopping" | "other";

export interface Person {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: Role;
  relation?: string;
}

export interface FamilyGroup {
  id: string;
  name: string;
  city: string;
}

/** A ledger party: either one person, or a whole family accounted together. */
export interface Party {
  id: string;
  kind: "person" | "family";
  name: string;
  familyId: string;
  /** headcount represented — used as default weight for "shares" split */
  headcount: number;
}

export interface TripParticipant {
  partyId: string;
  rsvp: Rsvp;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  budget: Paise;
  cover: string;
  organizerId: string;
  archived: boolean;
  participants: TripParticipant[];
}

export interface Expense extends ExpenseInput {
  tripId: string;
  description: string;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  hasReceipt?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Settlement extends SettlementInput {
  tripId: string;
  date: string;
  note?: string;
  recordedBy: string;
}

export interface Photo {
  id: string;
  tripId: string;
  album: string;
  src: string; // thumbnail / preview url (never the original in grids)
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
