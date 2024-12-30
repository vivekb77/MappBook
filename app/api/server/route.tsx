// /api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  renderMediaOnLambda, 
  getRenderProgress, 
} from '@remotion/lambda/client';
import { createClient } from '@supabase/supabase-js';



// Video configuration
const ASPECT_RATIO_CONFIGS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  default: { width: 1920, height: 1080 }
};

// AWS Lambda configuration
const FUNCTION_NAME = 'remotion-render-4-0-242-mem2048mb-disk2048mb-120sec'
const SERVE_URL = 'https://remotionlambda-useast1-0303dghv3x.s3.us-east-1.amazonaws.com/sites/mappbook-animation/index.html'
const BUCKET_NAME = 'remotionlambda-useast1-0303dghv3x';

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











    // Start the render

    const renderResponse = await renderMediaOnLambda({
      region: 'us-east-1',
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: 'FlightAnimation',
      inputProps: {
        points: points,
      },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 1,
      privacy: 'public',
      framesPerLambda: 100,
      frameRange: [0, 99],
      chromiumOptions: {
        gl: 'swangle',
        headless: true
      }
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
      region: 'us-east-1',
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