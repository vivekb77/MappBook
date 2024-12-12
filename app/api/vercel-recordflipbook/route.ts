// app/api/vercel-recordflipbook/route.ts
import type { NextRequest } from 'next/server';
import { supabase } from '@/components/utils/supabase';
import chromium from '@sparticuz/chromium';
import puppeteer, { Page } from 'puppeteer-core';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Set FFmpeg path to the static binary
ffmpeg.setFfmpegPath('/var/task/node_modules/ffmpeg-static/ffmpeg');

// Environment variables
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const execAsync = promisify(exec);

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

async function processFramesWithFFmpeg(
  framesDir: string,
  outputPath: string,
  fps: number
): Promise<void> {
  // Verify paths are within /tmp
  if (!framesDir.startsWith('/tmp/') || !outputPath.startsWith('/tmp/')) {
    throw new Error('Input and output paths must be within /tmp directory');
  }

  try {
    console.log('Processing frames with FFmpeg...');
    const inputPath = path.join(framesDir, 'frame_%06d.png');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .inputFPS(fps)
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-crf 23'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('FFmpeg processing finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

  } catch (error) {
    console.error('FFmpeg processing failed:', error);
    throw error;
  }
}



async function recordFlipBook(
  locationCount: number,
  mappbookUserId: string
): Promise<string> {
  console.log('Starting recordFlipBook in Vercel environment');
  
  const browserOptions = await getChromiumOptions();
  const browser = await puppeteer.launch(browserOptions);
  
  // Use Vercel's /tmp directory
  const framesDir = `/tmp/frames_${Date.now()}`;
  const videoPath = `/tmp/video_${Date.now()}.mp4`;
  let frameCount = 0;
  let page: Page;

  try {
    // Create frames directory
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('console', (msg) => console.log('Browser console:', msg.text()));

    const pageUrl = `${APP_URL}/playflipbook?userId=${mappbookUserId}`;
    console.log('Navigating to:', pageUrl);

    await page.goto(pageUrl, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000,
    });

    // Initial wait for page to stabilize
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const woodenElement = await page.waitForSelector(
      '[data-testid="wooden-background"]',
      {
        timeout: 10000,
        visible: true,
      }
    );

    if (!woodenElement) {
      throw new Error('Wooden background element not found');
    }

    const flipButton = await page.waitForSelector(
      '[data-testid="flip-button"]',
      {
        timeout: 10000,
        visible: true,
      }
    );

    if (!flipButton) {
      throw new Error('Flip button not found');
    }

    const woodenBounds = await woodenElement.boundingBox();
    if (!woodenBounds) {
      throw new Error('Could not get wooden container bounds');
    }

    const width = Math.floor(woodenBounds.width / 2) * 2;
    const height = Math.floor(woodenBounds.height / 2) * 2;

    const captureFrame = async (): Promise<void> => {
      const frameFile = path.join(
        framesDir,
        `frame_${frameCount.toString().padStart(6, '0')}.png`
      );
      try {
        await page.screenshot({
          path: frameFile,
          type: 'png',
          clip: {
            x: woodenBounds.x,
            y: woodenBounds.y,
            width,
            height,
          },
        });
        frameCount++;
      } catch (error) {
        console.error('Error capturing frame:', error);
        throw error;
      }
    };

    await captureFrame();

    const fps = 24;
    const secondsPerSpread = 1;
    const totalSpreads = Math.ceil((locationCount + 2) / 2);

    for (let spread = 0; spread < totalSpreads; spread++) {
      console.log(`Processing spread ${spread + 1}/${totalSpreads}`);

      for (let i = 0; i < fps * secondsPerSpread; i++) {
        await captureFrame();
        await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
      }

      if (spread < totalSpreads - 1) {
        await flipButton.click();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log('Creating video from frames using FFmpeg...');
    await processFramesWithFFmpeg(framesDir, videoPath, fps);

    console.log('Uploading video to Supabase Storage...');
    const videoFileName = `flipbook_${mappbookUserId}_${Date.now()}.mp4`;
    const videoBuffer = await fs.promises.readFile(videoPath);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('flipbook-videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    const { data: { publicUrl: videoUrl } } = supabase
      .storage
      .from('flipbook-videos')
      .getPublicUrl(videoFileName);

    return videoUrl;

  } catch (error) {
    console.error('Error in recordFlipBook:', error);
    throw error;
  } finally {
    try {
      if (fs.existsSync(framesDir)) {
        fs.rmSync(framesDir, { recursive: true });
      }
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  console.log('Starting Vercel function processing');

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

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

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