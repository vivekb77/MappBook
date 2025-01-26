import React, { useState } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { useUser } from '@clerk/nextjs';
import { track } from '@vercel/analytics';

const AddCredits = () => {
    const { isSignedIn, user } = useUser();
    const { mappbookUser } = useMappbookUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddCreditsButtonClick = async () => {
        if (!user || !mappbookUser) {
            setError('Please sign in to add credits.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            track('Drone - Add credits button clicked');

            const response = await fetch('/api/stripe-drone/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: mappbookUser.mappbook_user_id,
                    userEmail: user.emailAddresses[0].emailAddress,
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to create checkout session';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    // If parsing JSON fails, use default error message
                }

                track('RED - Drone - Add credits failed', {
                    user_id: mappbookUser.mappbook_user_id,
                    error: errorMessage
                });

                throw new Error(errorMessage);
            }

            const { url } = await response.json();

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (err) {
            track('RED - Drone - Add credits failed', {
                user_id: mappbookUser.mappbook_user_id,
            });
            console.error('Error initiating checkout:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <button
                onClick={handleAddCreditsButtonClick}
                disabled={isLoading}
                className={`
                    w-full py-3 px-4 rounded-lg font-medium
                    bg-blue-500 hover:bg-blue-600
                    text-white shadow-sm
                    transform transition-all duration-300
                    flex items-center justify-center gap-2
                    relative overflow-hidden
                    ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
                aria-label='Get Premium'
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">
                            Get Premium
                        </span>
                        <span className="bg-blue-400/30 text-xs py-1 px-3 rounded-full border border-white/20">
                            50% OFF
                        </span>
                    </div>
                )}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default AddCredits;