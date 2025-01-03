import { clerkMiddleware, auth } from "@clerk/nextjs/server";

// Initialize clerk middleware
export default clerkMiddleware();

// Define public routes
export const publicRoutes = [
  "/",
  "/api/stripe/webhook",
  "/terms",
  "/studio",
  "/api/search-address",
  "/api/get-assets",
  "/passport",
  "/privacy",
  "/sign-in",
  "/contact",
  "/payment-success",
  "/map",
  "/map/:path*",
  "/render/:path*",
];

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/",
    "/profile/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/((?!get-assets|stripe/webhook|search-address).)*"
  ]
};