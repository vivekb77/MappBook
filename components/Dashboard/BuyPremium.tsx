// import React, { useState } from 'react';
// import { useMappbookUser } from '@/context/UserContext';
// import { useUser } from '@clerk/nextjs';
// import { track } from '@vercel/analytics';

// const BuyPremium = () => {
//     const { isSignedIn, user } = useUser();
//     const { mappbookUser } = useMappbookUser();
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState('');

//     const handlePremiumButtonClick = async () => {
//         if (!user || !mappbookUser) {
//             setError('Please sign in to purchase premium.');
//             return;
//         }

//         setIsLoading(true);
//         setError('');

//         try {
//             track('Buy Premium button clicked');

//             const response = await fetch('/api/stripe/create-checkout-session', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     userId: mappbookUser.mappbook_user_id,
//                     userEmail: user.emailAddresses[0].emailAddress,
//                 }),
//             });

//             if (!response.ok) {
//                 let errorMessage = 'Failed to create checkout session';
//                 try {
//                     const error = await response.json();
//                     errorMessage = error.message || errorMessage;
//                 } catch (e) {
//                     // If parsing JSON fails, use default error message
//                 }
                
//                 track('RED - Buy Premium failed', { 
//                     user_id: mappbookUser.mappbook_user_id,
//                     error: errorMessage 
//                 });

//                 throw new Error(errorMessage);
//             }

//             const { url } = await response.json();

//             if (url) {
//                 window.location.href = url;
//             } else {
//                 throw new Error('No checkout URL received');
//             }
//         } catch (err) {
//             console.error('Error initiating checkout:', err);
//             // setError(err.message || 'An unexpected error occurred');
//         } finally {
//             setIsLoading(false);
//         }
//     };
    
//     // Only render if user is signed in AND has more than 10 total map views
//     if (!isSignedIn || !mappbookUser || mappbookUser.total_map_views <= 10) {
//         return null;
//     }

//     return (
//         <div className="w-full">
//                 <button
//                     onClick={handlePremiumButtonClick}
//                     disabled={isLoading}
//                     className={`w-full py-3 px-4 rounded-xl font-medium mt-6
//                         ${mappbookUser?.is_premium_user
//                             ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400'
//                             : 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400'
//                         } text-white shadow-lg hover:scale-[1.02]
//                         transform transition-all duration-300
//                         flex items-center justify-center gap-2 relative
//                         overflow-hidden group
//                         ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
//                     aria-label={mappbookUser?.is_premium_user ? 'Add Views' : 'Upgrade to Premium'}
//                 >
//                     <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors duration-300"></div>
//                     {isLoading ? (
//                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                     ) : (
//                         <>
//                             <span className="font-semibold">
//                                 {mappbookUser?.is_premium_user
//                                     ? `Add Views (${mappbookUser?.map_views_left} views left)`
//                                     : 'Upgrade to Premium'}
//                             </span>
//                             {!mappbookUser?.is_premium_user && (
//                                 <span className="bg-white/30 text-xs py-0.5 px-2 rounded-full ml-2">
//                                     50% OFF
//                                 </span>
//                             )}
//                         </>
//                     )}
//                 </button>
//         </div>
//     );
// };

// export default BuyPremium;