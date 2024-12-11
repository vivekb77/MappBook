import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/components/utils/supabase"
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core'; 
import fs from 'fs';
import path from 'path';
import { createFFmpeg, FFmpeg } from '@ffmpeg/ffmpeg';

export const dynamic = 'force-dynamic';

// Environment variables
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PROJECT_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

interface RequestBody {
  locationCount: string;
  mappbook_user_id: string;
}

interface SuccessResponse {
  success: true;
  video_url: string;
  user_id: string;
}

interface ErrorResponse {
  error: string;
}

async function recordFlipBook(locationCount: number, mappbookUserId: string): Promise<string> {
  console.log('Starting recordFlipBook with:', { locationCount, mappbookUserId });
  
  const browser = await puppeteer.launch({
    args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  // Declare ffmpeg instance at the top
  let ffmpeg: FFmpeg | null = null;
  let frameCount = 0;

  // Use /tmp directory for temporary files
  const framesDir = path.join('/tmp', `frames_${Date.now()}`);
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const outputPath = path.join('/tmp', `passport_${mappbookUserId}_${Date.now()}.mp4`);

  try {
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${APP_URL}/playflipbook?userId=${mappbookUserId}`, { 
      waitUntil: 'networkidle0' 
    });
    
    // Wait for both the wooden background container and flip button
    await page.waitForSelector('[data-testid="wooden-background"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="flip-button"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get the bounds of the wooden background container
    const woodenElement = await page.$('[data-testid="wooden-background"]');
    if (!woodenElement) {
      throw new Error('Wooden background container not found');
    }

    const woodenBounds = await woodenElement.boundingBox();
    if (!woodenBounds) {
      throw new Error('Could not get wooden container bounds');
    }

    // Ensure the dimensions are even numbers for ffmpeg
    const width = Math.floor(woodenBounds.width / 2) * 2;
    const height = Math.floor(woodenBounds.height / 2) * 2;

    const captureFrame = async () => {
      const frameFile = path.join(framesDir, `frame_${frameCount.toString().padStart(6, '0')}.png`);
      try {
        await page.screenshot({
          path: frameFile,
          type: 'png',
          clip: {
            x: woodenBounds.x,
            y: woodenBounds.y,
            width: width,
            height: height
          }
        });
        frameCount++;
      } catch (error) {
        console.error('Error capturing frame:', error);
        throw error;
      }
    };

    // Get the flip button
    const flipButton = await page.$('[data-testid="flip-button"]');
    if (!flipButton) {
      throw new Error('Flip button not found');
    }

    // Initial capture of the cover
    console.log('Frame capture started');
    await captureFrame();
    console.log('Initial frame captured');
    
    // Click the flip button to start
    await flipButton.click();
    
    // Calculate frames and timing
    const fps = 14; // Reduced from 30 for better stability
    const secondsPerSpread = 1;
    const totalSpreads = Math.ceil((locationCount + 2) / 2); // +2 for covers
    
    // Capture frames for each spread
    for (let spread = 0; spread < totalSpreads; spread++) {
      // Capture frames for current spread
      for (let i = 0; i < fps * secondsPerSpread; i++) {
        await captureFrame();
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }
      
      // Click to next spread if not the last one
      if (spread < totalSpreads - 1) {
        await flipButton.click();
        // Add small delay after click for animation to start
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Verify we have captured frames
    if (frameCount === 0) {
      throw new Error('No frames were captured');
    }

       // Initialize FFmpeg with CDN paths
       ffmpeg = createFFmpeg({
        log: true,
        logger: ({ message }) => console.log('FFmpeg:', message),
        progress: ({ ratio }) => {
          console.log(`FFmpeg Progress: ${(ratio * 100).toFixed(2)}%`);
        },
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
      });
    
    
    console.log('Loading FFmpeg...');
    await ffmpeg.load();
    console.log('FFmpeg loaded');

    // Process frames in batches to manage memory
    const BATCH_SIZE = 50;
    for (let i = 0; i < frameCount; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, frameCount);
      console.log(`Processing frames ${i} to ${batchEnd - 1}`);
      
      for (let j = i; j < batchEnd; j++) {
        const frameFile = path.join(framesDir, `frame_${j.toString().padStart(6, '0')}.png`);
        try {
          const frameData = await fs.promises.readFile(frameFile);
          const frameName = `frame_${j.toString().padStart(6, '0')}.png`;
          const frameUint8Array = new Uint8Array(frameData.buffer, frameData.byteOffset, frameData.length);
          await ffmpeg.FS('writeFile', frameName, frameUint8Array);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during frame processing';
          console.error(`Error processing frame ${j}:`, error);
          throw new Error(`Frame processing failed: ${errorMessage}`);
        }
      }
    }

    // Create concat file with error handling
    try {
      const concatContent = Array.from({ length: frameCount })
        .map((_, i) => `file 'frame_${i.toString().padStart(6, '0')}.png'`)
        .join('\n');
      ffmpeg.FS('writeFile', 'concat.txt', new TextEncoder().encode(concatContent));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error creating concat file';
      console.error('Error creating concat file:', error);
      throw new Error(`Failed to create video sequence file: ${errorMessage}`);
    }

    // Run FFmpeg command with error handling
    try {
      await ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-framerate', '24',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '23',
        '-y',
        'output.mp4'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown FFmpeg error';
      console.error('FFmpeg encoding error:', error);
      throw new Error(`Video encoding failed: ${errorMessage}`);
    }

    // Read output with error handling
    let data: Uint8Array;
    try {
      data = new Uint8Array(ffmpeg.FS('readFile', 'output.mp4'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error reading output';
      console.error('Error reading output video:', error);
      throw new Error(`Failed to read encoded video: ${errorMessage}`);
    }

    // Upload to Supabase with retry
    let uploadAttempts = 0;
    const MAX_UPLOAD_ATTEMPTS = 3;
    
    while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('flipbook-videos')
          .upload(
            `videos/${mappbookUserId}/${path.basename(outputPath)}`,
            data,
            {
              contentType: 'video/mp4',
              cacheControl: '3600'
            }
          );

        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage
          .from('flipbook-videos')
          .getPublicUrl(`videos/${mappbookUserId}/${path.basename(outputPath)}`);

        return publicUrl.publicUrl;
      } catch (error) {
        uploadAttempts++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
        if (uploadAttempts === MAX_UPLOAD_ATTEMPTS) {
          throw new Error(`Upload failed after ${MAX_UPLOAD_ATTEMPTS} attempts: ${errorMessage}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }

    throw new Error('Upload failed after retries');

  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  } finally {
    // Clean up FFmpeg resources
    if (ffmpeg) {
      try {
        // Clean up files in FFmpeg's virtual filesystem
        ['output.mp4', 'concat.txt'].forEach(file => {
          try {
            // Add non-null assertion since we've checked ffmpeg exists
            ffmpeg!.FS('unlink', file);
          } catch (e) {
            // Ignore errors during cleanup
          }
        });

        // Clean up frame files
        for (let i = 0; i < frameCount; i++) {
          try {
            const frameName = `frame_${i.toString().padStart(6, '0')}.png`;
            ffmpeg!.FS('unlink', frameName);
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      } catch (e) {
        console.warn('Error during FFmpeg cleanup:', e);
      }
    }

    // Clean up temporary files
    if (frameCount > 0) {
      try {
        fs.rmSync(framesDir, { recursive: true });
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      } catch (e) {
        console.warn('Error cleaning up temporary files:', e);
      }
    }

    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('1. Starting request processing');
  
  try {
    const { locationCount, mappbook_user_id } = await req.json() as RequestBody;
    console.log('2. Request body parsed:', { locationCount, mappbook_user_id });
    
    if (!locationCount || !mappbook_user_id) {
      throw new Error('Missing required parameters');
    }

    const videoUrl = await recordFlipBook(parseInt(locationCount), mappbook_user_id);
    console.log('3. Video recording completed:', videoUrl);

    const { error: dbError } = await supabase
      .from('FlipBook_Video')
      .insert({
        mappbook_user_id,
        video_url: videoUrl,
        location_count: locationCount,
        is_deleted: false
      });

    if (dbError) {
      console.error('4. Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('5. Process completed successfully');
    console.log(`Total time: ${(Date.now() - startTime)/1000}s`);

    return NextResponse.json({ 
      success: true,
      video_url: videoUrl,
      user_id: mappbook_user_id
    } as SuccessResponse);

  } catch (error: unknown) {
    const timeTaken = (Date.now() - startTime)/1000;
    console.error(`Failed after ${timeTaken}s with error:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      time: new Date().toISOString()
    });

    if (error instanceof Error) {
      if (error.message.includes('net::ERR_CONNECTION_REFUSED') || 
          error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        return NextResponse.json(
          { error: `Failed to connect to page: ${APP_URL} might be unavailable` },
          { status: 500 }
        );
      }

      if (error.message.includes('Protocol error')) {
        return NextResponse.json(
          { error: 'Browser initialization failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? `Recording failed: ${error.message}`
          : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}