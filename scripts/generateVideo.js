const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { spawn } = require('child_process');

class PassportVideoGenerator {
  constructor(width = 800, height = 1200) {
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.frameCount = 0;
    this.fps = 30;
    this.duration = 3; // reduced duration per page
    this.flipDuration = 1; // duration of flip animation in seconds
  }

  async drawPage(location, stamp, flipProgress = 0) {
    // Clear canvas
    this.ctx.fillStyle = '#F5E6D3';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save the context state
    this.ctx.save();

    // Apply page flip transform
    if (flipProgress > 0) {
      const angle = flipProgress * Math.PI;
      const scale = Math.cos(flipProgress * Math.PI / 2);
      
      // Move to center, apply transforms, then move back
      this.ctx.translate(this.canvas.width / 2, 0);
      this.ctx.scale(scale, 1);
      this.ctx.translate(-this.canvas.width / 2, 0);
      
      // Add shadow for 3D effect
      if (flipProgress < 0.5) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 15 * Math.sin(angle);
      }
    }

    // Draw background pattern
    this.ctx.fillStyle = '#D2B48C';
    for (let x = 0; x < this.canvas.width; x += 30) {
      for (let y = 0; y < this.canvas.height; y += 30) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw border
    this.ctx.strokeStyle = '#8B7355';
    this.ctx.lineWidth = 8;
    this.ctx.strokeRect(40, 40, this.canvas.width - 80, this.canvas.height - 80);

    // Draw location text
    this.ctx.fillStyle = '#463E33';
    this.ctx.font = 'bold 48px Garamond';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(location.place_name, this.canvas.width / 2, this.canvas.height - 200);
    
    this.ctx.font = '32px Garamond';
    this.ctx.fillText(location.place_country, this.canvas.width / 2, this.canvas.height - 150);

    if (stamp) {
      try {
        const svgBuffer = Buffer.from(stamp.svgCode);
        const img = await loadImage(svgBuffer);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(-Math.PI / 15);
        this.ctx.drawImage(img, -200, -200, 400, 400);
        this.ctx.restore();
      } catch (error) {
        console.error('Error drawing stamp:', error);
      }
    }

    // Restore the context state
    this.ctx.restore();

    // Draw page edge shadow
    if (flipProgress > 0) {
      const gradient = this.ctx.createLinearGradient(
        this.canvas.width * (1 - flipProgress), 0,
        this.canvas.width, 0
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  async drawNextPage(nextLocation, nextStamp, flipProgress) {
    // Draw the next page coming in from the right
    this.ctx.save();
    
    // Transform for the incoming page
    const angle = (1 - flipProgress) * Math.PI;
    const scale = Math.cos((1 - flipProgress) * Math.PI / 2);
    
    this.ctx.translate(this.canvas.width / 2, 0);
    this.ctx.scale(scale, 1);
    this.ctx.translate(-this.canvas.width / 2, 0);
    
    await this.drawPage(nextLocation, nextStamp);
    
    this.ctx.restore();
  }

  runFfmpeg(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      if (!ffmpeg) {
        reject(new Error('ffmpeg-static not found'));
        return;
      }

      const args = [
        '-framerate', String(this.fps),
        '-i', inputPath,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputPath
      ];

      const process = spawn(ffmpeg, args);

      process.stderr.on('data', (data) => {
        console.log(`ffmpeg: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      process.on('error', (err) => {
        reject(err);
      });
    });
  }

  async generateVideo(locations, stamps, outputPath) {
    const framesDir = path.join(process.cwd(), 'temp_frames');
    await fs.promises.mkdir(framesDir, { recursive: true });

    try {
      // Generate frames for each page and transition
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const nextLocation = locations[i + 1];
        const stamp = stamps.find(s => s.country.toLowerCase() === location.place_country.toLowerCase());
        const nextStamp = nextLocation ? 
          stamps.find(s => s.country.toLowerCase() === nextLocation.place_country.toLowerCase()) :
          null;

        // Regular page display frames
        const displayFrames = (this.duration - this.flipDuration) * this.fps;
        for (let frame = 0; frame < displayFrames; frame++) {
          await this.drawPage(location, stamp);
          
          const frameFile = path.join(framesDir, `frame_${this.frameCount.toString().padStart(6, '0')}.png`);
          const out = fs.createWriteStream(frameFile);
          const stream = this.canvas.createPNGStream();
          stream.pipe(out);
          await new Promise((resolve) => out.on('finish', resolve));
          this.frameCount++;
        }

        // Page flip animation frames
        if (nextLocation) {
          const flipFrames = this.flipDuration * this.fps;
          for (let frame = 0; frame < flipFrames; frame++) {
            const progress = frame / flipFrames;
            
            // Clear canvas
            this.ctx.fillStyle = '#F5E6D3';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw current page with flip effect
            if (progress < 0.5) {
              await this.drawPage(location, stamp, progress * 2);
            }

            // Draw next page coming in
            if (progress >= 0.5) {
              await this.drawNextPage(nextLocation, nextStamp, (progress - 0.5) * 2);
            }

            const frameFile = path.join(framesDir, `frame_${this.frameCount.toString().padStart(6, '0')}.png`);
            const out = fs.createWriteStream(frameFile);
            const stream = this.canvas.createPNGStream();
            stream.pipe(out);
            await new Promise((resolve) => out.on('finish', resolve));
            this.frameCount++;
          }
        }
      }

      // Generate video from frames
      await this.runFfmpeg(
        path.join(framesDir, 'frame_%6d.png'),
        outputPath
      );
    } finally {
      // Cleanup temp frames
      await fs.promises.rm(framesDir, { recursive: true }).catch(console.error);
    }
  }
}

// Accept command line arguments
const [,, locationsPath, outputPath] = process.argv;

if (!locationsPath || !outputPath) {
  console.error('Usage: node generateVideo.js <locationsPath> <outputPath>');
  process.exit(1);
}

// Read the locations and stamps
const locations = JSON.parse(fs.readFileSync(locationsPath));
const stamps = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/visas.json'))).stamps;

// Generate the video
const generator = new PassportVideoGenerator();
generator.generateVideo(locations, stamps, outputPath)
  .then(() => {
    console.log('Video generated successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error generating video:', err);
    process.exit(1);
  });