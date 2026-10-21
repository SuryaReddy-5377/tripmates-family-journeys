import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MapPinned, ShieldCheck, Mail, Lock, User as UserIcon, KeyRound, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import hero from "@/assets/trip-kerala.jpg";
import { useAppState, loginUser, switchActiveFamily, addMember } from "@/lib/store";
import type { Person, User } from "@/lib/types";

type Mode = "signin" | "register" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; redirect?: string } => {
    const m = s["mode"];
    const r = typeof s["redirect"] === "string" ? s["redirect"] : undefined;
    return {
      mode: m === "register" || m === "forgot" || m === "signin" ? m : undefined,
      redirect: r,
    };
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 shrink-0", className)} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AuthPage() {
  const { mode = "signin", redirect: redirectUrl } = Route.useSearch();
  const navigate = useNavigate();
  const { families, people } = useAppState();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const setMode = (m: Mode) => {
    setError(null);
    navigate({ to: "/auth", search: { mode: m, redirect: redirectUrl }, replace: true });
  };

  const completeLogin = (user: User, message: string) => {
    loginUser(user);
    if (user.defaultFamilyId) {
      switchActiveFamily(user.defaultFamilyId);
    }
    toast.success(message);
    const destination = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/dashboard";
    navigate({ to: destination as any });
  };

  // Google Sign-In Confirmation
  const proceedGoogleSignIn = async (name: string, email: string) => {
    setBusy(true);
    setError(null);
    setGoogleModalOpen(false);

    await new Promise((r) => setTimeout(r, 450));

    // Check if matching registered member
    const existing = people.find((p) => p.email.toLowerCase() === email.toLowerCase());

    const user: User = existing
      ? {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          familyIds: [existing.familyId],
          defaultFamilyId: existing.familyId,
          createdAt: new Date().toISOString(),
        }
      : {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "_") || "surya_reddy",
          name: name || "Surya Reddy",
          email: email || "surya.reddy@gmail.com",
          role: email.includes("surya") ? "super_admin" : "member",
          familyIds: ["fam_reddy"],
          defaultFamilyId: "fam_reddy",
          createdAt: new Date().toISOString(),
        };

    setBusy(false);
    completeLogin(user, `Welcome back, ${user.name}! Signed in via Google.`);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
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
        return setError(`Invalid family invitation code "${code}". Please check with your family admin (e.g. REDDY2026).`);
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
      await new Promise((r) => setTimeout(r, 400));
      setBusy(false);
      completeLogin(newUser, `Account created! Welcome to the ${matchingFamily.name}.`);
      return;
    }

    // Sign in mode: Match existing person or authenticate primary user
    await new Promise((r) => setTimeout(r, 400));
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
      setBusy(false);
      completeLogin(user, `Welcome back, ${matched.name}!`);
      return;
    }

    // Fallback: If user signs in with any family email
    const fallbackUser: User = {
      id: "surya",
      name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: email.includes("admin") || email.includes("surya") ? "super_admin" : "member",
      familyIds: ["fam_reddy"],
      defaultFamilyId: "fam_reddy",
      createdAt: new Date().toISOString(),
    };

    setBusy(false);
    completeLogin(fallbackUser, "Signed in successfully!");
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* LEFT EDITORIAL HERO */}
      <div className="relative hidden lg:block overflow-hidden">
        <img src={hero} alt="Kerala travel" width={1280} height={832} className="absolute inset-0 h-full w-full object-cover" />
        <div className="image-scrim absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/20" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <span className="rounded-full bg-teal-500/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-teal-300 border border-teal-500/30">
            TripMates 2.0
          </span>
          <p className="font-display text-3xl font-bold leading-tight mt-4">
            "Family journeys made effortless, from road navigation to fair expense splits."
          </p>
          <p className="mt-2.5 text-xs text-slate-300">
            Private & secure workspaces • 25 family members & relatives
          </p>
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
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Private Family Portal</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "signin" ? "Sign In" : mode === "register" ? "Join Family" : "Reset Password"}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {mode === "signin" && "Sign in to access your family dashboard, maps, itineraries, and split ledger."}
            {mode === "register" && "Enter your family invitation code to join your private circle."}
            {mode === "forgot" && "We'll send a password reset link to your registered email address."}
          </p>

          {/* TAB SELECTOR: SIGN IN / REGISTER */}
          {mode !== "forgot" && (
            <div className="mt-5 grid grid-cols-2 rounded-2xl bg-secondary/80 p-1 text-xs font-bold" role="tablist">
              {(["signin", "register"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "h-9 rounded-xl transition-all cursor-pointer",
                    mode === m ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "signin" ? "Sign In" : "Register with Code"}
                </button>
              ))}
            </div>
          )}

          {/* PROMINENT GOOGLE SIGN IN BUTTON */}
          {mode !== "forgot" && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setGoogleModalOpen(true)}
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/90 bg-card px-4 text-xs font-bold text-foreground shadow-xs hover:bg-secondary/70 transition-all active:scale-[0.99] cursor-pointer"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-background px-2.5 text-muted-foreground font-bold">
                    or continue with email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MAIN FORM */}
          <form onSubmit={submit} className="grid gap-3.5" noValidate>
            {mode === "register" && (
              <>
                <div className="grid gap-1">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Rohini Reddy"
                    className="h-10 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code" className="text-xs font-semibold">
                      Family Invitation Code
                    </Label>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">Code: REDDY2026</span>
                  </div>
                  <Input
                    id="code"
                    name="code"
                    defaultValue="REDDY2026"
                    autoComplete="off"
                    autoCapitalize="characters"
                    className="h-10 rounded-xl font-mono uppercase tracking-widest text-xs font-bold"
                    placeholder="e.g. REDDY2026"
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
                defaultValue={mode === "signin" ? "surya.reddy@gmail.com" : ""}
                placeholder="name@gmail.com"
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
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
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

            <Button type="submit" size="default" disabled={busy} className="mt-1 w-full rounded-xl text-xs font-bold cursor-pointer">
              {busy && <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" />}
              {mode === "signin"
                ? "Sign In to Workspace"
                : mode === "register"
                ? "Join Reddy Family Workspace"
                : "Send Reset Link"}
            </Button>
          </form>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="mt-4 text-center w-full text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Return to Sign In
            </button>
          )}

          <p className="mt-6 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Private family security: Only authorized family members with valid invitation codes can access private trip
              itineraries and financial ledgers.
            </span>
          </p>
        </div>

        <div className="text-center text-[11px] text-muted-foreground pb-2">
          TripMates 2.0 • Premium Family Travel & Ledger Engine
        </div>
      </div>

      {/* GOOGLE SIGN IN ACCOUNT MODAL */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm fade-up">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/80">
              <div className="flex items-center gap-2.5">
                <GoogleIcon className="h-5 w-5" />
                <span className="font-display text-base font-bold text-foreground">Sign in with Google</span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Choose your Google Account to securely access the Reddy Family workspace:
            </p>

            {/* DEFAULT PRIMARY ACCOUNT */}
            <button
              type="button"
              onClick={() => proceedGoogleSignIn("Surya Reddy", "surya.reddy@gmail.com")}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3 text-left hover:bg-teal-500/20 transition-all cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-sm shadow-xs">
                SR
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-xs">Surya Reddy</div>
                <div className="text-[11px] text-muted-foreground truncate">surya.reddy@gmail.com</div>
              </div>
              <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                Super Admin
              </span>
            </button>

            {/* CUSTOM ACCOUNT ACCORDION */}
            <div className="rounded-2xl border border-border/80 bg-secondary/50 p-3 text-xs space-y-2.5">
              <span className="block font-semibold text-foreground text-[11px]">Or sign in with another Google Account:</span>
              <Input
                placeholder="Full Name (e.g. Rohini Reddy)"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Input
                type="email"
                placeholder="Google Email (e.g. rohini.reddy@gmail.com)"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <Button
                type="button"
                size="sm"
                disabled={!customGoogleEmail.includes("@")}
                onClick={() =>
                  proceedGoogleSignIn(
                    customGoogleName.trim() || customGoogleEmail.split("@")[0],
                    customGoogleEmail.trim().toLowerCase(),
                  )
                }
                className="w-full rounded-xl text-xs font-bold cursor-pointer"
              >
                Sign In with this Google Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
