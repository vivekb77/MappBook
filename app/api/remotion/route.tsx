// /api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  renderMediaOnLambda, 
  getRenderProgress, 
} from '@remotion/lambda/client';

// Video configuration - increased duration for longer video
const DURATION_IN_FRAMES = 299; // 10 seconds at 30fps
const VIDEO_CONFIG = {
  fps: 30,
  width: 1280,
  height: 720,
  jpegQuality: 80,
};

// AWS Lambda configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const FUNCTION_NAME = 'remotion-render-4-0-242-mem2048mb-disk2048mb-120sec'
const SERVE_URL = 'https://remotionlambda-useast1-0303dghv3x.s3.us-east-1.amazonaws.com/sites/mappbook-animation/index.html'
const BUCKET_NAME = 'remotionlambda-useast1-0303dghv3x';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER;

if (!SERVE_URL) {
  throw new Error('REMOTION_SERVE_URL environment variable not set');
}

if (!BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME environment variable not set');
}

if (!MAPBOX_TOKEN) {
  throw new Error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER environment variable not set');
}

export async function POST(req: NextRequest) {
  try {
    const { points } = await req.json();

    // Validate input
    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Invalid points data' },
        { status: 400 }
      );
    }

    // Start the render
    const renderResponse = await renderMediaOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: 'Empty',
      inputProps: {
        points,
        mapboxToken: MAPBOX_TOKEN,
      },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 3,
      privacy: 'public',
      framesPerLambda: 100, // Increased for better performance
      timeoutInSeconds: 300, // Increased timeout
      frameRange: [0, DURATION_IN_FRAMES - 1],
      bucketName: BUCKET_NAME,
      ...VIDEO_CONFIG,
      chromiumOptions: {
        // Added for better rendering performance
        timeout: 300000, // 5 minutes in ms
        gl: 'angle',
      },
    });

    return NextResponse.json({
      renderId: renderResponse.renderId,
      bucketName: renderResponse.bucketName || BUCKET_NAME,
    });

  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json(
      { error: 'Failed to start render' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const renderId = searchParams.get('renderId');
  const bucketName = searchParams.get('bucketName');
  
  if (!renderId || !bucketName) {
    return NextResponse.json(
      { error: 'Missing renderId or bucketName parameter' },
      { status: 400 }
    );
  }

  try {
    const progress = await getRenderProgress({
      renderId,
      bucketName,
      region: REGION,
      functionName: FUNCTION_NAME,
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress check error:', error);
    return NextResponse.json(
      { error: 'Failed to check render progress' },
      { status: 500 }
    );
  }
}