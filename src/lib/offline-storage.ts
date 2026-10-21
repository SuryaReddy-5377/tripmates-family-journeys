import { openDB, type IDBPDatabase } from "idb";
import type { OfflineAction, OfflineRegion } from "./types";

const DB_NAME = "tripmates_offline_db";
const DB_VERSION = 1;

interface CachedTile {
  tileKey: string; // e.g. "z_x_y" or full url
  url: string;
  blob: Blob;
  regionId: string;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window) || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not supported or not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("tiles")) {
          const tileStore = db.createObjectStore("tiles", { keyPath: "tileKey" });
          tileStore.createIndex("regionId", "regionId", { unique: false });
        }
        if (!db.objectStoreNames.contains("regions")) {
          db.createObjectStore("regions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("action_queue")) {
          const queueStore = db.createObjectStore("action_queue", { keyPath: "id" });
          queueStore.createIndex("status", "status", { unique: false });
          queueStore.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains("cached_state")) {
          db.createObjectStore("cached_state", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

// ----------------- TILE CACHING -----------------

export function getTileKey(z: number, x: number, y: number): string {
  return `${z}_${x}_${y}`;
}

export async function getCachedTile(z: number, x: number, y: number): Promise<Blob | null> {
  try {
    const db = await getDB();
    const key = getTileKey(z, x, y);
    const item = await db.get("tiles", key);
    return item ? item.blob : null;
  } catch (err) {
    console.warn("Failed to get cached tile:", err);
    return null;
  }
}

export async function saveTile(
  z: number,
  x: number,
  y: number,
  url: string,
  blob: Blob,
  regionId: string = "general",
): Promise<void> {
  try {
    const db = await getDB();
    const key = getTileKey(z, x, y);
    await db.put("tiles", {
      tileKey: key,
      url,
      blob,
      regionId,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn("Failed to save tile:", err);
  }
}

// ----------------- REGION MANAGEMENT -----------------

export async function getDownloadedRegions(): Promise<OfflineRegion[]> {
  try {
    const db = await getDB();
    return await db.getAll("regions");
  } catch {
    return [];
  }
}

export async function saveDownloadedRegion(region: OfflineRegion): Promise<void> {
  const db = await getDB();
  await db.put("regions", region);
}

export async function deleteDownloadedRegion(regionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["tiles", "regions"], "readwrite");
  const tileStore = tx.objectStore("tiles");
  const regionIndex = tileStore.index("regionId");
  let cursor = await regionIndex.openCursor(IDBKeyRange.only(regionId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.objectStore("regions").delete(regionId);
  await tx.done;
}

// ----------------- STORAGE QUOTA CHECK -----------------

export interface StorageEstimateResult {
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
  percentUsed: number;
  persistent: boolean;
}

export async function checkStorageEstimate(): Promise<StorageEstimateResult> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.estimate) {
    return {
      quotaBytes: 1024 * 1024 * 1024,
      usedBytes: 0,
      availableBytes: 1024 * 1024 * 1024,
      percentUsed: 0,
      persistent: false,
    };
  }
  try {
    const estimate = await navigator.storage.estimate();
    const isPersistent = (await navigator.storage.persisted?.()) || false;
    const quota = estimate.quota || 1024 * 1024 * 1024;
    const usage = estimate.usage || 0;
    const available = Math.max(0, quota - usage);
    return {
      quotaBytes: quota,
      usedBytes: usage,
      availableBytes: available,
      percentUsed: Math.round((usage / quota) * 100),
      persistent: isPersistent,
    };
  } catch {
    return {
      quotaBytes: 1024 * 1024 * 1024,
      usedBytes: 0,
      availableBytes: 1024 * 1024 * 1024,
      percentUsed: 0,
      persistent: false,
    };
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

// ----------------- TILE COORDINATE CALCULATIONS -----------------

export function latLngToTileXY(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

export function calculateTilesInBounds(
  bounds: { north: number; south: number; east: number; west: number },
  minZoom: number,
  maxZoom: number,
): { z: number; x: number; y: number }[] {
  const tiles: { z: number; x: number; y: number }[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const nw = latLngToTileXY(bounds.north, bounds.west, z);
    const se = latLngToTileXY(bounds.south, bounds.east, z);
    const minX = Math.min(nw.x, se.x);
    const maxX = Math.max(nw.x, se.x);
    const minY = Math.min(nw.y, se.y);
    const maxY = Math.max(nw.y, se.y);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

// ----------------- OFFLINE ACTION QUEUE -----------------

export async function enqueueOfflineAction(action: Omit<OfflineAction, "id" | "timestamp" | "status">): Promise<string> {
  const db = await getDB();
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fullAction: OfflineAction = {
    ...action,
    id,
    timestamp: Date.now(),
    status: "pending",
  };
  await db.put("action_queue", fullAction);
  return id;
}

export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await getDB();
    const actions: OfflineAction[] = await db.getAllFromIndex("action_queue", "status", "pending");
    return actions.sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

export async function markOfflineActionStatus(id: string, status: "pending" | "synced" | "failed"): Promise<void> {
  const db = await getDB();
  const action = await db.get("action_queue", id);
  if (action) {
    action.status = status;
    await db.put("action_queue", action);
  }
}

export async function removeOfflineAction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("action_queue", id);
}

// ----------------- OFFLINE STATE PERSISTENCE -----------------

export async function saveOfflineCachedState(key: string, data: any): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window) || !window.indexedDB) {
    return;
  }
  try {
    const db = await getDB();
    await db.put("cached_state", { key, data, timestamp: Date.now() });
  } catch (e) {
    // Graceful fallback
  }
}

export async function getOfflineCachedState<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined" || !("indexedDB" in window) || !window.indexedDB) {
    return null;
  }
  try {
    const db = await getDB();
    const item = await db.get("cached_state", key);
    return item ? (item.data as T) : null;
  } catch {
    return null;
  }
}
