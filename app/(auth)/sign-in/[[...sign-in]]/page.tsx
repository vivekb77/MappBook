import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return(
    <div className="flex justify-center flex-col m-5 items-center">
       <SignIn />
    </div>
  )
  
 
}