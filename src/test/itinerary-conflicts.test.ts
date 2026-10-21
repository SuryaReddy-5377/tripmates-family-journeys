import { describe, expect, it } from "vitest";

describe("TripMates 2.0 - Itinerary Conflict Detection", () => {
  function hasConflict(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }

  it("detects direct overlapping time slots on the same day", () => {
    // 10:00 - 12:00 overlaps with 11:00 - 13:00
    expect(hasConflict("10:00", "12:00", "11:00", "13:00")).toBe(true);

    // 09:00 - 10:30 overlaps with 10:15 - 11:00
    expect(hasConflict("09:00", "10:30", "10:15", "11:00")).toBe(true);

    // 14:00 - 16:00 completely engulfs 14:30 - 15:30
    expect(hasConflict("14:00", "16:00", "14:30", "15:30")).toBe(true);
  });

  it("permits back-to-back non-overlapping activities", () => {
    // 09:00 - 10:00 and 10:00 - 11:30 do not overlap
    expect(hasConflict("09:00", "10:00", "10:00", "11:30")).toBe(false);

    // 11:30 - 13:00 and 14:00 - 16:00 do not overlap
    expect(hasConflict("11:30", "13:00", "14:00", "16:00")).toBe(false);
  });
});
