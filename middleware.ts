// middleware.ts
import { authMiddleware } from "@clerk/nextjs";
 
export default authMiddleware({
  // Array of public routes that don't require authentication
  publicRoutes: [
    "/map",
    "/about/(.*)", // if you have nested routes under about
    // add more public routes as needed
  ]
});
 
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};