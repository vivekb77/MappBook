// src/app/api/fan-preferences/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { deviceId, homeHexagon, team, timestamp } = body;
    
    console.log(body)


    // Validate required fields
    if (!deviceId || !team) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId and team are required' },
        { status: 400 }
      );
    }

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('IPL_team_fan_preferences')
      .upsert(
        {
          device_id: deviceId,
          home_hexagon: homeHexagon,
          team,
          updated_at: timestamp || new Date().toISOString()
        },
        { onConflict: 'device_id' } // Update if device_id already exists
      )
      .select();

    if (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Fan preferences saved successfully',
      data
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}