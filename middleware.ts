// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/stripe/webhook",
    "/terms",
    "/api/search-address",
    "/api/recordflipbook",
    "/api/get-assets",
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
    // Only match routes that should be protected
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/((?!get-assets|stripe/webhook|search-address|recordflipbook).)*"  // Match all API routes except the public ones
  ]
};