// app/api/polls/get-poll/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Get a single poll by ID from query parameter
export async function GET(req: NextRequest) {
  try {
    // Get poll_id from query parameter
    const { searchParams } = new URL(req.url);
    const poll_id_to_share = searchParams.get('poll_id');
    
    if (!poll_id_to_share) {
      return NextResponse.json(
        { error: 'Missing poll_id parameter' }, 
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' }, 
        { status: 500 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: poll, error } = await supabase
      .from('Poll_Questions')
      .select('*')
      .eq('poll_id_to_share', poll_id_to_share)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Check if poll has expired
    const now = new Date();
    const expiresAt = new Date(poll.expires_at);
    const isExpired = now > expiresAt || !poll.is_active;
    
    // Transform to frontend format
    const transformedPoll = {
      poll_id: poll.poll_id,
      poll_id_to_share: poll.poll_id_to_share,
      title: poll.title,
      description: poll.description,
      author: poll.author,
      pollLength: poll.poll_length.toString(),
      questions: poll.questions,
      created_at: poll.created_at,
      expires_at: poll.expires_at,
      is_active: poll.is_active,
      isExpired: isExpired
    };

    // Create the response
    const response = NextResponse.json({
      success: true,
      data: transformedPoll,
      timestamp: new Date().toISOString()
    });
    
    // Add cache control headers (5 minutes = 300 seconds)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    
    return response;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}