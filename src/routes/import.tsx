import { createFileRoute, redirect } from "@tanstack/react-router";
import { LEGACY_APP_REDIRECTS } from "@/lib/app-routes";

export const Route = createFileRoute("/import")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: LEGACY_APP_REDIRECTS["/import"], search: search as never, replace: true, statusCode: 301 });
  },
});
