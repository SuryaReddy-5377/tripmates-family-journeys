import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Download, ImageOff, Trash2, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deletePhotos, updatePhoto } from "@/lib/store";
import { downloadOriginal } from "@/lib/photos";
import { formatBytes, personName } from "@/lib/trips";
import type { Photo } from "@/lib/types";

const PAGE = 24;

export function PhotoGallery({ photos, selectable = true }: { photos: Photo[]; selectable?: boolean }) {
  const [limit, setLimit] = useState(PAGE);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => photos.slice().sort((a, b) => b.takenAt.localeCompare(a.takenAt)), [photos]);
  const shown = sorted.slice(0, limit);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function bulkDownload() {
    setBusy(true);
    const list = sorted.filter((p) => selected.has(p.id));
    try {
      for (const p of list) {
        await downloadOriginal(p);
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success(`Downloading ${list.length} original${list.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Some downloads failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const current = viewIndex !== null ? sorted[viewIndex] : null;

  return (
    <div>
      {selectable && sorted.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {sorted.length} photo{sorted.length === 1 ? "" : "s"}
          </p>
          <Button
            size="sm"
            variant={selecting ? "secondary" : "outline"}
            onClick={() => {
              setSelecting((s) => !s);
              setSelected(new Set());
            }}
          >
            {selecting ? "Cancel" : "Select"}
          </Button>
        </div>
      )}

      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5">
        {shown.map((p, i) => {
          const isSel = selected.has(p.id);
          return (
            <li key={p.id}>
              <button
                onClick={() => (selecting ? toggle(p.id) : setViewIndex(i))}
                aria-label={selecting ? `Select ${p.originalFilename}` : `Open ${p.caption ?? p.originalFilename}`}
                aria-pressed={selecting ? isSel : undefined}
                className={cn(
                  "group relative block aspect-square w-full overflow-hidden rounded-xl bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  isSel && "ring-2 ring-accent ring-offset-2 ring-offset-background",
                )}
              >
                {p.src ? (
                  <img src={p.src} alt={p.caption ?? ""} loading="lazy" decoding="async" width={320} height={320} className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", isSel && "scale-95")} />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                    <ImageOff className="h-6 w-6" aria-hidden />
                    <span className="text-[10px] font-semibold uppercase">{p.contentType.split("/")[1]}</span>
                  </span>
                )}
                {selecting && (
                  <span className={cn("absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-on-image", isSel ? "bg-accent text-accent-foreground" : "bg-overlay/30")}>
                    {isSel && <Check className="h-3.5 w-3.5" />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {limit < sorted.length && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            Load more ({sorted.length - limit})
          </Button>
        </div>
      )}

      {selecting && selected.size > 0 && (
        <div className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-navy p-2 pl-4 text-navy-foreground shadow-elevated lg:bottom-6">
          <span className="flex-1 text-sm font-semibold">{selected.size} selected</span>
          <Button size="sm" variant="onImage" disabled={busy} onClick={bulkDownload}>
            <Download /> Originals
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} photo{selected.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the originals and thumbnails for everyone on the trip.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deletePhotos(Array.from(selected));
                toast.success("Photos deleted");
                setSelected(new Set());
                setSelecting(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={current !== null} onOpenChange={(o) => !o && setViewIndex(null)}>
        <DialogContent className="max-h-[100dvh] w-full max-w-4xl gap-0 overflow-y-auto border-0 bg-card p-0 sm:rounded-2xl">
          {current && (
            <PhotoViewer
              photo={current}
              onPrev={viewIndex! > 0 ? () => setViewIndex(viewIndex! - 1) : undefined}
              onNext={viewIndex! < sorted.length - 1 ? () => setViewIndex(viewIndex! + 1) : undefined}
              onClose={() => setViewIndex(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoViewer({ photo, onPrev, onNext, onClose }: { photo: Photo; onPrev?: () => void; onNext?: () => void; onClose: () => void }) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [downloading, setDownloading] = useState(false);
  return (
    <div key={photo.id}>
      <DialogTitle className="sr-only">{photo.caption ?? photo.originalFilename}</DialogTitle>
      <div className="relative flex items-center justify-center bg-navy">
        {photo.src ? (
          <img src={photo.src} alt={photo.caption ?? ""} className="max-h-[60dvh] w-full object-contain" />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-navy-foreground">
            <ImageOff className="h-8 w-8" />
            <p className="text-sm">Preview not available for this format — the original is safe.</p>
          </div>
        )}
        {onPrev && (
          <Button size="iconSm" variant="onImage" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full" aria-label="Previous photo" onClick={onPrev}>
            <ChevronLeft />
          </Button>
        )}
        {onNext && (
          <Button size="iconSm" variant="onImage" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full" aria-label="Next photo" onClick={onNext}>
            <ChevronRight />
          </Button>
        )}
        <Button size="iconSm" variant="onImage" className="absolute right-2 top-2 rounded-full" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="grid gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{photo.originalFilename}</p>
            <p className="text-sm text-muted-foreground">
              {personName(photo.uploaderId)} · {format(parseISO(photo.takenAt), "d MMM yyyy, h:mm a")}
            </p>
            {photo.location && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {photo.location} · {photo.album}
              </p>
            )}
          </div>
          <Button
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await downloadOriginal(photo);
              } catch {
                toast.error("Download failed. Please try again.");
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Download /> Download original
          </Button>
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Size</dt>
            <dd className="font-semibold text-foreground">{formatBytes(photo.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-semibold text-foreground">{photo.contentType}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Dimensions</dt>
            <dd className="font-semibold text-foreground">{photo.width ? `${photo.width}×${photo.height}` : "—"}</dd>
          </div>
        </dl>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updatePhoto(photo.id, { caption: caption.trim() || undefined });
            toast.success("Caption saved");
          }}
        >
          <Input aria-label="Caption" className="h-11 rounded-xl" placeholder="Add a caption" value={caption} maxLength={200} onChange={(e) => setCaption(e.target.value)} />
          <Button type="submit" variant="secondary">Save</Button>
        </form>
      </div>
    </div>
  );
}
