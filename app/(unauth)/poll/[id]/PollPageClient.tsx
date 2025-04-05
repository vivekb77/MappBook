"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Container from '../../../../components/Polls/Poll/Container';
import PageLoadingAnimation from '../../../../components/Polls/Poll/PageLoadingAnimation';

export interface PollData {
  poll_id: string;
  poll_id_to_share: string;
  title: string;
  description: string;
  author: string;
  pollLength: string;
  questions: any[];
  created_at: string;
  expires_at: string;
  is_active: boolean;
  isExpired: boolean;
}

export default function PollPageClient() {
  const params = useParams();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        // Extract poll ID from URL params
        const pollId = params.id;
        
        if (!pollId) {
          throw new Error('Poll ID not found');
        }

        // Fetch poll data from API using query parameter
        const response = await fetch(`/api/polls/get-poll?poll_id=${pollId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch poll data');
        }

        const result = await response.json();
        setPoll(result.data);
      } catch (err) {
        console.error('Error fetching poll:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchPoll();
    }
  }, [params]);
  
  return (
    <div className="w-full h-screen-dynamic overflow-hidden">
      <main className="w-full h-full">
        {loading ? (
          <PageLoadingAnimation isDarkMode={true} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">The Poll is Expired or not found</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        ) : poll ? (
          <Container pollData={poll} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">No poll data available</h2>
            <p className="text-gray-700">Unable to load the requested poll.</p>
          </div>
        )}
      </main>
    </div>
  );
}