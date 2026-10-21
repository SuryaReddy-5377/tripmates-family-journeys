import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/memories")({
  component: MemoriesRedirect,
});

function MemoriesRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/trips", replace: true });
  }, [navigate]);

  return null;
}
