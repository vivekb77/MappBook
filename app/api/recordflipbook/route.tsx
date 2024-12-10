// app/api/record/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

async function recordFlipBook(locationCount: number, mappbookUserId: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1080,
      height: 1920
    },
    args: ['--window-size=1080,1920']
  });

  const framesDir = path.join(process.cwd(), 'temp_frames');
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir);
  }

  let frameCount = 0;

  try {
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto(`http://localhost:3000/playflipbook?userId=${mappbookUserId}`, { 
      waitUntil: 'networkidle0' 
    });
    
    await page.waitForSelector('[data-testid="flipbook-container"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const flipBookElement = await page.$('[data-testid="flipbook-container"]');
    if (!flipBookElement) {
      throw new Error('FlipBook element not found');
    }

    const elementBox = await flipBookElement.boundingBox();
    const clipArea = {
      width: 1080,
      height: 1920
    };

    const captureFrame = async () => {
      const frameFile = path.join(framesDir, `frame_${frameCount.toString().padStart(6, '0')}.png`);
      try {
        await page.screenshot({
          path: frameFile,
          type: 'png',
        });
        frameCount++;
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    };

    const flipButton = await page.$('[data-testid="flip-button"]');
    if (!flipButton) {
      throw new Error('Flip button not found');
    }
    await flipButton.click();

    const fps = 30;
    const secondsPerLocation = 1;
    const totalFrames = fps * secondsPerLocation * locationCount;

    for (let i = 0; i < totalFrames; i++) {
      await captureFrame();
      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }

    // Include userId in the output filename for better tracking
    const outputPath = path.join(process.cwd(), 'public', 'generated', `passport_${mappbookUserId}_${Date.now()}.mp4`);
    
    await new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', [
        '-framerate', '30',
        '-i', path.join(framesDir, 'frame_%6d.png'),
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
      userId: mappbook_user_id // Return userId for reference
    });

  } catch (error) {
    console.error('Error in recording:', error);
    return NextResponse.json(
      { error: 'Failed to record video' },
      { status: 500 }
    );
  }
}