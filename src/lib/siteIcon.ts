import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';

type Raster =
  | { kind: 'favicon'; size: 16 | 32 | 48; href: `/favicon-${16 | 32 | 48}x${16 | 32 | 48}.png` }
  | { kind: 'apple-touch'; size: 180; href: '/apple-touch-icon.png' };

type FaviconRaster = Extract<Raster, { kind: 'favicon' }>;

export type IconLink = {
  rel: 'icon' | 'apple-touch-icon';
  href: `/${string}`;
  type: 'image/svg+xml' | 'image/png' | 'image/x-icon';
  sizes: string;
};

const BLACK = { r: 0, g: 0, b: 0, a: 255, fill: '#000000' } as const;

const RASTERS = [
  { kind: 'favicon', size: 16, href: '/favicon-16x16.png' },
  { kind: 'favicon', size: 32, href: '/favicon-32x32.png' },
  { kind: 'favicon', size: 48, href: '/favicon-48x48.png' },
  { kind: 'apple-touch', size: 180, href: '/apple-touch-icon.png' },
] as const satisfies readonly Raster[];

const SVG_HREF = '/favicon.svg';
const ICO_HREF = '/favicon.ico';

const SVG_DOCUMENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${BLACK.fill}"/>
</svg>
`;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function faviconRows(): readonly FaviconRaster[] {
  const rows: FaviconRaster[] = [];
  for (const row of RASTERS) {
    switch (row.kind) {
      case 'favicon':
        rows.push(row);
        break;
      case 'apple-touch':
        break;
      default: {
        const unreachable: never = row;
        return unreachable;
      }
    }
  }
  return rows;
}

function iconLinkForRaster(row: Raster): IconLink {
  switch (row.kind) {
    case 'favicon':
      return {
        rel: 'icon',
        href: row.href,
        type: 'image/png',
        sizes: `${row.size}x${row.size}`,
      };
    case 'apple-touch':
      return {
        rel: 'apple-touch-icon',
        href: row.href,
        type: 'image/png',
        sizes: `${row.size}x${row.size}`,
      };
    default: {
      const unreachable: never = row;
      return unreachable;
    }
  }
}

export function iconLinkTags(): readonly IconLink[] {
  const icoSizes = faviconRows()
    .map((row) => `${row.size}x${row.size}`)
    .join(' ');
  return [
    { rel: 'icon', href: SVG_HREF, type: 'image/svg+xml', sizes: 'any' },
    { rel: 'icon', href: ICO_HREF, type: 'image/x-icon', sizes: icoSizes },
    ...RASTERS.map(iconLinkForRaster),
  ];
}

function assertPublicDir(publicDir: URL): void {
  if (publicDir.protocol !== 'file:' || !publicDir.pathname.endsWith('/')) {
    throw new Error('publicDir must be a file URL whose pathname ends in /');
  }
}

function fileIn(publicDir: URL, href: `/${string}`): URL {
  return new URL(href.slice(1), publicDir);
}

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function writeIfChanged(publicDir: URL, href: `/${string}`, bytes: Buffer): void {
  const target = fileIn(publicDir, href);
  try {
    if (readFileSync(target).equals(bytes)) return;
  } catch (error) {
    if (!isEnoent(error)) throw error;
  }
  const temp = new URL(`.${href.slice(1)}.tmp`, publicDir);
  writeFileSync(temp, bytes);
  renameSync(temp, target);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function blackRaster(size: number): Buffer {
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const pixel = row + 1 + x * 4;
      raw[pixel] = BLACK.r;
      raw[pixel + 1] = BLACK.g;
      raw[pixel + 2] = BLACK.b;
      raw[pixel + 3] = BLACK.a;
    }
  }
  return raw;
}

function encodePng(size: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(blackRaster(size))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function encodeIco(pngs: ReadonlyMap<string, Buffer>): Buffer {
  const frames = faviconRows().map((row) => {
    const png = pngs.get(row.href);
    if (!png) throw new Error(`missing encoded ${row.href}`);
    return { size: row.size, png };
  });
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  const parts: Buffer[] = [header];
  for (const [index, frame] of frames.entries()) {
    const entry = 6 + index * 16;
    header[entry] = frame.size;
    header[entry + 1] = frame.size;
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frame.png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    parts.push(frame.png);
    offset += frame.png.length;
  }
  return Buffer.concat(parts);
}

function bytesFor(link: IconLink, pngs: ReadonlyMap<string, Buffer>): Buffer {
  switch (link.type) {
    case 'image/svg+xml':
      return Buffer.from(SVG_DOCUMENT);
    case 'image/x-icon':
      return encodeIco(pngs);
    case 'image/png': {
      const png = pngs.get(link.href);
      if (!png) throw new Error(`missing encoded ${link.href}`);
      return png;
    }
    default: {
      const unreachable: never = link.type;
      return unreachable;
    }
  }
}

export function writeSiteIcons(publicDir: URL): void {
  assertPublicDir(publicDir);
  const pngs = new Map<string, Buffer>();
  for (const row of RASTERS) pngs.set(row.href, encodePng(row.size));
  for (const link of iconLinkTags()) writeIfChanged(publicDir, link.href, bytesFor(link, pngs));
}

type PngChunk = { type: string; data: Buffer };

function readPngChunks(bytes: Buffer): readonly PngChunk[] {
  if (
    bytes.length < PNG_SIGNATURE.length ||
    !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    throw new Error('PNG signature mismatch');
  }
  const chunks: PngChunk[] = [];
  let offset = PNG_SIGNATURE.length;
  while (offset < bytes.length) {
    if (bytes.length - offset < 12) throw new Error('PNG chunk header is truncated');
    const length = bytes.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    if (crcEnd > bytes.length) throw new Error('PNG chunk data is truncated');
    const type = bytes.toString('ascii', typeStart, dataStart);
    const stored = bytes.readUInt32BE(dataEnd);
    const actual = crc32(bytes.subarray(typeStart, dataEnd));
    if (stored !== actual) throw new Error(`PNG ${type} checksum mismatch`);
    chunks.push({ type, data: Buffer.from(bytes.subarray(dataStart, dataEnd)) });
    offset = crcEnd;
  }
  return chunks;
}

function rasterByHref(href: string): Raster {
  for (const row of RASTERS) {
    if (row.href === href) return row;
  }
  throw new Error(`${href} is not a site raster`);
}

function decodePng(bytes: Buffer, size: number): void {
  const chunks = readPngChunks(bytes);
  const ihdrChunk = chunks[0];
  const idatChunk = chunks[1];
  const iendChunk = chunks[2];
  if (
    chunks.length !== 3 ||
    !ihdrChunk ||
    !idatChunk ||
    !iendChunk ||
    ihdrChunk.type !== 'IHDR' ||
    idatChunk.type !== 'IDAT' ||
    iendChunk.type !== 'IEND' ||
    iendChunk.data.length !== 0
  ) {
    throw new Error('PNG must contain IHDR, one IDAT, and IEND');
  }
  const ihdr = ihdrChunk.data;
  if (ihdr.length !== 13) throw new Error('PNG IHDR is the wrong length');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  if (width !== size || height !== size) {
    throw new Error(`PNG size is ${width}x${height}, expected ${size}x${size}`);
  }
  if (ihdr[8] !== 8 || ihdr[9] !== 6 || ihdr[10] !== 0 || ihdr[11] !== 0 || ihdr[12] !== 0) {
    throw new Error('PNG must be 8-bit non-interlaced RGBA');
  }
  const raw = inflateSync(idatChunk.data);
  const stride = 1 + size * 4;
  if (raw.length !== stride * size) throw new Error('PNG image data length mismatch');
  for (let y = 0; y < size; y += 1) {
    const row = y * stride;
    if (raw[row] !== 0) throw new Error('PNG scanline filter is not none');
    for (let x = 0; x < size; x += 1) {
      const pixel = row + 1 + x * 4;
      if (raw[pixel] !== 0 || raw[pixel + 1] !== 0 || raw[pixel + 2] !== 0 || raw[pixel + 3] !== 255) {
        throw new Error('PNG pixel is not opaque black');
      }
    }
  }
}

function decodeIco(bytes: Buffer, files: ReadonlyMap<string, Buffer>): void {
  if (bytes.length < 6) throw new Error('favicon.ico is shorter than its header');
  const reserved = bytes.readUInt16LE(0);
  const type = bytes.readUInt16LE(2);
  const count = bytes.readUInt16LE(4);
  const frames = faviconRows();
  if (reserved !== 0 || type !== 1 || count !== frames.length) {
    throw new Error('favicon.ico directory is not three PNG frames');
  }
  const directoryEnd = 6 + 16 * count;
  if (bytes.length < directoryEnd) throw new Error('favicon.ico directory is truncated');
  for (const [index, row] of frames.entries()) {
    const entry = 6 + index * 16;
    const width = bytes[entry];
    const height = bytes[entry + 1];
    const colorCount = bytes[entry + 2];
    const entryReserved = bytes[entry + 3];
    const planes = bytes.readUInt16LE(entry + 4);
    const bitCount = bytes.readUInt16LE(entry + 6);
    const bytesInRes = bytes.readUInt32LE(entry + 8);
    const imageOffset = bytes.readUInt32LE(entry + 12);
    const sibling = files.get(row.href);
    if (!sibling) throw new Error(`missing ${row.href}`);
    const end = imageOffset + bytesInRes;
    if (
      width !== row.size ||
      height !== row.size ||
      colorCount !== 0 ||
      entryReserved !== 0 ||
      planes !== 1 ||
      bitCount !== 32 ||
      bytesInRes !== sibling.length ||
      imageOffset < directoryEnd ||
      end > bytes.length
    ) {
      throw new Error(`favicon.ico frame ${row.size} does not describe ${row.href}`);
    }
    const payload = bytes.subarray(imageOffset, end);
    if (!payload.equals(sibling)) {
      throw new Error(`favicon.ico frame ${row.size} bytes differ from ${row.href}`);
    }
    decodePng(payload, row.size);
  }
}

function verifyLink(link: IconLink, bytes: Buffer, files: ReadonlyMap<string, Buffer>): void {
  switch (link.type) {
    case 'image/svg+xml':
      if (!bytes.equals(Buffer.from(SVG_DOCUMENT))) {
        throw new Error(`${link.href} does not match the black square svg`);
      }
      return;
    case 'image/png':
      decodePng(bytes, rasterByHref(link.href).size);
      return;
    case 'image/x-icon':
      decodeIco(bytes, files);
      return;
    default: {
      const unreachable: never = link.type;
      return unreachable;
    }
  }
}

export function verifySiteIcons(publicDir: URL): void {
  assertPublicDir(publicDir);
  const files = new Map<string, Buffer>();
  for (const link of iconLinkTags()) {
    files.set(link.href, readFileSync(fileIn(publicDir, link.href)));
  }
  for (const link of iconLinkTags()) {
    const bytes = files.get(link.href);
    if (!bytes) throw new Error(`missing ${link.href}`);
    verifyLink(link, bytes, files);
  }
}
