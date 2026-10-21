import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DownloadCloud,
  HardDrive,
  RefreshCw,
  Shield,
  Trash2,
  User,
  Users,
  Wifi,
  WifiOff,
  Building,
  Key,
  CheckCircle2,
  Sparkles,
  Database,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAppState,
  setCurrentUser,
  switchActiveFamily,
  syncOfflineQueue,
} from "@/lib/store";
import {
  checkStorageEstimate,
  getDownloadedRegions,
  deleteDownloadedRegion,
  requestPersistentStorage,
  type StorageEstimateResult,
} from "@/lib/offline-storage";
import type { OfflineRegion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PartyAvatar } from "@/components/app/bits";
import { useTranslation, LANGUAGES, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — TripMates 2.0" },
      { name: "description", content: "User profile, family workspaces, language preferences, and offline storage." },
    ],
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const { t, lang, setLanguage, isTelugu } = useTranslation();
  const { currentUser, families, activeFamilyId, isOnline, pendingOfflineActionsCount } = useAppState();

  const [storageInfo, setStorageInfo] = useState<StorageEstimateResult | null>(null);
  const [downloadedRegions, setDownloadedRegions] = useState<OfflineRegion[]>([]);
  const [isPersisting, setIsPersisting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refreshStorage = async () => {
    const est = await checkStorageEstimate();
    setStorageInfo(est);
    const regs = await getDownloadedRegions();
    setDownloadedRegions(regs);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  const handleRequestPersistence = async () => {
    setIsPersisting(true);
    const granted = await requestPersistentStorage();
    setIsPersisting(false);
    if (granted) {
      toast.success("Storage persistence granted! Offline maps won't be cleared by browser eviction.");
    } else {
      toast.info("Browser manages storage automatically based on device space.");
    }
    await refreshStorage();
  };

  const handleDeleteRegion = async (id: string, name: string) => {
    if (confirm(`Remove offline map region "${name}"?`)) {
      await deleteDownloadedRegion(id);
      toast.success(`Removed "${name}" from offline storage`);
      await refreshStorage();
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await syncOfflineQueue();
      if (res.syncedCount > 0) {
        toast.success(`Synchronized ${res.syncedCount} offline changes`);
      } else {
        toast.info("Offline queue is already up to date");
      }
    } finally {
      setSyncing(false);
    }
  };

  const currentFamily = families.find((f) => f.id === activeFamilyId) || families[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-up">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("settingsTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("settingsSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-bold border",
              isOnline
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40",
            )}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{isOnline ? t("online") : t("offline")}</span>
          </span>
        </div>
      </div>

      {/* LANGUAGE PREFERENCE CARD */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Languages className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>{t("languageSection")}</span>
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("languageHelp")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {LANGUAGES.map((item) => {
            const isSelected = lang === item.code;
            return (
              <button
                key={item.code}
                onClick={() => {
                  setLanguage(item.code);
                  toast.success(item.code === "te" ? "భాషను తెలుగుగా మార్చడం జరిగింది" : "Language set to English");
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                    : "border-border/80 bg-secondary/30 hover:bg-secondary/60",
                )}
              >
                <div>
                  <div className="font-bold text-sm text-foreground">{item.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* USER PROFILE CARD */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>User Profile</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="flex items-center gap-3.5">
            <PartyAvatar name={currentUser.name} className="h-14 w-14 text-lg ring-4 ring-secondary" />
            <div>
              <div className="font-bold text-foreground text-base">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">{currentUser.email}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                  {currentUser.role.replace("_", " ")}
                </span>
                {currentUser.phone && (
                  <span className="text-[11px] text-muted-foreground font-medium">{currentUser.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ROLE SELECTION TEST SWITCHER */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Test Role Persona (Verify Authorization Enforcements)
          </label>
          <div className="flex flex-wrap gap-2">
            {(["super_admin", "family_admin", "organizer", "member"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentUser({ ...currentUser, role: r })}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all",
                  currentUser.role === r
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary text-foreground border-border hover:bg-secondary/80",
                )}
              >
                {r.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OFFLINE MAPS & PERSISTENT CACHE MANAGER */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <DownloadCloud className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Offline Maps & Local Storage (PWA/Browser)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Downloaded geographic regions and pending sync queue stored in IndexedDB.
            </p>
          </div>

          <Button
            onClick={handleManualSync}
            disabled={!isOnline || syncing}
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            Sync Now ({pendingOfflineActionsCount})
          </Button>
        </div>

        {/* STORAGE ESTIMATE STATS */}
        {storageInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border p-3.5 bg-secondary/30">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Cached Tile Usage</div>
              <div className="font-bold text-foreground text-lg mt-0.5">
                {(storageInfo.usedBytes / (1024 * 1024)).toFixed(1)} MB
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{storageInfo.percentUsed}% of quota</div>
            </div>

            <div className="rounded-2xl border border-border p-3.5 bg-secondary/30">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Device Available</div>
              <div className="font-bold text-foreground text-lg mt-0.5">
                {(storageInfo.availableBytes / (1024 * 1024)).toFixed(0)} MB
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Sufficient for offline tiles</div>
            </div>

            <div className="rounded-2xl border border-border p-3.5 bg-secondary/30 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Persistence Status</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                  {storageInfo.persistent ? "Protected from Eviction" : "Automatic Quota"}
                </div>
              </div>
              {!storageInfo.persistent && (
                <button
                  onClick={handleRequestPersistence}
                  disabled={isPersisting}
                  className="mt-2 text-left text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Request Protection →
                </button>
              )}
            </div>
          </div>
        )}

        {/* STORED REGIONS LIST */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-foreground">
            <span>Saved Offline Regions ({downloadedRegions.length})</span>
            <span className="text-[11px] text-muted-foreground font-normal">
              Download more from any trip's Explore Map tab
            </span>
          </div>

          {downloadedRegions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground bg-secondary/20">
              <HardDrive className="mx-auto h-8 w-8 opacity-30 mb-2" />
              <div>No map regions downloaded for offline use yet.</div>
              <div className="mt-1 text-[11px]">
                Open any trip, switch to <span className="font-bold">Map & Route</span>, and tap <span className="font-bold">Offline Cache</span>.
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {downloadedRegions.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <DownloadCloud className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-bold text-foreground text-sm">{reg.name}</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        {reg.tileCount} tiles • {(reg.sizeBytes / (1024 * 1024)).toFixed(2)} MB • Downloaded{" "}
                        {new Date(reg.downloadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRegion(reg.id, reg.name)}
                    className="p-2 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    title="Delete saved region"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAMILY WORKSPACES */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-soft space-y-4">
        <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Building className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span>{t("familyTitle")}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {families.map((fam) => {
            const isActive = fam.id === activeFamilyId;
            return (
              <div
                key={fam.id}
                className={cn(
                  "rounded-2xl border p-4 transition-all shadow-sm flex flex-col justify-between",
                  isActive ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20" : "border-border/80 bg-card",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{fam.name}</span>
                    {isActive && (
                      <span className="rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{fam.city}</div>
                  <div className="mt-2 text-xs font-mono bg-secondary/80 rounded-lg p-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{t("inviteCode")}:</span>
                    <span className="font-bold text-foreground">{fam.inviteCode}</span>
                  </div>
                </div>

                {!isActive && (
                  <Button
                    onClick={() => switchActiveFamily(fam.id)}
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl text-xs font-semibold"
                  >
                    {t("switchFamily")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
