// app/api/vercel-flipbook/route.ts
import type { NextRequest } from 'next/server';
import { supabase } from '@/components/utils/supabase';
import chromium from '@sparticuz/chromium';
import puppeteer, { Page } from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);



// Environment variables
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Configure for Vercel Pro
export const config = {
  runtime: 'nodejs',  // Changed from edge to nodejs
  maxDuration: 300    // 5 minutes
};

// Helper function to get browser options for Vercel environment
const getChromiumOptions = async () => {
  console.log('Setting up browser options for Vercel environment');
  
  const executablePath = await chromium.executablePath();

  return {
    args: chromium.args.concat([
      '--hide-scrollbars',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ]),
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    executablePath,
    headless: true as const,
  };
};

// Helper function to process frames with FFmpeg
async function setupFFmpeg(): Promise<string> {
  const ffmpegPath = '/tmp/ffmpeg';

  try {
    // Use a small, static FFmpeg binary
    const ffmpegUrl = 'https://edge.ffmpeg.org/ffmpeg-static-linux-x64';
    console.log('Downloading FFmpeg...');
    
    await execAsync(`curl -L ${ffmpegUrl} -o ${ffmpegPath}`);
    await execAsync(`chmod +x ${ffmpegPath}`);
    
    return ffmpegPath;
  } catch (error) {
    console.error('FFmpeg setup failed:', error);
    throw error;
  }
}

async function processFramesWithFFmpeg(
  framesDir: string,
  outputPath: string,
  fps: number
): Promise<void> {
  try {
    const ffmpegPath = await setupFFmpeg();
    
    // Use a more optimized FFmpeg command
    const ffmpegCommand = `${ffmpegPath} -y -framerate ${fps} -pattern_type glob -i "${framesDir}/*.png" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -crf 28 "${outputPath}"`;
    
    console.log('Executing FFmpeg command:', ffmpegCommand);
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    
    if (stdout) console.log('FFmpeg stdout:', stdout);
    if (stderr) console.log('FFmpeg stderr:', stderr);
    
  } catch (error) {
    console.error('FFmpeg processing failed:', error);
    throw error;
  }
}

async function recordFlipBook(
  locationCount: number,
  mappbookUserId: string
): Promise<string> {
  console.log('Starting recordFlipBook...');
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const framesDir = `/tmp/frames_${Date.now()}`;
  const videoPath = `/tmp/video_${Date.now()}.mp4`;
  let frameCount = 0;
  let page;

  try {
    fs.mkdirSync(framesDir, { recursive: true });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/playflipbook?userId=${mappbookUserId}`;
    await page.goto(pageUrl, { waitUntil: ['networkidle0'] });
    
    console.log('Waiting for page elements...');
    const woodenElement = await page.waitForSelector('[data-testid="wooden-background"]');
    const flipButton = await page.waitForSelector('[data-testid="flip-button"]');
    
    if (!woodenElement || !flipButton) throw new Error('Required elements not found');

    const woodenBounds = await woodenElement.boundingBox();
    if (!woodenBounds) throw new Error('Could not get element bounds');

    const width = Math.floor(woodenBounds.width / 2) * 2;
    const height = Math.floor(woodenBounds.height / 2) * 2;

    const fps = 24;
    const secondsPerSpread = 1;
    const totalSpreads = Math.ceil((locationCount + 2) / 2);

    console.log('Capturing frames...');
    for (let spread = 0; spread < totalSpreads; spread++) {
      for (let i = 0; i < fps * secondsPerSpread; i++) {
        const frameFile = path.join(framesDir, `frame_${frameCount.toString().padStart(6, '0')}.png`);
        
        await page.screenshot({
          path: frameFile,
          type: 'png',
          clip: { x: woodenBounds.x, y: woodenBounds.y, width, height }
        });
        
        frameCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }

      if (spread < totalSpreads - 1) {
        await flipButton.click();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log('Processing frames into video...');
    await processFramesWithFFmpeg(framesDir, videoPath, fps);

    console.log('Uploading to Supabase...');
    const videoBuffer = await fs.promises.readFile(videoPath);
    const videoFileName = `flipbook_${mappbookUserId}_${Date.now()}.mp4`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('flipbook-videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('flipbook-videos')
      .getPublicUrl(videoFileName);

    return publicUrl;

  } finally {
    // Cleanup
    if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true });
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    await browser.close();
  }
}


export async function POST(req: NextRequest) {
  try {
    const { locationCount, mappbook_user_id } = await req.json();

    if (!locationCount || !mappbook_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400 }
      );
    }

    const videoUrl = await recordFlipBook(
      parseInt(locationCount),
      mappbook_user_id
    );

    const { error: dbError } = await supabase
      .from('FlipBook_Video')
      .insert({
        mappbook_user_id,
        video_url: videoUrl,
        location_count: locationCount,
        is_deleted: false,
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        success: true,
        video_url: videoUrl,
        user_id: mappbook_user_id,
      }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Process failed:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500 }
    );
  }
}