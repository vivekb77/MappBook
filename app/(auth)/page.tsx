"use client";
import React from 'react';
import Head from 'next/head';
import MapContainer from '../../components/Surveys/answer/MapContainer';

export default function Home() {
  return (
    <div className="w-full h-screen-dynamic overflow-hidden">
       <Head>
        <title>IPL Fan Map 2025</title>
        <meta name="description" content="Vote for your favourite IPL team and see who's winning India's heart" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="w-full h-full">
        <MapContainer />
      </main>
    </div>
  );
}