import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

async function recordFlipBook(locationCount: number, mappbookUserId: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: ['--window-size=1920,1080']
  });

  const framesDir = path.join(process.cwd(), 'temp_frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir);
  }

  let frameCount = 0;

  try {
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`http://localhost:3000/playflipbook?userId=${mappbookUserId}`, { 
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
  }
};

    // Get the flip button
    const flipButton = await page.$('[data-testid="flip-button"]');
    if (!flipButton) {
      throw new Error('Flip button not found');
    }

    // Initial capture of the cover
    await captureFrame();
    
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

    const outputPath = path.join(process.cwd(), 'public', 'generated', `passport_${mappbookUserId}_double_${Date.now()}.mp4`);
    
    // Use a simpler FFmpeg command
    await new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', [
        '-framerate', '24',
        '-i', path.join(framesDir, 'frame_%06d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputPath
      ]);

      ffmpegProcess.stderr.on('data', (data) => {
        console.log(`ffmpeg: ${data}`);
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });

    return outputPath;

  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  } finally {
    if (frameCount > 0) {
      fs.rmSync(framesDir, { recursive: true });
    }
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { locationCount, mappbook_user_id } = await req.json();
    
    if (!locationCount) {
      return NextResponse.json(
        { error: 'locationCount is required' },
        { status: 400 }
      );
    }

    if (!mappbook_user_id) {
      return NextResponse.json(
        { error: 'mappbook_user_id is required' },
        { status: 400 }
      );
    }

    const outputPath = await recordFlipBook(parseInt(locationCount), mappbook_user_id);
    const videoUrl = `/generated/${path.basename(outputPath)}`;

    return NextResponse.json({ 
      success: true,
      videoUrl,
      userId: mappbook_user_id
    });

  } catch (error) {
    console.error('Error in recording:', error);
    return NextResponse.json(
      { error: 'Failed to record video' },
      { status: 500 }
    );
  }
}