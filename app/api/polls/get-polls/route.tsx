// /api/polls/get-polls/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: NextRequest) {
  try {
    // Parse the URL to get query parameters
    const url = new URL(req.url);
    const mappbookUserId = url.searchParams.get('mappbook_user_id');
    
    // Check if we have a user ID
    if (!mappbookUserId) {
      return NextResponse.json(
        { error: 'Missing mappbook_user_id parameter' },
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
    
    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all polls for this Mappbook user
    const { data: polls, error } = await supabase
      .from('polls')
      .select('*')
      .eq('mappbook_user_id', mappbookUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching polls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch polls' },
        { status: 500 }
      );
    }
    
    // Transform poll_length from number to string to match the frontend model
    const transformedPolls = polls.map(poll => ({
      poll_id: poll.poll_id,
      title: poll.title,
      description: poll.description,
      author: poll.author,
      pollLength: poll.poll_length.toString(),
      questions: poll.questions,
      created_at: poll.created_at,
      expires_at: poll.expires_at,
      is_active: poll.is_active,
      mappbook_user_id: poll.mappbook_user_id,
      // Add URL for each poll
      url: `https://mappbook.com/poll/${poll.poll_id}`
    }));
    
    // Create the response
    const response = NextResponse.json({
      success: true,
      data: transformedPolls,
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

// // Get a single poll by ID
// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const pollId = params.id;
    
//     // Initialize Supabase client
//     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
//     const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
//     if (!supabaseUrl || !supabaseServiceKey) {
//       return NextResponse.json(
//         { error: 'Missing Supabase configuration' }, 
//         { status: 500 }
//       );
//     }
    
//     // Create Supabase client
//     const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
//     const { data: poll, error } = await supabase
//       .from('polls')
//       .select('*')
//       .eq('poll_id', pollId)
//       .single();
    
//     if (error) {
//       return NextResponse.json(
//         { error: 'Poll not found' },
//         { status: 404 }
//       );
//     }
    
//     // Check if poll has expired
//     const now = new Date();
//     const expiresAt = new Date(poll.expires_at);
//     const isExpired = now > expiresAt || !poll.is_active;
    
//     // Transform to frontend format
//     const transformedPoll = {
//       poll_id: poll.poll_id,
//       name: poll.name,
//       description: poll.description,
//       author: poll.author,
//       pollLength: poll.poll_length.toString(),
//       questions: poll.questions,
//       created_at: poll.created_at,
//       expires_at: poll.expires_at,
//       is_active: poll.is_active,
//       is_expired: isExpired,
//       mappbook_user_id: poll.mappbook_user_id
//     };
    
//     // Create the response
//     const response = NextResponse.json({
//       success: true,
//       data: transformedPoll,
//       timestamp: new Date().toISOString()
//     });
    
//     // Add cache control headers (5 minutes = 300 seconds)
//     response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600');
    
//     return response;
    
//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return NextResponse.json(
//       { error: 'An unexpected error occurred' },
//       { status: 500 }
//     );
//   }
// }