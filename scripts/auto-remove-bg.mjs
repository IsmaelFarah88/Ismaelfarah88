#!/usr/bin/env node
import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const [, , inputPath, outputPath, thresholdArg] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/auto-remove-bg.mjs <input> <output> [threshold(0-255)]');
  process.exit(2);
}

const threshold = Number(thresholdArg ?? 220);

try {
  await stat(inputPath);
} catch (err) {
  console.error('Input file not found:', inputPath);
  process.exit(2);
}

async function run() {
  try {
    // Build a binary mask: flatten to white, greyscale, threshold, then invert so subject=white
    const mask = await sharp(inputPath)
      .flatten({ background: '#ffffff' })
      .greyscale()
      .threshold(threshold)
      .negate()
      .toBuffer();

    // Apply mask as alpha channel using dest-in composite and write PNG with alpha
    await sharp(inputPath)
      .ensureAlpha()
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toFile(outputPath);

    console.log('Saved transparent PNG:', outputPath);
  } catch (err) {
    console.error('Failed to remove background:', err.message || err);
    process.exit(1);
  }
}

run();
