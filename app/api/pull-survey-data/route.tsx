import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * API endpoint to fetch the latest hexagon analysis data
 * 
 * @route GET /api/hexagon-analysis
 * @returns {object} The latest hexagon analysis data
 */
export async function GET() {
  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' }, 
        { status: 500 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the stored procedure to get the latest analysis
    const { data: analysisData, error: functionError } = await supabase
      .rpc('get_latest_hexagon_analysis');

    // Handle any errors from the function call
    if (functionError) {
      console.error('Error fetching analysis:', functionError);
      return NextResponse.json(
        { error: 'Failed to fetch analysis data' }, 
        { status: 500 }
      );
    }

    // Create response with the data
    const response = NextResponse.json({ 
      success: true, 
      data: analysisData,
      timestamp: new Date().toISOString()
    });
    
    // Add cache control headers (1 hour = 3600 seconds)
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    
    // Return the response with cache headers
    return response;
    
  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in hexagon analysis endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}