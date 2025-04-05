// app/api/create-poll/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
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
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get poll data from request
    const pollData = await req.json();
    
    // Validate poll data
    if (!pollData.title || !pollData.author || !pollData.pollLength || !pollData.mappbook_user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(pollData.questions) || pollData.questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }
    
    // Validate each question has at least 2 options
    for (const question of pollData.questions) {
      if (!question.text) {
        return NextResponse.json(
          { error: 'Question text is required' },
          { status: 400 }
        );
      }
      
      const validOptions = question.options.filter((opt: { trim: () => { (): any; new(): any; length: number; }; }) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        return NextResponse.json(
          { error: 'Each question must have at least 2 options' },
          { status: 400 }
        );
      }
    }
    
    // Clean up questions data to remove empty options
    const cleanedQuestions = pollData.questions.map((question: { text: any; options: any[]; }) => ({
      text: question.text,
      options: question.options.filter(opt => opt.trim().length > 0)
    }));
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(pollData.pollLength));
    
    // Insert the poll with questions as JSONB
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description || '',
        author: pollData.author,
        poll_length: parseInt(pollData.pollLength),
        questions: cleanedQuestions,
        expires_at: expiresAt.toISOString(),
        mappbook_user_id: pollData.mappbook_user_id,
        is_active: true
      })
      .select('poll_id')
      .single();
    
    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }
    
    // Create and return the response
    const response = NextResponse.json({
      success: true,
      poll_id: poll.poll_id,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/polls/${poll.poll_id}`
    });
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}