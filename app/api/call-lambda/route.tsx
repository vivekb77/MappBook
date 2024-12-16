import { NextResponse } from 'next/server'
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  let mappbookUserId: string | null = null;
  
  try {
    const body = await request.json();
    mappbookUserId = body.mappbook_user_id;

    if (!mappbookUserId) {
      throw new Error('mappbook_user_id is required');
    }

    // First check credits availability
    const { data: userData, error: fetchError } = await supabase
      .from('MappBook_Users')
      .select('passport_video_credits')
      .eq('mappbook_user_id', mappbookUserId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!userData || userData.passport_video_credits <= 0) {
      throw new Error('Insufficient credits');
    }

    // Set processing flag to true at start
    const { error: updateStartError } = await supabase
      .from('MappBook_Users')
      .update({ is_video_processing: true })
      .eq('mappbook_user_id', mappbookUserId);

    if (updateStartError) {
      throw updateStartError;
    }

    // Call Lambda function
    const lambdaResponse = await fetch(
      'https://ahxobop3yrfa3rdi7fpevevrna0okbrz.lambda-url.us-east-1.on.aws/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }
    );

    const data = await lambdaResponse.json();

    if (!data.success) {
      throw new Error(data.error || 'Lambda function failed');
    }

    // On success: Set processing flag to false AND decrement credits
    const { error: updateEndError } = await supabase
      .from('MappBook_Users')
      .update({ 
        is_video_processing: false,
        passport_video_credits: userData.passport_video_credits - 1
      })
      .eq('mappbook_user_id', mappbookUserId);

    if (updateEndError) {
      console.error('Error updating processing flag and credits after success:', updateEndError);
    }

    return NextResponse.json(data);

  } catch (error: any) {
    // Ensure processing flag is set to false on error
    if (mappbookUserId) {
      const { error: updateErrorCleanup } = await supabase
        .from('MappBook_Users')
        .update({ is_video_processing: false })
        .eq('mappbook_user_id', mappbookUserId);

      if (updateErrorCleanup) {
        console.error('Error cleaning up processing flag:', updateErrorCleanup);
      }
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}