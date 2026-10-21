/**
 * PHASE 1 SAMPLE DATA — realistic, but fictional. Replaced by the database in Phase 2.
 */
import goa from "@/assets/trip-goa.jpg";
import kerala from "@/assets/trip-kerala.jpg";
import jaipur from "@/assets/trip-jaipur.jpg";
import manali from "@/assets/trip-manali.jpg";
import familyBeach from "@/assets/photo-family-beach.jpg";
import meal from "@/assets/photo-meal.jpg";
import kidsSnow from "@/assets/photo-kids-snow.jpg";
import bazaar from "@/assets/photo-bazaar.jpg";
import type { Expense, FamilyGroup, Party, Person, Photo, Settlement, Trip } from "./types";

export const CURRENT_USER_ID = "surya";

export const families: FamilyGroup[] = [
  { id: "reddy", name: "Reddy Family", city: "Hyderabad" },
  { id: "rao", name: "Rao Family", city: "Bengaluru" },
  { id: "kumar", name: "Kumar Family", city: "Chennai" },
  { id: "varma", name: "Varma Family", city: "Visakhapatnam" },
];

export const people: Person[] = [
  { id: "surya", name: "Surya Reddy", email: "surya@example.com", familyId: "reddy", role: "family_admin" },
  { id: "lakshmi", name: "Lakshmi Reddy", email: "lakshmi@example.com", familyId: "reddy", role: "member", relation: "Spouse" },
  { id: "ramesh", name: "Ramesh Reddy", email: "ramesh@example.com", familyId: "reddy", role: "organizer", relation: "Father" },
  { id: "padma", name: "Padma Reddy", email: "padma@example.com", familyId: "reddy", role: "member", relation: "Mother" },
  { id: "kiran", name: "Kiran Rao", email: "kiran@example.com", familyId: "rao", role: "organizer" },
  { id: "divya", name: "Divya Rao", email: "divya@example.com", familyId: "rao", role: "member" },
  { id: "arjun", name: "Arjun Kumar", email: "arjun@example.com", familyId: "kumar", role: "organizer" },
  { id: "meena", name: "Meena Kumar", email: "meena@example.com", familyId: "kumar", role: "member" },
  { id: "vikram", name: "Vikram Kumar", email: "vikram@example.com", familyId: "kumar", role: "member" },
  { id: "sneha", name: "Sneha Varma", email: "sneha@example.com", familyId: "varma", role: "member" },
  { id: "rahul", name: "Rahul Varma", email: "rahul@example.com", familyId: "varma", role: "member" },
  { id: "ananya", name: "Ananya Varma", email: "ananya@example.com", familyId: "varma", role: "member" },
];

export const parties: Party[] = [
  ...people.map((p) => ({ id: p.id, kind: "person" as const, name: p.name, familyId: p.familyId, headcount: 1 })),
  { id: "fam-rao", kind: "family", name: "Rao Family", familyId: "rao", headcount: 4 },
  { id: "fam-varma", kind: "family", name: "Varma Family", familyId: "varma", headcount: 3 },
];

const P = (id: string, rsvp: Trip["participants"][number]["rsvp"] = "going") => ({ partyId: id, rsvp });

export const initialTrips: Trip[] = [
  {
    id: "rajasthan-2026",
    name: "Rajasthan Heritage Week",
    destination: "Jaipur & Amer, Rajasthan",
    description: "Forts, bazaars and a long-promised trip for Amma and Nanna. Base at a haveli in the old city.",
    startDate: "2026-10-18",
    endDate: "2026-10-25",
    budget: 32000000,
    cover: jaipur,
    organizerId: "ramesh",
    archived: false,
    participants: [P("surya"), P("lakshmi"), P("ramesh"), P("padma"), P("fam-rao"), P("arjun"), P("meena"), P("sneha", "declined")],
  },
  {
    id: "manali-2026",
    name: "New Year in the Snow",
    destination: "Manali, Himachal Pradesh",
    description: "Cottages near Old Manali, a day at Solang Valley, and bonfire on New Year's Eve.",
    startDate: "2026-12-28",
    endDate: "2027-01-03",
    budget: 45000000,
    cover: manali,
    organizerId: "arjun",
    archived: false,
    participants: [P("surya"), P("lakshmi"), P("arjun"), P("meena"), P("vikram", "maybe"), P("fam-varma"), P("kiran", "invited"), P("divya", "invited")],
  },
  {
    id: "kerala-2026",
    name: "Kerala Backwaters",
    destination: "Alleppey & Munnar, Kerala",
    description: "Two nights on a houseboat, then tea estates in Munnar.",
    startDate: "2026-04-10",
    endDate: "2026-04-16",
    budget: 28000000,
    cover: kerala,
    organizerId: "kiran",
    archived: false,
    participants: [P("surya"), P("lakshmi"), P("kiran"), P("divya"), P("ramesh"), P("padma")],
  },
  {
    id: "goa-2025",
    name: "Goa Christmas Getaway",
    destination: "South Goa",
    description: "Beach villa in Palolem for the whole gang. Fully settled.",
    startDate: "2025-12-22",
    endDate: "2025-12-28",
    budget: 24000000,
    cover: goa,
    organizerId: "surya",
    archived: false,
    participants: [P("surya"), P("lakshmi"), P("arjun"), P("meena"), P("fam-rao")],
  },
  {
    id: "shimla-2025",
    name: "Shimla Winter Break",
    destination: "Shimla & Kufri",
    description: "The kids' first snow. Archived memory album.",
    startDate: "2025-01-04",
    endDate: "2025-01-09",
    budget: 15000000,
    cover: kidsSnow,
    organizerId: "ramesh",
    archived: true,
    participants: [P("surya"), P("ramesh"), P("padma"), P("fam-varma")],
  },
];

let n = 0;
const E = (
  tripId: string,
  date: string,
  description: string,
  category: Expense["category"],
  rupees: number,
  paidBy: string,
  participants: string[],
  extra: Partial<Expense> = {},
): Expense => ({
  id: `exp-${++n}`,
  tripId,
  date,
  description,
  category,
  amount: Math.round(rupees * 100),
  paidBy,
  participants,
  splitMethod: "equal",
  createdBy: paidBy,
  createdAt: `${date}T18:00:00.000Z`,
  ...extra,
});

const RJ = ["surya", "lakshmi", "ramesh", "padma", "fam-rao", "arjun", "meena"];
const GOA = ["surya", "lakshmi", "arjun", "meena", "fam-rao"];
const KER = ["surya", "lakshmi", "kiran", "divya", "ramesh", "padma"];

export const initialExpenses: Expense[] = [
  E("rajasthan-2026", "2026-10-18", "Haveli stay — 7 nights", "accommodation", 126000, "ramesh", RJ, { hasReceipt: true, splitMethod: "shares", splitValues: { "fam-rao": 4 } }),
  E("rajasthan-2026", "2026-10-18", "Hyderabad → Jaipur flights", "transport", 58450, "surya", ["surya", "lakshmi", "ramesh", "padma"], { hasReceipt: true }),
  E("rajasthan-2026", "2026-10-19", "Amer Fort tickets & guide", "tickets", 7350, "arjun", RJ),
  E("rajasthan-2026", "2026-10-19", "Dinner at Chokhi Dhani", "food", 14820.5, "kiran", RJ, { createdBy: "kiran", paidBy: "fam-rao", splitMethod: "shares", splitValues: { "fam-rao": 4 } }),
  E("rajasthan-2026", "2026-10-20", "Tempo traveller — 3 days", "transport", 21000, "meena", RJ, { notes: "Driver: Mahesh, includes tolls" }),
  E("rajasthan-2026", "2026-10-20", "Lunch at LMB", "food", 4210, "lakshmi", ["surya", "lakshmi", "ramesh", "padma", "arjun", "meena"], { notes: "Rao family had already eaten" }),
  E("rajasthan-2026", "2026-10-21", "Fuel top-up", "fuel", 3600, "arjun", RJ),

  E("manali-2026", "2026-09-30", "Cottage booking advance", "accommodation", 40000, "arjun", ["surya", "lakshmi", "arjun", "meena", "fam-varma"], { hasReceipt: true }),

  E("kerala-2026", "2026-04-10", "Houseboat — 2 nights", "accommodation", 54000, "kiran", KER, { hasReceipt: true }),
  E("kerala-2026", "2026-04-10", "Kochi airport cabs", "transport", 6800, "surya", KER),
  E("kerala-2026", "2026-04-12", "Munnar homestay", "accommodation", 36000, "ramesh", KER),
  E("kerala-2026", "2026-04-13", "Sadya lunch", "food", 4500, "divya", KER),
  E("kerala-2026", "2026-04-14", "Tea museum & Eravikulam tickets", "tickets", 3900, "lakshmi", KER),
  E("kerala-2026", "2026-04-15", "Spice market shopping", "shopping", 2750, "padma", ["padma", "lakshmi"]),

  E("goa-2025", "2025-12-22", "Palolem beach villa", "accommodation", 96000, "surya", GOA, { hasReceipt: true }),
  E("goa-2025", "2025-12-23", "Scooter rentals", "transport", 7500, "arjun", GOA),
  E("goa-2025", "2025-12-24", "Christmas Eve dinner", "food", 18640, "meena", GOA),
  E("goa-2025", "2025-12-26", "Dolphin boat ride", "tickets", 6000, "fam-rao", GOA),

  E("shimla-2025", "2025-01-04", "Hotel in Kufri", "accommodation", 42000, "ramesh", ["surya", "ramesh", "padma", "fam-varma"]),
  E("shimla-2025", "2025-01-06", "Toy train & cabs", "transport", 9600, "surya", ["surya", "ramesh", "padma", "fam-varma"]),
];

export const initialSettlements: Settlement[] = [
  { id: "set-1", tripId: "rajasthan-2026", from: "padma", to: "ramesh", amount: 1000000, status: "confirmed", date: "2026-10-19", note: "UPI", recordedBy: "padma" },
  { id: "set-2", tripId: "rajasthan-2026", from: "arjun", to: "surya", amount: 500000, status: "pending", date: "2026-10-21", note: "Partial — rest after trip", recordedBy: "arjun" },
  { id: "set-3", tripId: "kerala-2026", from: "divya", to: "kiran", amount: 800000, status: "confirmed", date: "2026-04-20", recordedBy: "divya" },
  { id: "set-4", tripId: "kerala-2026", from: "padma", to: "ramesh", amount: 1500000, status: "confirmed", date: "2026-04-20", recordedBy: "padma" },
];

const ph = (
  id: string,
  tripId: string,
  album: string,
  src: string,
  uploaderId: string,
  originalFilename: string,
  sizeMB: number,
  takenAt: string,
  extra: Partial<Photo> = {},
): Photo => ({
  id,
  tripId,
  album,
  src,
  uploaderId,
  originalFilename,
  contentType: originalFilename.toLowerCase().endsWith(".heic") ? "image/heic" : "image/jpeg",
  sizeBytes: Math.round(sizeMB * 1024 * 1024),
  width: 4032,
  height: 3024,
  takenAt,
  uploadedAt: takenAt,
  ...extra,
});

export const initialPhotos: Photo[] = [
  ph("ph-1", "rajasthan-2026", "Amer Fort", jaipur, "surya", "IMG_20261019_174512.jpg", 6.2, "2026-10-19T17:45:00Z", { caption: "Golden hour at Amer", location: "Amer Fort" }),
  ph("ph-2", "rajasthan-2026", "Old City", bazaar, "lakshmi", "IMG_20261020_113009.HEIC", 3.1, "2026-10-20T11:30:00Z", { caption: "Bangle shopping in Johari Bazaar", location: "Johari Bazaar" }),
  ph("ph-3", "rajasthan-2026", "Food", meal, "meena", "PXL_20261020_131544.jpg", 4.8, "2026-10-20T13:15:00Z", { location: "Jaipur" }),
  ph("ph-4", "goa-2025", "Beach days", familyBeach, "surya", "IMG_20251224_181203.jpg", 5.4, "2025-12-24T18:12:00Z", { caption: "Evening walk, all of us", location: "Palolem" }),
  ph("ph-5", "goa-2025", "Beach days", goa, "arjun", "DSC_0412.jpg", 11.6, "2025-12-25T17:58:00Z", { location: "Palolem" }),
  ph("ph-6", "kerala-2026", "Houseboat", kerala, "kiran", "IMG_20260411_064455.jpg", 7.9, "2026-04-11T06:44:00Z", { caption: "Misty morning on the houseboat", location: "Alleppey" }),
  ph("ph-7", "kerala-2026", "Food", meal, "divya", "IMG_20260413_125501.HEIC", 2.9, "2026-04-13T12:55:00Z", { caption: "Onam-style sadya", location: "Munnar" }),
  ph("ph-8", "shimla-2025", "Snow day", kidsSnow, "ramesh", "IMG_20250105_101122.jpg", 4.4, "2025-01-05T10:11:00Z", { caption: "First snowball fight", location: "Kufri" }),
  ph("ph-9", "shimla-2025", "Snow day", manali, "surya", "IMG_20250106_092310.jpg", 8.3, "2025-01-06T09:23:00Z", { location: "Kufri" }),
];

export const INVITE_CODE_PREVIEW = "REDDY-••••-26";
