// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    // "/",
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