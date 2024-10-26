"use client"
import Image from 'next/image'
import React from 'react'
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/clerk-react";
function NavBar() {
  const { isSignedIn, user, isLoaded } = useUser();


  return isSignedIn&&(
    <div className='flex justify-between items-center p-4 bg-blue shadow-md border-b'>
      <div className='flex items-center gap-10'>
            <Image src='/logo.png'
            alt='logo'
            width={120}
            height={60}
            />
            <div className='hidden md:flex gap-6'>
            <h2 className='hover:bg-blue-400 p-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out'>
            Create Your Own Map
            </h2>
            </div>
        </div>
        <UserButton afterSignOutUrl="/"/>
    </div>
  )

}

export default NavBar