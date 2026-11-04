import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rowSize = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC32 calculation
    const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Helper CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) | 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function drawFitAppIcon(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx * dx + dy * dy);

  // Background Dark Premium gradient
  const gradT = (y / height) * 0.7 + (x / width) * 0.3;
  let bgR = Math.floor(18 * (1 - gradT) + 9 * gradT);
  let bgG = Math.floor(23 * (1 - gradT) + 12 * gradT);
  let bgB = Math.floor(29 * (1 - gradT) + 16 * gradT);

  // If not maskable, rounded corners
  if (!isMaskable) {
    const cornerRadius = width * 0.22;
    const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
    const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
    const distToCorner = Math.sqrt(qx * qx + qy * qy);
    if (distToCorner > cornerRadius) {
      return [0, 0, 0, 0];
    }
  }

  // Draw Athletic "F" Symbol inside safe zone (scaled to size)
  const scale = width / 512;
  const sx = (x - cx) / scale;
  const sy = (y - cy) / scale;

  let inF = false;
  // Main vertical spine: -85 to -30, sy from -110 to 115
  if (sx >= -85 && sx <= -35 && sy >= -110 && sy <= 115) inF = true;
  // Top bar: sx from -85 to 80, sy from -110 to -55
  if (sx >= -85 && sx <= 85 && sy >= -110 && sy <= -60) inF = true;
  // Mid bar: sx from -85 to 55, sy from -20 to 25
  if (sx >= -85 && sx <= 55 && sy >= -20 && sy <= 25) inF = true;
  // Dynamic 45-deg slant cut at ends
  if (sx > 40 && sy < -60) {
    if ((sx - 40) + (sy + 110) > 85) inF = false;
  }
  if (sx > 20 && sy >= -20 && sy <= 25) {
    if ((sx - 20) + (sy + 20) > 75) inF = false;
  }

  // Accent slash
  let inAccent = false;
  if (sx >= 50 && sx <= 95 && sy >= -105 && sy <= -65) {
    if (sx - sy > 140) inAccent = true;
  }

  if (inAccent) {
    return [255, 255, 255, 255];
  }

  if (inF) {
    // Gradient from orange #FFAB52 at top to #FF7A1A at bottom
    const t = Math.max(0, Math.min(1, (sy + 110) / 225));
    const fR = Math.floor(255 * (1 - t) + 255 * t);
    const fG = Math.floor(171 * (1 - t) + 122 * t);
    const fB = Math.floor(82 * (1 - t) + 26 * t);
    return [fR, fG, fB, 255];
  }

  // Subtle glow around F
  const minGlowDist = 18;
  if (r < width * 0.38) {
    bgR = Math.min(255, bgR + 12);
    bgG = Math.min(255, bgG + 6);
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 192x192
const pwa192 = createPNG(192, 192, (x, y, w, h) => drawFitAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 512x512
const pwa512 = createPNG(512, 512, (x, y, w, h) => drawFitAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// maskable 512x512 (with safe zone, full bleed)
const pwaMaskable = createPNG(512, 512, (x, y, w, h) => drawFitAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// apple-touch-icon 180x180
const appleTouch = createPNG(180, 180, (x, y, w, h) => drawFitAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// favicon.ico (fallback 32x32 PNG)
const favicon = createPNG(32, 32, (x, y, w, h) => drawFitAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

console.log('Successfully generated all PWA icons!');
