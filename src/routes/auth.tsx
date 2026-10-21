import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import hero from "@/assets/trip-kerala.jpg";

type Mode = "signin" | "register" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => {
    const m = s.mode;
    return m === "register" || m === "forgot" || m === "signin" ? { mode: m } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — TripMates" },
      { name: "description", content: "Sign in to TripMates or join with your family invitation code." },
      { property: "og:title", content: "Sign in — TripMates" },
      { property: "og:description", content: "Private family access. Invitation code required to join." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMode = (m: Mode) => {
    setError(null);
    navigate({ to: "/auth", search: { mode: m }, replace: true });
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "register" && !String(f.get("code") ?? "").trim()) return setError("Enter the invitation code from your family admin.");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    setBusy(false);
    if (mode === "forgot") {
      toast.success("If that email has an account, a reset link is on its way.");
      return setMode("signin");
    }
    toast.message("Preview mode", { description: "Real accounts arrive in Phase 2 — showing sample family data." });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="" width={1280} height={832} className="absolute inset-0 h-full w-full object-cover" />
        <div className="image-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-on-image">
          <p className="font-display text-3xl font-semibold leading-tight">"The houseboat morning — Ammamma still talks about it."</p>
          <p className="mt-2 text-sm opacity-90">Kerala Backwaters · April 2026</p>
        </div>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPinned className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold text-foreground">TripMates</span>
        </Link>

        <div className="mx-auto my-auto w-full max-w-sm py-10 fade-up" key={mode}>
          <h1 className="text-3xl font-semibold text-foreground">
            {mode === "signin" ? "Welcome back" : mode === "register" ? "Join the family" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" && "Sign in to see our trips, photos and balances."}
            {mode === "register" && "You'll need the invitation code from your family admin."}
            {mode === "forgot" && "We'll email you a secure link to set a new password."}
          </p>

          {mode !== "forgot" && (
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold" role="tablist">
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn("h-10 rounded-lg transition-colors", mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground")}
                >
                  {m === "signin" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 grid gap-4" noValidate>
            {mode === "register" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" name="name" autoComplete="name" className="h-11 rounded-xl" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="code">Invitation code</Label>
                  <Input id="code" name="code" autoComplete="off" autoCapitalize="characters" className="h-11 rounded-xl uppercase tracking-widest" placeholder="FAMILY-XXXX-XX" required />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" className="h-11 rounded-xl" required />
            </div>
            {mode !== "forgot" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={() => setMode("forgot")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="h-11 rounded-xl" minLength={8} required />
              </div>
            )}
            {error && <p role="alert" className="rounded-xl bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
              {busy && <Loader2 className="animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </Button>
            {mode === "forgot" && (
              <Button type="button" variant="ghost" onClick={() => setMode("signin")}>Back to sign in</Button>
            )}
          </form>

          <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            Only invited family members can join. Photos and expenses are visible only to people on each trip.
          </p>
        </div>
      </div>
    </div>
  );
}
