// app/record-video/page.tsx
"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function RecordVideoPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);
      setVideoUrl(null);

      const response = await fetch('/api/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationCount: 11 }),
      });

      if (!response.ok) {
        throw new Error('Failed to record video');
      }

      const data = await response.json();
      setVideoUrl(data.videoUrl);
    } catch (error) {
      // setError(error.message || 'An error occurred');
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Passport Video Recorder
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Click the button below to generate a video of your passport
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={triggerRecording}
            disabled={isRecording}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecording ? 'Recording...' : 'Generate Video'}
          </button>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {videoUrl && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full"
                />
              </div>
              <Link
                href={videoUrl}
                download
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Download Video
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}