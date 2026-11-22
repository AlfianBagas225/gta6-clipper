// gta6-clipper-01 entrypoint (Node 22, standard library only).
// Copies VIDEO.json from the repository root (MAKEFUN_BOT_DIR, default /bot)
// to MAKEFUN_OUTPUT_DIR (default /output), where the gate reads it.
// Before copying, it validates that VIDEO.json names a real YouTube Shorts
// URL and prints a short run summary (url, video id, source, destination,
// bytes copied). Invalid input fails loudly with a non-zero exit code.
//
// Local run:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SHORTS_URL = /^https:\/\/www\.youtube\.com\/shorts\/([A-Za-z0-9_-]{11})\/?(?:[?#].*)?$/;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, 'VIDEO.json');
const destination = join(OUTPUT_DIR, 'VIDEO.json');

let raw: string;
try {
  raw = readFileSync(source, 'utf8');
} catch (err) {
  fail(`VIDEO.json could not be read from ${source}: ${(err as Error).message}`);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  fail(`VIDEO.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  fail('VIDEO.json must contain a JSON object with a "url" field');
}

const url = (parsed as Record<string, unknown>).url;
if (typeof url !== 'string' || url.length === 0) {
  fail('VIDEO.json is missing a "url" string field');
}

const match = SHORTS_URL.exec(url);
if (match === null) {
  fail(`"url" is not a YouTube Shorts URL (expected https://www.youtube.com/shorts/<11-char-video-id>): ${url}`);
}
const videoId = match[1];

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(source, destination);
} catch (err) {
  fail(`VIDEO.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
}

// Integrity check: the copied file must be byte-identical to the validated source.
const copied = readFileSync(destination, 'utf8');
if (copied !== raw) {
  fail(`copied VIDEO.json at ${destination} does not match the validated source`);
}

const bytes = statSync(destination).size;
console.log('VIDEO.json validated and copied');
console.log(`  url:         ${url}`);
console.log(`  video id:    ${videoId}`);
console.log(`  source:      ${source}`);
console.log(`  destination: ${destination}`);
console.log(`  bytes:       ${bytes}`);
