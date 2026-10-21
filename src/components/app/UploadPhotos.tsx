import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ImagePlus, RotateCcw, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { addPhotos, newId, useAppState } from "@/lib/store";
import { CURRENT_USER_ID } from "@/lib/sample-data";
import { formatBytes } from "@/lib/trips";
import { imageSize, makeThumbnail, MAX_FILES_PER_BATCH, sessionOriginals, validatePhotoFile } from "@/lib/photos";
import type { Photo, Trip } from "@/lib/types";
import { selectClass } from "./AddExpenseForm";

type ItemStatus = "queued" | "uploading" | "done" | "error" | "cancelled";
interface Item {
  key: string;
  file: File;
  status: ItemStatus;
  progress: number;
  error?: string;
}

const NEW_ALBUM = "__new__";

export function UploadPhotos({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const { photos } = useAppState();
  const albums = Array.from(new Set(photos.filter((p) => p.tripId === trip.id).map((p) => p.album)));
  const [album, setAlbum] = useState(albums[0] ?? NEW_ALBUM);
  const [newAlbum, setNewAlbum] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setInterval>>());

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const albumName = album === NEW_ALBUM ? newAlbum.trim() || "General" : album;

  function pick(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, MAX_FILES_PER_BATCH);
    if (files.length > MAX_FILES_PER_BATCH) toast.warning(`Only the first ${MAX_FILES_PER_BATCH} photos were added. Upload the rest in another batch.`);
    setItems((prev) => [
      ...prev,
      ...list.map((file) => {
        const err = validatePhotoFile(file);
        return { key: newId("f"), file, status: err ? ("error" as const) : ("queued" as const), progress: 0, error: err ?? undefined };
      }),
    ]);
  }

  const patch = (key: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));

  // PHASE 1: simulated transfer (≈3 MB/s). Phase 3 swaps this for a signed-URL PUT to private storage.
  function start(item: Item) {
    patch(item.key, { status: "uploading", progress: 0, error: undefined });
    const total = item.file.size;
    let sent = 0;
    const t = setInterval(async () => {
      sent = Math.min(total, sent + 300 * 1024);
      patch(item.key, { progress: Math.round((sent / total) * 100) });
      if (sent >= total) {
        clearInterval(t);
        timers.current.delete(item.key);
        const id = newId("ph");
        const [thumb, size] = await Promise.all([makeThumbnail(item.file), imageSize(item.file)]);
        sessionOriginals.set(id, item.file);
        const photo: Photo = {
          id,
          tripId: trip.id,
          album: albumName,
          src: thumb ? URL.createObjectURL(thumb) : "",
          uploaderId: CURRENT_USER_ID,
          originalFilename: item.file.name,
          contentType: item.file.type || "image/heic",
          sizeBytes: item.file.size,
          width: size?.width ?? 0,
          height: size?.height ?? 0,
          takenAt: new Date(item.file.lastModified).toISOString(),
          uploadedAt: new Date().toISOString(),
        };
        addPhotos([photo]);
        patch(item.key, { status: "done", progress: 100 });
      }
    }, 100);
    timers.current.set(item.key, t);
  }

  function cancel(item: Item) {
    const t = timers.current.get(item.key);
    if (t) clearInterval(t);
    timers.current.delete(item.key);
    patch(item.key, { status: "cancelled" });
  }

  const queued = items.filter((i) => i.status === "queued");
  const uploading = items.some((i) => i.status === "uploading");
  const done = items.filter((i) => i.status === "done").length;
  const totalBytes = items.filter((i) => i.status !== "error").reduce((s, i) => s + i.file.size, 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="up-album">Album</Label>
        <select id="up-album" className={selectClass} value={album} onChange={(e) => setAlbum(e.target.value)}>
          {albums.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value={NEW_ALBUM}>+ New album…</option>
        </select>
        {album === NEW_ALBUM && (
          <Input className="h-11 rounded-xl" placeholder="Album name, e.g. Day 2 — City Palace" value={newAlbum} maxLength={60} onChange={(e) => setNewAlbum(e.target.value)} />
        )}
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 bg-info-soft px-4 py-8 text-center transition-colors hover:bg-secondary">
        <ImagePlus className="h-8 w-8 text-accent" aria-hidden />
        <span className="font-semibold text-foreground">Choose photos</span>
        <span className="text-xs text-muted-foreground">JPEG, PNG, WebP or HEIC · up to 50 MB each · originals are never compressed</span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done}/{items.filter((i) => i.status !== "error").length} uploaded · {formatBytes(totalBytes)}
            </span>
            <button className="font-semibold text-muted-foreground hover:text-foreground" onClick={() => setItems((p) => p.filter((i) => i.status === "uploading"))}>
              Clear
            </button>
          </div>
          <ul className="grid max-h-72 gap-2 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.key} className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={i.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{i.file.name}</p>
                    <p className={cn("text-xs", i.status === "error" ? "text-destructive" : "text-muted-foreground")}>
                      {i.error ?? `${formatBytes(i.file.size)} · ${i.status === "uploading" ? `${i.progress}%` : i.status}`}
                    </p>
                  </div>
                  {i.status === "uploading" && (
                    <Button size="iconSm" variant="ghost" aria-label="Cancel upload" onClick={() => cancel(i)}><X /></Button>
                  )}
                  {i.status === "cancelled" && (
                    <Button size="iconSm" variant="ghost" aria-label="Retry upload" onClick={() => start(i)}><RotateCcw /></Button>
                  )}
                </div>
                {i.status === "uploading" && <Progress value={i.progress} className="mt-2 h-1.5" />}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="lg" className="flex-1" onClick={onDone} disabled={uploading}>
          {done > 0 ? "Done" : "Close"}
        </Button>
        <Button size="lg" className="flex-1" disabled={queued.length === 0} onClick={() => queued.forEach(start)}>
          Upload {queued.length > 0 ? queued.length : ""}
        </Button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === "done") return <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Uploaded" />;
  if (status === "error") return <AlertCircle className="h-5 w-5 shrink-0 text-destructive" aria-label="Rejected" />;
  return <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />;
}
