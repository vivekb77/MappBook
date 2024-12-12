import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/components/utils/supabase';
import chromium from '@sparticuz/chromium';
import puppeteer, { Page, PuppeteerLaunchOptions } from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

// Environment variables
const APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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

// Helper function to get browser options
const getChromiumOptions = async (): Promise<PuppeteerLaunchOptions> => {
  const isDev = process.env.NODE_ENV === 'development';
  console.log('Environment:', isDev ? 'development' : 'production');

  if (isDev) {
    return {
      args: ['--hide-scrollbars', '--disable-web-security'],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: false as const,
    };
  }

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
    // ignoreHTTPSErrors: true
  };
};

// Helper function to upload a single frame to Cloudinary
const uploadFrame = async (
  frameFile: string,
  mappbookUserId: string
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(frameFile, {
      resource_type: 'image',
      folder: `flipbook_frames/${mappbookUserId}`,
    });
    return result.public_id;
  } catch (error) {
    console.error('Error uploading frame:', error);
    throw error;
  }
};

const checkVideoStatus = async (publicId: string): Promise<string> => {
  const maxAttempts = 30; // Maximum number of attempts
  const delayBetweenAttempts = 10000; // 2 seconds delay between attempts

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video'
      });
      
      if (result.secure_url) {
        console.log('Video processing completed:', result.secure_url);
        return result.secure_url;
      }
    } catch (error: any) {
      if (error.error?.message?.includes('Resource not found')) {
        console.log(`Attempt ${attempt + 1}: Video still processing...`);
      } else {
        console.error('Error checking video status:', error);
        throw error;
      }
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
  }

  throw new Error('Video processing timeout exceeded');
};

async function recordFlipBook(
  locationCount: number,
  mappbookUserId: string
): Promise<string> {
  console.log('Starting recordFlipBook with:', {
    locationCount,
    mappbookUserId,
  });

  const browserOptions = await getChromiumOptions();
  console.log('Launching browser...');
  const browser = await puppeteer.launch(browserOptions);

  let page: Page;
  const framesDir = path.join('/tmp', `frames_${Date.now()}`);
  let frameCount = 0;
  const uploadedFrames: string[] = [];

  try {
    // Create frames directory
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // Create and setup page
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable debug logging
    page.on('console', (msg) => console.log('Browser console:', msg.text()));

    // Navigate to page
    const pageUrl = `${APP_URL}/playflipbook?userId=${mappbookUserId}`;
    console.log('Navigating to:', pageUrl);

    await page.goto(pageUrl, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000,
    });

    console.log('Page loaded, waiting for elements...');

    // Initial wait for page to stabilize
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Wait for elements
    console.log('Waiting for wooden background...');
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

    console.log('Waiting for flip button...');
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

    // Get element bounds
    const woodenBounds = await woodenElement.boundingBox();
    if (!woodenBounds) {
      throw new Error('Could not get wooden container bounds');
    }

    // Ensure dimensions are even
    const width = Math.floor(woodenBounds.width / 2) * 2;
    const height = Math.floor(woodenBounds.height / 2) * 2;

    // Capture and upload frames
    const captureAndUploadFrame = async (): Promise<void> => {
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
        const publicId = await uploadFrame(frameFile, mappbookUserId);
        uploadedFrames.push(publicId);
        frameCount++;
      } catch (error) {
        console.error('Error capturing frame:', error);
        throw error;
      }
    };

    // Initial capture
    console.log('Capturing initial frame...');
    await captureAndUploadFrame();

    // Process all spreads
    const fps = 14;
    const secondsPerSpread = 1;
    const totalSpreads = Math.ceil((locationCount + 2) / 2);

    for (let spread = 0; spread < totalSpreads; spread++) {
      console.log(`Processing spread ${spread + 1}/${totalSpreads}`);

      // Capture frames for current spread
      for (let i = 0; i < fps * secondsPerSpread; i++) {
        await captureAndUploadFrame();
        await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
      }

      // Move to next spread if not the last one
      if (spread < totalSpreads - 1) {
        await flipButton.click();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log('Creating video from frames...');

    const videoResult = await cloudinary.uploader.create_slideshow({
      folder: `flipbook_videos/${mappbookUserId}`,
      public_ids: uploadedFrames,
      manifest_json: JSON.stringify({
        w: 1280,
        h: 720,
        du: uploadedFrames.length / 24,
        fps: 24,
        vars: {
          sdur: 1 / 24,
          transitions: false
        }
      }) as any
    });
    
    console.log('Video creation initiated:', videoResult);

    // Wait for video processing to complete
    const videoUrl = await checkVideoStatus(videoResult.public_id);
    console.log('Final video URL:', videoUrl);

    return videoUrl;
  } catch (error) {
    console.error('Error in recordFlipBook:', error);
    throw error;
  } finally {
    // Cleanup
    try {
      // Clean up Cloudinary resources
      for (const publicId of uploadedFrames) {
        await cloudinary.uploader.destroy(publicId);
      }

      // Clean up local files
      if (frameCount > 0) {
        fs.rmSync(framesDir, { recursive: true });
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Close browser
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('Starting request processing');

  try {
    const { locationCount, mappbook_user_id } =
      (await req.json()) as RequestBody;

    if (!locationCount || !mappbook_user_id) {
      throw new Error('Missing required parameters');
    }

    const videoUrl = await recordFlipBook(
      parseInt(locationCount),
      mappbook_user_id
    );

    const { error: dbError } = await supabase.from('FlipBook_Video').insert({
      mappbook_user_id,
      video_url: videoUrl,
      location_count: locationCount,
      is_deleted: false,
    });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`Process completed in ${(Date.now() - startTime) / 1000}s`);

    return NextResponse.json({
      success: true,
      video_url: videoUrl,
      user_id: mappbook_user_id,
    } as SuccessResponse);
  } catch (error: unknown) {
    console.error('Process failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
