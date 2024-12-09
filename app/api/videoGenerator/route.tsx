// app/api/videoGenerator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { unlink, writeFile } from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { locations } = data;
    
    // Create temporary locations file
    const locationsPath = path.join(process.cwd(), 'temp_locations.json');
    await writeFile(locationsPath, JSON.stringify(locations));
    
    const outputPath = path.join(process.cwd(), 'public', 'generated', `passport_${Date.now()}.mp4`);
    
    // Run the video generation script
    await new Promise((resolve, reject) => {
      const process = spawn('node', [
        'scripts/generateVideo.js',
        locationsPath,
        outputPath
      ]);

      process.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });

    // Clean up temp file
    await unlink(locationsPath);
    
    return NextResponse.json({ 
      videoUrl: `/generated/${path.basename(outputPath)}` 
    });
    
  } catch (error) {
    console.error('Error in video generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}