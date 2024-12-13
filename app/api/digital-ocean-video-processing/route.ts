// app/api/digital-ocean-video-processing/route.ts
import { NextRequest } from 'next/server';

const DO_FUNCTION_URL = process.env.DO_FUNCTION_URL;

export async function POST(req: NextRequest) {
  try {
    const { locationCount, mappbook_user_id } = await req.json();

    if (!locationCount || !mappbook_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400 }
      );
    }

    // Call DigitalOcean Function
    const response = await fetch(DO_FUNCTION_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locationCount, mappbook_user_id }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
    });

  } catch (error: any) {
    console.error('Process failed:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500 }
    );
  }
}