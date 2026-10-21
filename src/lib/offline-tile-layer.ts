import L from "leaflet";
import { getCachedTile, saveTile, calculateTilesInBounds, saveDownloadedRegion, type StorageEstimateResult } from "./offline-storage";
import type { OfflineRegion } from "./types";

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  percent: number;
  bytesDownloaded: number;
  currentTileUrl?: string;
}

export const TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const CARTO_VOYAGER_URL = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export class OfflineTileLayer extends L.TileLayer {
  private fallbackUrlTemplate: string;

  constructor(urlTemplate: string = CARTO_VOYAGER_URL, options?: L.TileLayerOptions) {
    super(urlTemplate, {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      ...options,
    });
    this.fallbackUrlTemplate = urlTemplate;
  }

  override createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement("img");
    tile.setAttribute("role", "presentation");
    tile.style.width = "256px";
    tile.style.height = "256px";

    const { z, x, y } = coords;

    // Check IndexedDB cache first
    getCachedTile(z, x, y)
      .then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          tile.onload = () => {
            URL.revokeObjectURL(url);
            done(undefined, tile);
          };
          tile.onerror = () => {
            URL.revokeObjectURL(url);
            done(new Error("Tile load error"), tile);
          };
          tile.src = url;
        } else if (navigator.onLine) {
          // If online and not in cache, fetch and opportunistically cache
          const tileUrl = this.getTileUrl(coords);
          fetch(tileUrl, { mode: "cors" })
            .then((resp) => {
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              return resp.blob();
            })
            .then((fetchedBlob) => {
              saveTile(z, x, y, tileUrl, fetchedBlob, "general").catch(() => {});
              const url = URL.createObjectURL(fetchedBlob);
              tile.onload = () => {
                URL.revokeObjectURL(url);
                done(undefined, tile);
              };
              tile.onerror = () => {
                URL.revokeObjectURL(url);
                done(new Error("Tile load error"), tile);
              };
              tile.src = url;
            })
            .catch(() => {
              // Direct img src fallback
              tile.onload = () => done(undefined, tile);
              tile.onerror = () => done(new Error("Tile offline"), tile);
              tile.src = tileUrl;
            });
        } else {
          // Offline and tile not cached: render graceful subtle placeholder
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = "#e2e8f0";
            ctx.strokeRect(0, 0, 256, 256);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Offline map area", 128, 120);
            ctx.fillText("Download region to view", 128, 140);
          }
          tile.src = canvas.toDataURL();
          done(undefined, tile);
        }
      })
      .catch((err) => {
        done(err, tile);
      });

    return tile;
  }
}

/**
 * Download a defined region for offline use.
 * Throttled to avoid overwhelming map providers and respect terms.
 */
export async function downloadRegionTiles(
  region: {
    id: string;
    name: string;
    destination: string;
    bounds: { north: number; south: number; east: number; west: number };
    minZoom: number;
    maxZoom: number;
  },
  onProgress: (p: DownloadProgress) => void,
  abortSignal?: AbortSignal,
): Promise<OfflineRegion> {
  const tilesToDownload = calculateTilesInBounds(region.bounds, region.minZoom, region.maxZoom);
  const total = tilesToDownload.length;
  let completed = 0;
  let failed = 0;
  let bytesDownloaded = 0;

  const concurrency = 4; // Friendly respectful concurrency
  let index = 0;

  async function worker() {
    while (index < tilesToDownload.length) {
      if (abortSignal?.aborted) throw new Error("Download cancelled");
      const i = index++;
      const { z, x, y } = tilesToDownload[i];

      // Check if already in cache
      const existing = await getCachedTile(z, x, y);
      if (existing) {
        completed++;
        bytesDownloaded += existing.size;
        onProgress({
          total,
          completed,
          failed,
          percent: Math.round(((completed + failed) / total) * 100),
          bytesDownloaded,
        });
        continue;
      }

      const url = CARTO_VOYAGER_URL.replace("{z}", String(z))
        .replace("{x}", String(x))
        .replace("{y}", String(y))
        .replace("{r}", "");

      try {
        const resp = await fetch(url, { signal: abortSignal, mode: "cors" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        await saveTile(z, x, y, url, blob, region.id);
        completed++;
        bytesDownloaded += blob.size;
      } catch (e: any) {
        if (abortSignal?.aborted) throw e;
        failed++;
      }

      onProgress({
        total,
        completed,
        failed,
        percent: Math.round(((completed + failed) / total) * 100),
        bytesDownloaded,
        currentTileUrl: url,
      });

      // Polite delay between batch requests
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  const downloadedRegion: OfflineRegion = {
    ...region,
    tileCount: completed,
    sizeBytes: bytesDownloaded,
    downloadedAt: new Date().toISOString(),
    status: completed > 0 ? "ready" : "failed",
  };

  await saveDownloadedRegion(downloadedRegion);
  return downloadedRegion;
}
