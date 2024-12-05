// import { SpeedInsights } from "@vercel/speed-insights/next";

export default function UnauthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* <SpeedInsights /> */}
    </>
  );
}