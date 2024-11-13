"use client"

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

export default function MapPage() {
 const router = useRouter()

 return (
   <div className="min-h-screen w-full flex flex-col items-center justify-center space-y-8">
     {/* Logo Header */}
     <div className="text-center">
       <div className="flex items-center justify-center gap-2 mb-1">
         <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
           rounded-xl p-2 shadow-md transform -rotate-3">
           {/* <Map className="w-5 h-5 text-white" /> */}
         </div>
         <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
           text-transparent bg-clip-text transform rotate-1">
           MappBook
         </h1>
       </div>
       <p className="text-xs font-medium text-purple-400">
       Share your World 🌎 Track your Adventures ✈️
       </p>
     </div>

     {/* Alert Message */}
     <div className="w-full max-w-md px-4">
       <Alert variant="destructive" className="w-full">
         <AlertDescription>
           Invalid map URL. Please make sure you have the correct User ID in the URL.
         </AlertDescription>
       </Alert>
     </div>

     {/* Button - Right below error */}
     <div className="w-full max-w-md px-4">
       <Button 
         onClick={() => router.push('/')}
         className="w-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 
           text-white hover:from-pink-500 hover:via-purple-500 hover:to-blue-500
           shadow-lg rounded-full px-6 py-3"
         size="lg"
       >
         Create Your MappBook
       </Button>
     </div>
   </div>
 )
}