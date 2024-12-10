import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center flex-col m-5 items-center">
      <SignIn appearance={{
        elements: {
          footerAction: "hidden"  // This hides the "Sign up" link
        }
      }} />
    </div>
  );
}