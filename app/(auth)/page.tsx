"use client";
import React from 'react';
import Head from 'next/head';
import MapContainer from '../../components/Surveys/answer/MapContainer';

export default function Home() {
  return (
    <div className="container w-full h-screen overflow-hidden">
      <Head>
        <title>IPL Fan Map 2025</title>
        <meta name="description" content="Vote for your favourite IPL team and see who's winning India's heart" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full h-full">
        <MapContainer />
      </main>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100vh;
          margin: 0;
          padding: 0;
        }
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 768px) {
          .container {
            height: calc(100vh - env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}