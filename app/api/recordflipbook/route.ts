import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/components/utils/supabase"
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core'; 
import fs from 'fs';
import path from 'path';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';

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

  // Use /tmp directory for temporary files
  const framesDir = path.join('/tmp', `frames_${Date.now()}`);
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  const outputPath = path.join('/tmp', `passport_${mappbookUserId}_${Date.now()}.mp4`);
  let frameCount = 0;

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

    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    console.log('Loading FFmpeg...');
    
    // Load FFmpeg
    await ffmpeg.load({
      coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    console.log('FFmpeg loaded');

  // Write frames to FFmpeg virtual filesystem
  for (let i = 0; i < frameCount; i++) {
    const frameFile = path.join(framesDir, `frame_${i.toString().padStart(6, '0')}.png`);
    // Read frame data as Uint8Array
    const frameData = await fs.promises.readFile(frameFile, { encoding: null });
    // Convert to Uint8Array explicitly if needed
    const frameUint8Array = new Uint8Array(frameData);
    await ffmpeg.writeFile(`frame_${i.toString().padStart(6, '0')}.png`, frameUint8Array);
  }

  // Run FFmpeg command to create video
  await ffmpeg.exec([
    '-framerate', '24',
    '-i', 'frame_%06d.png',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-y',
    'output.mp4'
  ]);

   // Read the output file from FFmpeg's virtual filesystem
   const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
    
   // Write to temporary file as Uint8Array
   await fs.promises.writeFile(outputPath, data);

   // Upload to Supabase Storage
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

   if (uploadError) {
     throw new Error(`Failed to upload video: ${uploadError.message}`);
   }

    const { data: publicUrl } = supabase.storage
      .from('flipbook-videos')
      .getPublicUrl(`videos/${mappbookUserId}/${path.basename(outputPath)}`);

  return publicUrl.publicUrl;

  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  } finally {
    // Clean up temporary files
    if (frameCount > 0) {
      fs.rmSync(framesDir, { recursive: true });
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
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

    console.log('3. Setting up Chromium');
    const execPath = await chromium.executablePath();
    console.log('4. Chromium executable path:', execPath);

    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      executablePath: execPath,
      headless: true,
    });
    console.log('5. Browser launched');

    const framesDir = path.join('/tmp', `frames_${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });
    console.log('6. Temporary directory created:', framesDir);

    const page = await browser.newPage();
    console.log('7. New page created');

    await page.setViewport({ width: 1920, height: 1080 });
    const pageUrl = `${APP_URL}/playflipbook?userId=${mappbook_user_id}`;
    console.log('8. Navigating to:', pageUrl);

    await page.goto(pageUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 // Increased timeout
    });
    console.log('9. Page loaded');

    const videoUrl = await recordFlipBook(parseInt(locationCount), mappbook_user_id);
    console.log('10. Video recording completed:', videoUrl);

    const { error: dbError } = await supabase
      .from('FlipBook_Video')
      .insert({
        mappbook_user_id,
        video_url: videoUrl,
        location_count: locationCount,
        is_deleted: false
      });

    if (dbError) {
      console.error('11. Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('12. Process completed successfully');
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

    // Check for specific error types
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