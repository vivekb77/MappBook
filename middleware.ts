import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/stripe/webhook",
    "/terms",
    "/studio",
    "/render/:id",
    "/api/search-address",
    "/api/get-assets",
    "/passport",
    "/privacy",
    "/sign-in",
    "/contact",
    "/payment-success",
    "/map",
    "/map/:id", // Add this for dynamic routes
    // "/map/(.*)", // This is correct but let's be explicit
  ]
});

export const config = {
  matcher: [
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/((?!get-assets|stripe/webhook|search-address).)*"  // Match all API routes except the public ones
  ]
};