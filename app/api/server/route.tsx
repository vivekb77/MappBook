// /api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  renderMediaOnLambda,
  getRenderProgress,
  RenderMediaOnLambdaInput,
} from '@remotion/lambda/client';
import { createClient } from '@supabase/supabase-js';


// If specified, Remotion will send a POST request to the provided endpoint to notify your application when the Lambda rendering process finishes, errors out or times out.
const webhook: RenderMediaOnLambdaInput['webhook'] = {
  url: 'https://mappbook.com/api/remotion-webhook',
  secret: null,
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
    const { points, aspectRatio, showLabels, mappbook_user_id, animation_data_id, location_count } = await req.json();

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

    // https://www.remotion.dev/docs/lambda/rendermediaonlambda#framesperlambda

    // Start the render

    const renderResponse = await renderMediaOnLambda({
      region: 'us-east-1',
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition: 'FlightAnimation',
      inputProps: {
        points: points,
        aspectRatio: aspectRatio,
        showLabels: showLabels,
      },

      codec: 'h264',
      imageFormat: 'jpeg',
      jpegQuality: 80,
      // webhook,
      maxRetries: 1,
      privacy: 'public',

      //Video quality and performance settings
      crf: 28,  // Slightly favor compression over quality (default is 18)  lower the number, the better the quality, range 1-51

      muted: true,

      // Performance settings
      framesPerLambda: 50,
      concurrencyPerLambda: 2,

      timeoutInMilliseconds: 900000,
      logLevel: 'verbose', // keep only for debugging
      chromiumOptions: {
        gl: 'swangle',
        headless: true
      }
    });

    return NextResponse.json({
      renderId: renderResponse.renderId,
      bucketName: renderResponse.bucketName || BUCKET_NAME
    });

  } catch (error) {
    console.error('Render error:', error);

    return NextResponse.json(
      { error: 'Failed to start render' },
      { status: 500 }
    );
  }
}