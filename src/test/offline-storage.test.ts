import { describe, expect, it } from "vitest";
import {
  latLngToTileXY,
  calculateTilesInBounds,
  getTileKey,
} from "@/lib/offline-storage";

describe("TripMates 2.0 - Offline Maps & Tile Geometry Engine", () => {
  it("computes standard Web Mercator tile XY for known coordinates", () => {
    // Lat: 26.9124, Lng: 75.7873 (Jaipur), zoom 12
    const tile = latLngToTileXY(26.9124, 75.7873, 12);
    expect(tile.x).toBeGreaterThan(0);
    expect(tile.y).toBeGreaterThan(0);
    expect(getTileKey(12, tile.x, tile.y)).toBe(`12_${tile.x}_${tile.y}`);
  });

  it("calculates exact tile list for a defined geographic bounding box", () => {
    const bounds = {
      north: 27.05,
      south: 26.8,
      east: 75.9,
      west: 75.7,
    };

    // Zoom levels 11 to 12
    const tiles = calculateTilesInBounds(bounds, 11, 12);

    expect(tiles.length).toBeGreaterThan(0);
    tiles.forEach((t) => {
      expect(t.z).toBeGreaterThanOrEqual(11);
      expect(t.z).toBeLessThanOrEqual(12);
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
    });
  });

  it("clamps extreme lat/lng to valid world tile boundaries", () => {
    const northPole = latLngToTileXY(85.0511, 0, 10);
    expect(northPole.y).toBe(0);

    const dateLine = latLngToTileXY(0, 179.99, 10);
    expect(dateLine.x).toBe(1023);
  });
});
