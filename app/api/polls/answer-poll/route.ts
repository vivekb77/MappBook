// /api/polls/submit-answer/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client with anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get request body
    const { answers } = await req.json();

    // Validate the request
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Check if all required fields are present
    const requiredFields = ['poll_id', 'poll_id_to_share', 'hexagon_region', 'question_id', 'answer_option_id'];
    const missingFields = answers.some(answer => 
      requiredFields.some(field => !answer[field])
    );

    if (missingFields) {
      return NextResponse.json({ 
        error: 'Missing required fields in one or more answers',
        requiredFields
      }, { status: 400 });
    }

    // Check the poll exists and is active
    const pollId = answers[0].poll_id;
    const { data: pollData, error: pollError } = await supabase
      .from('Poll_Questions')
      .select('poll_id, is_active, expires_at')
      .eq('poll_id', pollId)
      .single();

    if (pollError || !pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (!pollData.is_active) {
      return NextResponse.json({ error: 'This poll is no longer active' }, { status: 400 });
    }

    // Check if poll is expired
    const now = new Date();
    const expiresAt = new Date(pollData.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ error: 'This poll has expired' }, { status: 400 });
    }

    // Get client IP from request headers as backup
    const clientIp = 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') || 
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('true-client-ip') ||
      'unknown';

    // Insert all answers
    const { error: insertError } = await supabase
      .from('Poll_Answers')
      .insert(answers.map(answer => ({
        ...answer,
        // Use provided IP (client fingerprint) or fall back to server-detected IP
        ip_address: answer.ip_address || clientIp
      })));

    if (insertError) {
      console.error('Error inserting answers:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save answers',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Answers submitted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in submit-answer API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred while processing your answers'
    }, { status: 500 });
  }
}