// /api/polls/create-poll/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase client with anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get poll data
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

      if (!Array.isArray(question.options)) {
        return NextResponse.json(
          { error: 'Question options must be an array' },
          { status: 400 }
        );
      }

      const validOptions = question.options.filter((opt: { text: { trim: () => { (): any; new(): any; length: number; }; }; }) => opt.text && opt.text.trim().length > 0);
      if (validOptions.length < 2) {
        return NextResponse.json(
          { error: 'Each question must have at least 2 options' },
          { status: 400 }
        );
      }
    }

    // Clean up questions data to remove empty options while preserving IDs
    const cleanedQuestions = pollData.questions.map((question: { id: any; text: any; options: any[]; }) => ({
      id: question.id,
      text: question.text,
      options: question.options
        .filter(opt => opt.text && opt.text.trim().length > 0)
        .map(opt => ({
          id: opt.id,
          text: opt.text.trim()
        }))
    }));

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(pollData.pollLength));

    // Get the user's Supabase ID mapping from Clerk ID
    const { data: userMapping } = await supabase
      .from('MappBook_Users')
      .select('mappbook_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!userMapping) {
      return NextResponse.json({ error: 'User mapping not found' }, { status: 404 });
    }

    // Ensure the mappbook_user_id in request matches the authenticated user
    if (pollData.mappbook_user_id !== userMapping.mappbook_user_id) {
      pollData.mappbook_user_id = userMapping.mappbook_user_id; // Force correct ID
    }

    // Improved error handling in /api/polls/create-poll/route.ts
    const { data: poll, error: pollError } = await supabase
      .from('Poll_Questions')
      .insert({
        title: pollData.title,
        description: pollData.description || '',
        author: pollData.author,
        poll_length: parseInt(pollData.pollLength),
        questions: cleanedQuestions,
        expires_at: expiresAt.toISOString(),
        mappbook_user_id: userMapping.mappbook_user_id,
        is_active: true
      })
      .select('poll_id, poll_id_to_share')
      .single();

    if (pollError) {
      console.error('Error creating poll:', JSON.stringify(pollError, null, 2));
      return NextResponse.json({
        error: 'Failed to create poll',
        details: pollError.message,
        code: pollError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      poll_id: poll.poll_id,
      share_id: poll.poll_id_to_share,
      url: `https://www.mappbook.com/poll/${poll.poll_id_to_share}`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}