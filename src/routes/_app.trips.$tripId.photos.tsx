import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/trips/$tripId/photos")({
  validateSearch: (s: Record<string, unknown>): { upload?: boolean; album?: string } => {
    const upload = s["upload"];
    const album = s["album"];
    const out: { upload?: boolean; album?: string } = {};
    if (upload === true || upload === "true") out.upload = true;
    if (typeof album === "string") out.album = album;
    return out;
  },
  component: TripPhotosRedirect,
});

function TripPhotosRedirect() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/trips/$tripId", params: { tripId }, replace: true });
  }, [tripId, navigate]);

  return null;
}
