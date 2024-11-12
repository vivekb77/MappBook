'use client'

import React, { useEffect } from 'react'

interface PreventPullToRefreshProps {
  children: React.ReactNode
}

const PreventPullToRefresh: React.FC<PreventPullToRefreshProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const disablePullToRefresh = (e: TouchEvent) => {
      // Prevent default action if the touch move is vertical
      if (e.touches.length > 1 || e.touches[0].clientY > 0) {
        e.preventDefault()
      }
    }

    // Add event listener to the document
    document.addEventListener('touchmove', disablePullToRefresh, { passive: false })

    // Clean up the event listener on unmount
    return () => {
      document.removeEventListener('touchmove', disablePullToRefresh)
    }
  }, [])

  return (
    <div style={{ 
      touchAction: 'pan-x',
      minHeight: '100vh',  // Ensure it covers the full viewport height
      width: '100%'        // Ensure it covers the full width
    }}>
      {children}
    </div>
  )
}

export default PreventPullToRefresh