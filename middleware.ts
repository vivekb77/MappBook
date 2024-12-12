// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/stripe/webhook",
    "/terms",
    "/api/search-address",
    "/api/recordflipbook",
    "/passport",
    "/playflipbook",
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
    // Exclude explicitly public routes to prevent unnecessary auth enforcement
    "/((?!playflipbook|api/stripe/webhook|terms|privacy|contact|payment-success|map|passport|api/search-address|api/recordflipbook).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};