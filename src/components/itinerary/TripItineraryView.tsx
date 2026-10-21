import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  DollarSign,
  Users,
  Building,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAppState,
  addActivity,
  updateActivity,
  deleteActivity,
  toggleActivityComplete,
} from "@/lib/store";
import { formatINR } from "@/lib/ledger";
import type { BookingStatus, ItineraryActivity, Trip } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { PartyAvatar } from "@/components/app/bits";

interface TripItineraryViewProps {
  trip: Trip;
  initialAddActivity?: boolean;
}

export function TripItineraryView({ trip, initialAddActivity }: TripItineraryViewProps) {
  const { activities, people } = useAppState();
  const tripActivities = activities.filter((a) => a.tripId === trip.id);

  // Derive unique dates
  const dates = Array.from(new Set(tripActivities.map((a) => a.date))).sort();
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || trip.startDate);

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(initialAddActivity || false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("none");
  const [assignedPartyIds, setAssignedPartyIds] = useState<string[]>([]);
  const [costRupees, setCostRupees] = useState("");

  const currentDayActivities = tripActivities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Detect time scheduling conflicts
  const conflicts: { a: ItineraryActivity; b: ItineraryActivity }[] = [];
  for (let i = 0; i < currentDayActivities.length; i++) {
    for (let j = i + 1; j < currentDayActivities.length; j++) {
      const act1 = currentDayActivities[i];
      const act2 = currentDayActivities[j];
      const end1 = act1.endTime || act1.startTime;
      const end2 = act2.endTime || act2.startTime;
      if (act1.startTime < end2 && act2.startTime < end1) {
        conflicts.push({ a: act1, b: act2 });
      }
    }
  }

  const handleSaveActivity = () => {
    if (!title.trim()) {
      alert("Please enter activity name");
      return;
    }
    const costPaise = costRupees ? Math.round(parseFloat(costRupees) * 100) : undefined;
    const newAct: ItineraryActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tripId: trip.id,
      date,
      startTime,
      endTime: endTime || undefined,
      title,
      location: location || undefined,
      notes: notes || undefined,
      bookingRef: bookingRef || undefined,
      bookingStatus,
      assignedPartyIds: assignedPartyIds.length > 0 ? assignedPartyIds : trip.participants.map((p) => p.partyId),
      estimatedCostPaise: costPaise,
      completed: false,
    };
    addActivity(newAct);
    setAddModalOpen(false);
    setTitle("");
    setLocation("");
    setNotes("");
    setBookingRef("");
    setCostRupees("");
  };

  const toggleAssignee = (id: string) => {
    setAssignedPartyIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <div className="grid gap-6">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Day-by-Day Itinerary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tripActivities.length} planned activities across trip days
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="rounded-xl gap-2 font-bold text-xs">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {/* DATE SELECTOR TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(dates.length > 0 ? dates : [trip.startDate]).map((d, idx) => {
          const actCount = tripActivities.filter((a) => a.date === d).length;
          return (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={cn(
                "flex flex-col items-start min-w-[130px] rounded-2xl border p-3 text-left transition-all shrink-0",
                selectedDate === d
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border/80 bg-card hover:bg-secondary/60 text-foreground",
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Day {idx + 1}</span>
              <span className="font-bold text-xs mt-0.5">{new Date(d).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
              <span className="text-[10px] mt-1 opacity-80">{actCount} event{actCount === 1 ? "" : "s"}</span>
            </button>
          );
        })}
      </div>

      {/* SCHEDULING CONFLICT WARNING */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200 fade-up">
          <div className="flex items-center gap-2 font-bold mb-1 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Schedule Conflict Warning ({conflicts.length})</span>
          </div>
          <div className="space-y-1 mt-1 text-xs">
            {conflicts.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                • <span className="font-semibold">"{c.a.title}"</span> ({c.a.startTime} - {c.a.endTime}) overlaps with{" "}
                <span className="font-semibold">"{c.b.title}"</span> ({c.b.startTime} - {c.b.endTime}).
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE ACTIVITIES LIST */}
      <div className="space-y-4">
        {currentDayActivities.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground bg-card">
            <Calendar className="mx-auto h-10 w-10 opacity-30 mb-2" />
            <div className="font-semibold text-sm">No activities scheduled for this day</div>
            <div className="text-xs text-muted-foreground mt-1">Add flights, hotel check-ins, meals or sightseeing tours.</div>
            <Button onClick={() => setAddModalOpen(true)} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
              Add First Event
            </Button>
          </div>
        ) : (
          currentDayActivities.map((act) => {
            return (
              <div
                key={act.id}
                className={cn(
                  "group relative flex items-start gap-4 rounded-2xl border p-4.5 transition-all shadow-soft bg-card",
                  act.completed ? "border-emerald-500/30 bg-emerald-500/5 opacity-80" : "border-border/80 hover:border-primary/40",
                )}
              >
                {/* COMPLETION TOGGLE BUTTON */}
                <button
                  onClick={() => toggleActivityComplete(act.id)}
                  title={act.completed ? "Mark incomplete" : "Mark completed"}
                  className="mt-1 text-muted-foreground hover:text-primary shrink-0 transition-colors"
                >
                  {act.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 opacity-40 hover:opacity-100" />
                  )}
                </button>

                {/* DETAILS */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className={cn("font-bold text-sm text-foreground", act.completed && "line-through text-muted-foreground")}>
                      {act.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {act.bookingStatus && act.bookingStatus !== "none" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                            act.bookingStatus === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
                          )}
                        >
                          {act.bookingStatus.toUpperCase()}
                        </span>
                      )}
                      <button
                        onClick={() => deleteActivity(act.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive transition-opacity"
                        title="Delete activity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* TIME & LOCATION */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5 text-foreground font-semibold">
                      <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      {act.startTime} {act.endTime ? `— ${act.endTime}` : ""}
                    </span>

                    {act.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {act.location}
                      </span>
                    )}

                    {act.bookingRef && (
                      <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-mono text-[11px]">
                        <FileText className="h-3 w-3" />
                        Ref: {act.bookingRef}
                      </span>
                    )}

                    {typeof act.estimatedCostPaise === "number" && act.estimatedCostPaise > 0 && (
                      <span className="font-semibold text-foreground">
                        Cost: {formatINR(act.estimatedCostPaise)}
                      </span>
                    )}
                  </div>

                  {/* NOTES */}
                  {act.notes && (
                    <div className="mt-2 rounded-xl bg-secondary/50 p-2.5 text-xs text-muted-foreground italic">
                      "{act.notes}"
                    </div>
                  )}

                  {/* ASSIGNED ATTENDEES */}
                  {act.assignedPartyIds && act.assignedPartyIds.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Attendees:</span>
                      <div className="flex -space-x-1.5">
                        {act.assignedPartyIds.map((pId) => {
                          const p = people.find((person) => person.id === pId);
                          return (
                            <PartyAvatar key={pId} name={p?.name || pId} className="h-6 w-6 text-[10px] ring-2 ring-card" />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD ACTIVITY MODAL */}
      <ResponsiveModal open={addModalOpen} onOpenChange={setAddModalOpen} title="Schedule Itinerary Activity">
        <div className="grid gap-3.5 p-1 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Activity Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fort Guided Tour, Sunrise Yoga, Royal Dinner"
              className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-2 text-xs font-medium text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-2 text-xs font-medium text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-input bg-background py-2 px-2 text-xs font-medium text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Location / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Amer Palace East Wing"
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Est. Cost (₹ INR)</label>
              <input
                type="number"
                value={costRupees}
                onChange={(e) => setCostRupees(e.target.value)}
                placeholder="e.g. 2400"
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Booking Status</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              >
                <option value="none">No Booking Needed</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-foreground mb-1">Booking Reference #</label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                placeholder="e.g. PNR / Booking ID"
                className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-medium text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Carry warm jackets, tickets saved in offline storage"
              className="w-full rounded-xl border border-input bg-background p-2 text-xs font-medium text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1.5">Assign Family Members</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-border rounded-xl p-2 bg-secondary/30">
              {trip.participants.map((part) => {
                const person = people.find((p) => p.id === part.partyId);
                const selected = assignedPartyIds.includes(part.partyId);
                return (
                  <button
                    key={part.partyId}
                    type="button"
                    onClick={() => toggleAssignee(part.partyId)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold border transition-all",
                      selected ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border",
                    )}
                  >
                    <span>{person?.name || part.partyId}</span>
                    {selected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSaveActivity} className="w-full rounded-xl mt-2 text-xs font-bold">
            Save Activity to Itinerary
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
}
