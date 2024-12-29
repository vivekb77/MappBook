// /api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  renderMediaOnLambda, 
  getRenderProgress, 
} from '@remotion/lambda/client';
import { createClient } from '@supabase/supabase-js';

type AWSRegion = 
  | 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2'
  | 'ap-south-1' | 'ap-northeast-1' | 'ap-northeast-2' | 'ap-northeast-3'
  | 'ap-southeast-1' | 'ap-southeast-2' | 'ca-central-1' | 'eu-central-1'
  | 'eu-west-1' | 'eu-west-2' | 'eu-west-3' | 'eu-north-1'
  | 'sa-east-1';

// Video configuration
const DURATION_IN_FRAMES = 299; // 10 seconds at 30fps
const BASE_VIDEO_CONFIG = {
  fps: 30,
  jpegQuality: 80,
};
const ASPECT_RATIO_CONFIGS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  default: { width: 1920, height: 1080 }
};

// AWS Lambda configuration
const REGION = (process.env.AWS_REGION || 'us-east-1') as AWSRegion;
const FUNCTION_NAME = 'remotion-render-4-0-242-mem2048mb-disk2048mb-120sec'
const SERVE_URL = 'https://remotionlambda-useast1-0303dghv3x.s3.us-east-1.amazonaws.com/sites/mappbook-animation/index.html'
const BUCKET_NAME = 'remotionlambda-useast1-0303dghv3x';
const MAPBOX_TOKEN = process.env.REMOTION_MAPBOX_ACCESS_TOKEN;

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Environment validation
if (!SERVE_URL) {
  throw new Error('REMOTION_SERVE_URL environment variable not set');
}
if (!BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME environment variable not set');
}
if (!MAPBOX_TOKEN) {
  throw new Error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER environment variable not set');
}
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { points, aspectRatio, mappbook_user_id } = await req.json();

    // Validate input
    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Invalid points data' },
        { status: 400 }
      );
    }

    if (!mappbook_user_id) {
      return NextResponse.json(
        { error: 'mappbook_user_id is required' },
        { status: 400 }
      );
    }

    // Check credits availability
    const { data: userData, error: fetchError } = await supabase
      .from('MappBook_Users')
      .select('animation_credits')
      .eq('mappbook_user_id', mappbook_user_id)
      .single();

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify credits' },
        { status: 500 }
      );
    }

    if (!userData || userData.animation_credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 403 }
      );
    }

    // Get video dimensions based on aspect ratio
    const dimensions =  ASPECT_RATIO_CONFIGS.default;





    // npx remotion lambda render https://remotionlambda-useast1-0303dghv3x.s3.us-east-1.amazonaws.com/sites/mappbook-animation/index.html FlightAnimation out




    // Start the render

    const renderResponse = await renderMediaOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: 'FlightAnimation',
      inputProps: {
        points: points,
        mapboxToken: MAPBOX_TOKEN,
      },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 3,
      privacy: 'public',
      framesPerLambda: 500,
      frameRange: [0, 499],
      ...dimensions,
      chromiumOptions: {
        gl: 'swangle',
        headless: true
      },
      timeoutInMilliseconds: 900000,
    });








    // Update credits and processing flag on successful render
    const { error: updateEndError } = await supabase
      .from('MappBook_Users')
      .update({ 
        animation_credits: userData.animation_credits - 1
      })
      .eq('mappbook_user_id', mappbook_user_id);

    if (updateEndError) {
      console.error('Error updating processing flag and credits:', updateEndError);
      // Continue with the response even if the update fails
    }

    return NextResponse.json({
      renderId: renderResponse.renderId,
      bucketName: renderResponse.bucketName || BUCKET_NAME,
      aspectRatio,
      remainingCredits: userData.animation_credits - 1
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