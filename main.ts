// News image entry for make.fun news-image-20261122.
// Writes the bundled front-page image to /output/entry.png.
// Deterministic: a byte-for-byte copy of entry.png, same bytes every run.
// After copying, the output is read back and compared byte-for-byte with
// the source, and checked against the competition caps (at most 1 MiB and
// 1024 by 1024 pixels); any mismatch or over-cap file fails loudly instead
// of silently submitting a broken entry.
// Node 22, standard library only. No network.

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const dest = join(outDir, 'entry.png');

const MAX_BYTES = 1024 * 1024;

// PNG header: width and height are big-endian uint32 at bytes 16 and 20.
function pngSize(buf: Buffer): { w: number; h: number } {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('entry.png is not a PNG file');
  }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const source = readFileSync(src);
const { w, h } = pngSize(source);
if (source.length > MAX_BYTES) throw new Error(`entry.png is ${source.length} bytes, over the 1 MiB cap`);
if (w > 1024 || h > 1024) throw new Error(`entry.png is ${w}x${h}, over the 1024x1024 cap`);

mkdirSync(outDir, { recursive: true });
copyFileSync(src, dest);

const written = readFileSync(dest);
if (!written.equals(source)) throw new Error('output differs from entry.png');
if (statSync(dest).size !== source.length) throw new Error('output size mismatch');
