// Records every zone_concept_*.html (and the master zone_concept.html) for
// one full timeline loop (~33s) and writes MP4s to ~/Downloads.
//
// Usage: node record_all.js [name1 name2 ...]
//   With no args: records all 10 variants.
//   With args: records only the listed variants (e.g., `node record_all.js casino hotel`).

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VARIANTS = [
  { key: 'restaurant', file: 'zone_concept.html',          label: 'Restaurant' },
  { key: 'retail',     file: 'zone_concept_retail.html',   label: 'Retail' },
  { key: 'fitness',    file: 'zone_concept_fitness.html',  label: 'Fitness' },
  { key: 'casino',     file: 'zone_concept_casino.html',   label: 'Casino' },
  { key: 'hotel',      file: 'zone_concept_hotel.html',    label: 'Hotel' },
  { key: 'office',     file: 'zone_concept_office.html',   label: 'Office' },
  { key: 'stadium',    file: 'zone_concept_stadium.html',  label: 'Stadium' },
  { key: 'airforce',   file: 'zone_concept_airforce.html', label: 'AirForce' },
  { key: 'army',       file: 'zone_concept_army.html',     label: 'Army' },
  { key: 'navy',       file: 'zone_concept_navy.html',     label: 'Navy' },
];

const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const STAMP = new Date().toISOString().slice(0, 10);
const RECORD_SECONDS = 34;
const VIEWPORT = { width: 1920, height: 1080 };

const filter = process.argv.slice(2);
const targets = filter.length > 0
  ? VARIANTS.filter(v => filter.includes(v.key))
  : VARIANTS;

if (targets.length === 0) {
  console.error(`[recorder] no matches for: ${filter.join(', ')}`);
  console.error(`[recorder] valid keys: ${VARIANTS.map(v => v.key).join(', ')}`);
  process.exit(1);
}

console.log(`[recorder] recording ${targets.length} variant(s) to ${DOWNLOADS}`);

for (const variant of targets) {
  const htmlPath = path.resolve(__dirname, variant.file);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`[recorder] SKIP ${variant.key}: ${htmlPath} not found`);
    continue;
  }

  const url = 'file:///' + htmlPath.replaceAll('\\', '/');
  const webmPath = path.join(DOWNLOADS, `Janus_3D_${variant.label}_${STAMP}.webm`);
  const mp4Path  = path.join(DOWNLOADS, `Janus_3D_${variant.label}_${STAMP}.mp4`);

  console.log(`\n[recorder] === ${variant.label} ===`);
  console.log(`[recorder] launching Chromium for ${variant.file}`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: VIEWPORT,
    args: ['--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    console.log(`[recorder] loading ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#loading.hidden', { timeout: 20000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    console.log(`[recorder] screencast -> ${webmPath}`);
    const recorder = await page.screencast({ path: webmPath });
    await new Promise(r => setTimeout(r, RECORD_SECONDS * 1000));
    await recorder.stop();
  } finally {
    await browser.close();
  }

  console.log(`[recorder] ffmpeg -> ${mp4Path}`);
  await new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y',
      '-i', webmPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      mp4Path,
    ], { stdio: 'inherit' });
    ff.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg exit ' + code)));
  });

  try { fs.unlinkSync(webmPath); } catch {}
  console.log(`[recorder] done: ${mp4Path}`);
}

console.log(`\n[recorder] all done.`);
