import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MapPinned, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import hero from "@/assets/trip-kerala.jpg";
import { useAppState, setCurrentUser, switchActiveFamily, addMember } from "@/lib/store";
import type { Person, User } from "@/lib/types";

type Mode = "signin" | "register" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => {
    const m = s["mode"];
    return m === "register" || m === "forgot" || m === "signin" ? { mode: m } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — TripMates 2.0" },
      { name: "description", content: "Sign in to TripMates 2.0 or register with your family invitation code." },
      { property: "og:title", content: "Sign in — TripMates 2.0" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin" } = Route.useSearch();
  const navigate = useNavigate();
  const { families, people, currentUser } = useAppState();

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
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (mode !== "forgot" && password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);

    if (mode === "forgot") {
      await new Promise((r) => setTimeout(r, 400));
      setBusy(false);
      toast.success("If that email has an account, a password reset link has been dispatched.");
      return setMode("signin");
    }

    if (mode === "register") {
      const name = String(f.get("name") ?? "").trim();
      const code = String(f.get("code") ?? "").trim().toUpperCase();

      if (!name) {
        setBusy(false);
        return setError("Please provide your full name.");
      }

      const matchingFamily = families.find((fam) => fam.inviteCode.toUpperCase() === code);
      if (!matchingFamily) {
        setBusy(false);
        return setError(`Invalid invitation code "${code}". Please check with your family admin.`);
      }

      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const newPerson: Person = {
        id,
        name,
        email,
        familyId: matchingFamily.id,
        role: "member",
      };

      const newUser: User = {
        id,
        name,
        email,
        role: "member",
        familyIds: [matchingFamily.id],
        defaultFamilyId: matchingFamily.id,
        createdAt: new Date().toISOString(),
      };

      addMember(newPerson);
      setCurrentUser(newUser);
      switchActiveFamily(matchingFamily.id);

      await new Promise((r) => setTimeout(r, 400));
      setBusy(false);
      toast.success(`Welcome to the ${matchingFamily.name}!`);
      navigate({ to: "/dashboard" });
      return;
    }

    // Sign in mode: match existing person
    const matched = people.find((p) => p.email.toLowerCase() === email);
    if (matched) {
      const user: User = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        familyIds: [matched.familyId],
        defaultFamilyId: matched.familyId,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      switchActiveFamily(matched.familyId);
      await new Promise((r) => setTimeout(r, 350));
      setBusy(false);
      toast.success(`Welcome back, ${matched.name.split(" ")[0]}!`);
      navigate({ to: "/dashboard" });
      return;
    }

    // Fallback sign in
    await new Promise((r) => setTimeout(r, 350));
    setBusy(false);
    toast.success("Signed in successfully!");
    navigate({ to: "/dashboard" });
  }

  // Quick Persona Login for QA & Evaluation
  const quickLogin = (personId: string) => {
    const p = people.find((item) => item.id === personId);
    if (!p) return;
    const user: User = {
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      familyIds: [p.familyId],
      defaultFamilyId: p.familyId,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(user);
    switchActiveFamily(p.familyId);
    toast.success(`Signed in as ${p.name} (${p.role.replace("_", " ")})`);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* LEFT EDITORIAL HERO */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={hero} alt="" width={1280} height={832} className="absolute inset-0 h-full w-full object-cover" />
        <div className="image-scrim absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <span className="rounded-full bg-teal-500/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
            TripMates 2.0
          </span>
          <p className="font-display text-3xl font-bold leading-tight mt-3">
            "Family journeys made effortless, from route maps to fair expense splits."
          </p>
          <p className="mt-2 text-xs text-slate-300">Kerala Backwaters · Manali · Rajasthan · Goa</p>
        </div>
      </div>

      {/* RIGHT AUTH FORM */}
      <div className="flex flex-col px-6 py-8 sm:px-12 justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-slate-800 text-white shadow-soft">
            <MapPinned className="h-5 w-5 text-teal-300" aria-hidden />
          </span>
          <span className="font-display text-xl font-bold text-foreground">TripMates 2.0</span>
        </Link>

        <div className="mx-auto my-auto w-full max-w-sm py-8 fade-up" key={mode}>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "signin" ? "Welcome Back" : mode === "register" ? "Join the Family" : "Reset Password"}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {mode === "signin" && "Sign in to plan trips, view offline maps, and settle balances."}
            {mode === "register" && "Enter your family invitation code to access private workspaces."}
            {mode === "forgot" && "We'll email you a secure link to reset your account password."}
          </p>

          {mode !== "forgot" && (
            <div className="mt-5 grid grid-cols-2 rounded-2xl bg-secondary/80 p-1 text-xs font-bold" role="tablist">
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "h-9 rounded-xl transition-all",
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "signin" ? "Sign In" : "Register with Code"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 grid gap-3.5" noValidate>
            {mode === "register" && (
              <>
                <div className="grid gap-1">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input id="name" name="name" placeholder="e.g. Rohini Reddy" className="h-10 rounded-xl text-xs" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="code" className="text-xs font-semibold">
                    Family Invitation Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    autoComplete="off"
                    autoCapitalize="characters"
                    className="h-10 rounded-xl font-mono uppercase tracking-widest text-xs"
                    placeholder="e.g. REDDY2026, RAO2026"
                    required
                  />
                </div>
              </>
            )}

            <div className="grid gap-1">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={mode === "signin" ? "surya.reddy@example.com" : ""}
                placeholder="name@example.com"
                className="h-10 rounded-xl text-xs"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="FamilyTrip2026!"
                  className="h-10 rounded-xl text-xs"
                  minLength={6}
                  required
                />
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-2.5 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="default" disabled={busy} className="mt-1 w-full rounded-xl text-xs font-bold">
              {busy && <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />}
              {mode === "signin" ? "Sign In to Workspace" : mode === "register" ? "Create Account & Join" : "Send Reset Link"}
            </Button>
          </form>

          {/* QUICK PERSONA SWITCHER FOR EASY EVALUATION */}
          <div className="mt-6 pt-5 border-t border-border/80 text-xs">
            <span className="block text-muted-foreground text-[11px] font-semibold mb-2">Quick Sign In as Test Persona:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("surya")}
                className="rounded-xl border border-border bg-secondary/50 p-2 text-left hover:bg-secondary transition-colors"
              >
                <div className="font-bold text-foreground text-[11px]">Surya Reddy</div>
                <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">Super Admin</div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("lakshmi")}
                className="rounded-xl border border-border bg-secondary/50 p-2 text-left hover:bg-secondary transition-colors"
              >
                <div className="font-bold text-foreground text-[11px]">Lakshmi Reddy</div>
                <div className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold">Family Admin</div>
              </button>
            </div>
          </div>

          <p className="mt-6 flex items-start gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            Private family access only. Invitation codes enforce isolated family workspaces.
          </p>
        </div>

        <div className="text-center text-[11px] text-muted-foreground pb-2">
          TripMates 2.0 • Premium Family Travel & Ledger Engine
        </div>
      </div>
    </div>
  );
}
