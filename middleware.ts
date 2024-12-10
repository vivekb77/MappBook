// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/stripe/webhook",
    "/terms",
    "/api/search-address",
    "/app/(unauth)/record",
    "/record",
    "/privacy",
    "/contact",
    "/payment-success",
    "/map",
    "/map/:id", // Add this for dynamic routes
    // "/map/(.*)", // This is correct but let's be explicit
  ]
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
};