"use client";
import React from 'react';
import Head from 'next/head';
import Container from '../../../components/Polls/Poll/Container';

export default function Home() {
  return (
    <div className="w-full h-screen-dynamic overflow-hidden">
       <Head>
        <title>Need to be dynamic</title>
        <meta name="description" content="Need to be dynamic" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="w-full h-full">
        <Container />
      </main>
    </div>
  );
}