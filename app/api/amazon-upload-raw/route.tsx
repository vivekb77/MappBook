import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/components/utils/supabase-admin";

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = `${userId}/${new Date().toISOString()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('amazon-order-reports')
      .upload(fileName, file);

    if (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ path: fileName });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}