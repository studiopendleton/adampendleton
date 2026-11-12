import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import jpeg from 'jpeg-js';
import type { ImageColumn } from './overscrollEdge';

const SAMPLE_ROWS = 128;
const cache = new Map<string, Promise<ImageColumn | null>>();

type DecodedJpeg = {
  width: number;
  height: number;
  data: Uint8Array;
};

function tinyJpegUrl(source: string): string {
  const url = new URL(source);
  url.searchParams.set('w', '32');
  url.searchParams.set('fm', 'jpg');
  url.searchParams.delete('auto');
  return url.toString();
}

export function columnFromRgba(data: Uint8Array, width: number, height: number): ImageColumn {
  const rows = Math.min(height, SAMPLE_ROWS);
  const samples: number[] = [];
  for (let index = 0; index < rows; index += 1) {
    const y0 = Math.floor((index * height) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((index + 1) * height) / rows));
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixel = (y * width + x) * 4;
        red += data[pixel] ?? 0;
        green += data[pixel + 1] ?? 0;
        blue += data[pixel + 2] ?? 0;
        count += 1;
      }
    }
    samples.push(
      (Math.round(red / count) << 16) | (Math.round(green / count) << 8) | Math.round(blue / count),
    );
  }
  return { width, height, samples };
}

async function readSource(source: string): Promise<Buffer | null> {
  if (source.startsWith('https://') || source.startsWith('http://')) {
    const response = await fetch(tinyJpegUrl(source));
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  }
  if (!source.startsWith('/') || source.includes('..')) return null;
  return readFile(join(process.cwd(), 'public', source.slice(1)));
}

async function loadColumn(source: string): Promise<ImageColumn | null> {
  try {
    const bytes = await readSource(source);
    if (!bytes) return null;
    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true }) as DecodedJpeg;
    if (decoded.width < 1 || decoded.height < 1) return null;
    return columnFromRgba(decoded.data, decoded.width, decoded.height);
  } catch {
    return null;
  }
}

export function imageColumn(source: string | undefined): Promise<ImageColumn | null> {
  if (!source) return Promise.resolve(null);
  const existing = cache.get(source);
  if (existing) return existing;
  const pending = loadColumn(source);
  cache.set(source, pending);
  return pending;
}
