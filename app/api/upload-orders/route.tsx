import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/components/utils/supabase-admin";

const supabase = getSupabaseAdmin();

export async function POST(request: Request) {
  try {
    const { report_date, order_data, mappbook_user_id } = await request.json();

    const { data: insertedData, error } = await supabase
      .from('Order_Analytics')
      .insert([{
        mappbook_user_id,
        report_date,
        order_data
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to insert data' }, { status: 500 });
    }

    return NextResponse.json(insertedData);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}