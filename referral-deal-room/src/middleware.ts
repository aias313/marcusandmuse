import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk session handling for all app routes. Route-level authorization +
// tenant scoping is enforced in data access (see src/lib/tenant.ts), not here.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
