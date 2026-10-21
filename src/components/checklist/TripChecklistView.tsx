import { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Pill,
  Luggage,
  BatteryCharging,
  UtensilsCrossed,
  PhoneCall,
  CreditCard,
  Building,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppState,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from "@/lib/store";
import type { ChecklistCategory, ChecklistItem, Trip } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";

interface TripChecklistViewProps {
  trip: Trip;
}

const CATEGORY_ICONS: Record<ChecklistCategory, any> = {
  tickets: FileCheck,
  hotel: Building,
  vehicle: Car,
  identification: Shield,
  medicines: Pill,
  luggage: Luggage,
  electronics: BatteryCharging,
  snacks: UtensilsCrossed,
  emergency: PhoneCall,
  payments: CreditCard,
  custom: Tag,
};

const CATEGORIES: { id: ChecklistCategory; label: string }[] = [
  { id: "tickets", label: "Tickets & Flights" },
  { id: "hotel", label: "Hotels & Stays" },
  { id: "vehicle", label: "Vehicle & Travel" },
  { id: "identification", label: "IDs & Permits" },
  { id: "medicines", label: "Medicines & First Aid" },
  { id: "luggage", label: "Luggage & Clothing" },
  { id: "electronics", label: "Electronics & Chargers" },
  { id: "snacks", label: "Snacks & Water" },
  { id: "emergency", label: "Emergency Contacts" },
  { id: "payments", label: "Cash & Payments" },
  { id: "custom", label: "Other Tasks" },
];

export function TripChecklistView({ trip }: TripChecklistViewProps) {
  const { checklists, people } = useAppState();
  const tripItems = checklists.filter((c) => c.tripId === trip.id);

  const [selectedCategory, setSelectedCategory] = useState<ChecklistCategory | "all">("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string | "all">("all");

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChecklistCategory>("tickets");
  const [assignedPartyId, setAssignedPartyId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState("");

  const total = tripItems.length;
  const completed = tripItems.filter((i) => i.completed).length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const filteredItems = tripItems.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedAssignee !== "all" && item.assignedPartyId !== selectedAssignee) return false;
    return true;
  });

  const handleCreateItem = () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tripId: trip.id,
      category,
      title: title.trim(),
      completed: false,
      assignedPartyId: assignedPartyId || undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    };
    addChecklistItem(newItem);
    setAddModalOpen(false);
    setTitle("");
    setNotes("");
    setDueDate("");
  };

  return (
    <div className="grid gap-6">
      {/* SUMMARY HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Travel Checklist</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completed} of {total} items completed ({progressPct}%)
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="rounded-xl gap-2 font-bold text-xs">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* PROGRESS BAR */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2 shadow-sm">
        <div className="flex justify-between text-xs font-bold text-foreground">
          <span>Readiness Score</span>
          <span className="text-teal-600 dark:text-teal-400">{progressPct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="rounded-xl border border-border bg-card py-1.5 px-3 text-xs font-semibold text-foreground focus:outline-none"
        >
          <option value="all">All Categories ({tripItems.length})</option>
          {CATEGORIES.map((c) => {
            const count = tripItems.filter((i) => i.category === c.id).length;
            if (count === 0) return null;
            return (
              <option key={c.id} value={c.id}>
                {c.label} ({count})
              </option>
            );
          })}
        </select>

        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="rounded-xl border border-border bg-card py-1.5 px-3 text-xs font-semibold text-foreground focus:outline-none"
        >
          <option value="all">All Assignees</option>
          {trip.participants.map((p) => {
            const person = people.find((item) => item.id === p.partyId);
            return (
              <option key={p.partyId} value={p.partyId}>
                {person?.name || p.partyId}
              </option>
            );
          })}
        </select>
      </div>

      {/* ITEMS LIST */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
            <CheckSquare className="mx-auto h-10 w-10 opacity-30 mb-2" />
            <div className="font-semibold text-sm">No checklist items match filters</div>
            <div className="text-xs text-muted-foreground mt-1">Add items or clear your category filters.</div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Tag;
            const assignee = people.find((p) => p.id === item.assignedPartyId);
            return (
              <div
                key={item.id}
                className={cn(
                  "group flex items-start gap-3.5 rounded-2xl border p-3.5 transition-all shadow-sm bg-card",
                  item.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-75" : "border-border/80 hover:border-primary/40",
                )}
              >
                {/* CHECKBOX */}
                <button
                  onClick={() => toggleChecklistItem(item.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="h-5 w-5 opacity-40 hover:opacity-100" />
                  )}
                </button>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-semibold text-foreground",
                        item.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {item.title}
                    </span>
                    <button
                      onClick={() => deleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium capitalize">
                      <Icon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {item.category}
                    </span>

                    {assignee && (
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <User className="h-3.5 w-3.5" />
                        {assignee.name}
                      </span>
                    )}

                    {item.dueDate && (
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Due {new Date(item.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD ITEM MODAL */}
      <ResponsiveModal open={addModalOpen} onOpenChange={setAddModalOpen} title="Add Checklist Item">
        <div className="grid gap-3.5 p-1 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Photocopy Aadhaar cards, Carry prescription meds"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ChecklistCategory)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Assigned Person</label>
              <select
                value={assignedPartyId}
                onChange={(e) => setAssignedPartyId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                <option value="">Unassigned</option>
                {trip.participants.map((p) => {
                  const person = people.find((item) => item.id === p.partyId);
                  return (
                    <option key={p.partyId} value={p.partyId}>
                      {person?.name || p.partyId}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <Button onClick={handleCreateItem} className="w-full rounded-xl mt-2 font-bold text-xs">
            Save Item
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
