const { join } = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

async function downloadFFmpeg() {
  const ffmpegUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
  const response = await fetch(ffmpegUrl);
  if (!response.ok) throw new Error(`Failed to download FFmpeg: ${response.statusText}`);
  
  const ffmpegPath = join(__dirname, 'ffmpeg');
  await pipeline(response.body, createWriteStream(ffmpegPath));
  
  // Make the binary executable
  await chmod(ffmpegPath, '755');
}

// Download FFmpeg during build
downloadFFmpeg().catch(console.error);

module.exports = join(__dirname, 'ffmpeg');