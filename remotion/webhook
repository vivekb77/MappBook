// /api/remotion-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const webhookData = await req.json();
    
    // Log the webhook payload for debugging
    console.log('Received webhook payload:', webhookData);

    // Extract relevant information from the webhook
    const {
      renderId,
      type, // 'success' | 'error' | 'timeout'
      outputUrl,
      error,
      meta // Contains your custom metadata if provided during render
    } = webhookData;

    // Validate the webhook data
    if (!renderId || !type) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Find the associated animation record in your database
    const { data: animationData, error: fetchError } = await supabase
      .from('Animation_Data')
      .select('*')
      .eq('render_id', renderId)
      .single();

    if (fetchError) {
      console.error('Error fetching animation data:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch animation data' },
        { status: 500 }
      );
    }

    // Update animation status based on webhook type
    const updateData: any = {
      video_generation_status: type === 'success' ? 'completed' : 'failed',
      updated_at: new Date().toISOString()
    };

    if (type === 'success' && outputUrl) {

      updateData.output_url = outputUrl;
      
      // Deduct credit on successful render
      const { data: userData, error: userError } = await supabase
        .from('MappBook_Users')
        .select('animation_credits')
        .eq('mappbook_user_id', animationData.mappbook_user_id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
      } else {
        const { error: creditError } = await supabase
          .from('MappBook_Users')
          .update({ 
            animation_credits: userData.animation_credits - 1
          })
          .eq('mappbook_user_id', animationData.mappbook_user_id);

        if (creditError) {
          console.error('Error updating credits:', creditError);
        }
      }

      // Store video information
      const { error: videoError } = await supabase
        .from('Animation_Video')
        .insert([{
          video_url: outputUrl,
          mappbook_user_id: animationData.mappbook_user_id,
          animation_data_id: animationData.id,
          location_count: animationData.location_count,
          video_cost: webhookData.costs?.accruedSoFar || 0,
          aspect_ratio: webhookData.aspect_ratio,
          show_labels: webhookData.show_labels || false
        }]);

      if (videoError) {
        console.error('Error storing video information:', videoError);
      }
    } else if (type === 'error') {
      updateData.error_message = error;
    }

    // Update the animation record
    const { error: updateError } = await supabase
      .from('Animation_Data')
      .update(updateData)
      .eq('render_id', renderId);

    if (updateError) {
      console.error('Error updating animation data:', updateError);
      return NextResponse.json(
        { error: 'Failed to update animation status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}




// Ensure only POST requests are allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}