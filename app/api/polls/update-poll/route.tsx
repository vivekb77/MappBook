// /api/polls/update-poll/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { poll_id, is_active } = body;
    
    // Validate required fields
    if (!poll_id) {
      return NextResponse.json(
        { error: 'Missing poll_id parameter' },
        { status: 400 }
      );
    }
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean value' },
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
    
    // Update the poll status
    const { data, error } = await supabase
      .from('polls')
      .update({ is_active })
      .eq('poll_id', poll_id)
      .select();
    
    if (error) {
      console.error('Error updating poll status:', error);
      return NextResponse.json(
        { error: 'Failed to update poll status' },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        poll_id,
        is_active,
        updated_at: new Date().toISOString()
      },
      message: `Poll status has been ${is_active ? 'activated' : 'deactivated'}`
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}