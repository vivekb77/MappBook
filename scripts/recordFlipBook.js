// scripts/recordFlipBook.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

async function recordFlipBook() {
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
    
    // Set viewport for Instagram dimensions
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto('http://localhost:3000/record', { waitUntil: 'networkidle0' });

    console.log('Waiting for page to load...');
    
    // Wait longer for the FlipBook to be ready
    await page.waitForSelector('[data-testid="flipbook-container"]', { timeout: 10000 });
    
    // Add a small delay to ensure everything is loaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Page loaded, getting element position...');

    // Get the element and its position
    const flipBookElement = await page.$('[data-testid="flipbook-container"]');
    if (!flipBookElement) {
      throw new Error('FlipBook element not found');
    }

    const elementBox = await flipBookElement.boundingBox();
    console.log('Element box:', elementBox);

    // Calculate centered clip area
    const clipArea = {
      x: Math.max(0, elementBox.x),
      y: Math.max(0, elementBox.y),
      width: 1080,
      height: 1920
    };

    console.log('Starting frame capture with clip area:', clipArea);

    // Capture frames using screenshots
    const captureFrame = async () => {
      const frameFile = path.join(framesDir, `frame_${frameCount.toString().padStart(6, '0')}.png`);
      try {
        await page.screenshot({
          path: frameFile,
          type: 'png',
          clip: clipArea
        });
        console.log(`Captured frame ${frameCount}`);
        frameCount++;
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    };

    // Click the auto-flip button
    const flipButton = await page.$('[data-testid="flip-button"]');
    if (!flipButton) {
      throw new Error('Flip button not found. Make sure the button has data-testid="flip-button"');
    }
    await flipButton.click();
    console.log('Started auto-flip animation');

    // Capture frames
    const fps = 10;
    const secondsPerLocation = 1;
    const locationCount = 10; // Hardcoded for testing
    const totalFrames = fps * secondsPerLocation * locationCount;
    
    console.log(`Capturing ${totalFrames} frames at ${fps} fps...`);

    for (let i = 0; i < totalFrames; i++) {
      await captureFrame();
      await new Promise(resolve => setTimeout(resolve, 1000 / fps));
    }

    console.log(`Captured ${frameCount} frames. Converting to video...`);

    // Verify frames exist
    const frameFiles = fs.readdirSync(framesDir);
    if (frameFiles.length === 0) {
      throw new Error('No frames were captured');
    }
    console.log(`Found ${frameFiles.length} frame files`);

    // Convert frames to video
    const outputPath = path.join(process.cwd(), 'public', 'generated', `flipbook_${Date.now()}.mp4`);
    
    await new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath, [
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
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });

    console.log('Recording completed:', outputPath);
    return outputPath;

  } catch (error) {
    console.error('Error during recording:', error);
    throw error;
  } finally {
    // Keep frames for debugging if there was an error
    if (frameCount > 0) {
      console.log('Cleaning up temp frames...');
      fs.rmSync(framesDir, { recursive: true });
    }
    await browser.close();
  }
}

// If running directly from command line
if (require.main === module) {
  recordFlipBook()
    .then(console.log)
    .catch(console.error)
    .finally(() => process.exit());
}

module.exports = recordFlipBook;