// utils/auth.ts

// Type declaration for the global Clerk object
declare global {
    interface Window {
      Clerk: any;
    }
  }
  
  export const logout = async (redirectUrl: string = '/') => {
    // Wait for Clerk to be loaded
    if (!window.Clerk) {
      throw new Error('Clerk is not initialized');
    }
  
    try {
      await window.Clerk.signOut();
      window.location.href = redirectUrl;
      return { success: true, error: null };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error };
    }
  };
  
  // Additional auth utilities you might need
  export const isAuthenticated = () => {
    return window.Clerk?.user !== null;
  };
  
  export const getCurrentUser = () => {
    return window.Clerk?.user || null;
  };