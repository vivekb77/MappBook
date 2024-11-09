'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

function PaymentStatus() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setError('No session ID found');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Payment verification failed');
        }

        setStatus('success');
      } catch (err) {
        console.error('Error verifying payment:', err);
        setStatus('error');
        setError('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleBackToMapp = () => {
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Verifying your payment...
        </h2>
        <p className="text-gray-500">
          Please wait while we confirm your transaction
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Payment Successful! 🎉
        </h2>
        <p className="text-gray-500 mb-6">
          Thank you for upgrading to Premium! Your account has been updated with additional views.
        </p>
        <button
          onClick={handleBackToMapp}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 
          text-white rounded-xl transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MappBook
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">❌</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Oops! Something went wrong
      </h2>
      <p className="text-red-500 mb-6">
        {error || 'Failed to verify payment'}
      </p>
      <button
        onClick={handleBackToMapp}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-purple-500 hover:bg-purple-600 
        text-white rounded-xl transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to MappBook
      </button>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Loading...
      </h2>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <Suspense fallback={<LoadingFallback />}>
          <PaymentStatus />
        </Suspense>
      </div>
    </div>
  );
}