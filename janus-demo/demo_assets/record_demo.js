// Records zone_concept.html for one full loop (~31s) into a WebM via Puppeteer screencast,
// then converts to MP4 via ffmpeg. Output to Downloads.
//
// Usage: node record_demo.js

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTML_PATH = path.resolve(__dirname, 'zone_concept.html');
const HTML_URL = 'file:///' + HTML_PATH.replaceAll('\\', '/');
const DOWNLOADS = path.join(os.homedir(), 'Downloads');
const STAMP = new Date().toISOString().slice(0, 10);
const WEBM_PATH = path.join(DOWNLOADS, `Janus_3D_Zone_Concept_${STAMP}.webm`);
const MP4_PATH = path.join(DOWNLOADS, `Janus_3D_Zone_Concept_${STAMP}.mp4`);

const RECORD_SECONDS = 33;
const VIEWPORT = { width: 1920, height: 1080 };

console.log(`[recorder] launching Chromium...`);
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: VIEWPORT,
  args: ['--window-size=1920,1080', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage();
await page.setViewport(VIEWPORT);
console.log(`[recorder] loading ${HTML_URL}`);
await page.goto(HTML_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

// Wait for loading overlay to disappear (PMREM + materials init can take a few seconds)
await page.waitForSelector('#loading.hidden', { timeout: 20000 }).catch(() => {});
await new Promise(r => setTimeout(r, 1500));

console.log(`[recorder] starting screencast -> ${WEBM_PATH}`);
const recorder = await page.screencast({ path: WEBM_PATH });

await new Promise(r => setTimeout(r, RECORD_SECONDS * 1000));

console.log(`[recorder] stopping screencast`);
await recorder.stop();
await browser.close();

console.log(`[recorder] converting to MP4 with ffmpeg...`);
await new Promise((resolve, reject) => {
  const ff = spawn('ffmpeg', [
    '-y',
    '-i', WEBM_PATH,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    MP4_PATH,
  ], { stdio: 'inherit' });
  ff.on('close', code => code === 0 ? resolve() : reject(new Error('ffmpeg exit ' + code)));
});

try { fs.unlinkSync(WEBM_PATH); } catch {}
console.log(`\n[done] ${MP4_PATH}`);
