import { useEffect } from "react";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { useAppState, getSessionUser } from "@/lib/store";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    // Client-side authentication gate: redirect to /auth if not signed in
    if (typeof window !== "undefined") {
      const user = getSessionUser();
      if (!user) {
        throw redirect({
          to: "/auth",
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, currentUser } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || currentUser.id === "guest") {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, currentUser, navigate]);

  if (!isAuthenticated || currentUser.id === "guest") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground font-semibold">Checking family access & permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
