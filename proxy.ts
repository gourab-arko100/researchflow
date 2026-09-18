// Next.js 16 renamed middleware.ts -> proxy.ts (same behavior, clearer name —
// the framework was explicit that "middleware" invited confusion with
// Express-style middleware and, more importantly, with acting as a security
// boundary on its own).
//
// That distinction matters here: this file is a first-pass gate that
// redirects signed-out visitors to /sign-in — it is NOT this app's actual
// security boundary. Every server action and route handler independently
// re-verifies the session and scopes its query by ownerId (see lib/auth.ts,
// and virtually every file under lib/actions/). So even if a request ever
// reached a handler without this file running — the scenario CVE-2025-29927
// exploited in older Next.js versions via a spoofed internal header, patched
// upstream well before this project's Next.js 16.2.6 — no data would be
// exposed, because the handler itself would still reject an unauthenticated
// or non-owning request. This file is a UX convenience (redirect early
// instead of erroring later), not the thing actually keeping data private.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/demo(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, always run for API routes
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
