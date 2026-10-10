import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const output = join(process.cwd(), "public", "icons");

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeData = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeData, data])));
  return Buffer.concat([length, typeData, data, checksum]);
}

function colorAt(x, y, size) {
  const center = size / 2;
  const distance = Math.hypot(x - center, y - center);
  const radius = size * 0.37;
  if (distance > radius) return [22, 58, 50];
  if (distance > radius * 0.85) return [183, 140, 47];

  const sparkle = Math.abs(x - center) + Math.abs(y - center);
  if (sparkle < size * 0.155) return [22, 58, 50];
  return [249, 231, 168];
}

function png(size) {
  const rows = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const offset = y * (size * 3 + 1);
    rows[offset] = 0;
    for (let x = 0; x < size; x += 1) {
      const [red, green, blue] = colorAt(x + 0.5, y + 0.5, size);
      const pixel = offset + 1 + x * 3;
      rows[pixel] = red;
      rows[pixel + 1] = green;
      rows[pixel + 2] = blue;
    }
  }
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(output, { recursive: true });
await Promise.all(
  [192, 512].map((size) =>
    writeFile(join(output, `tadlam-${size}.png`), png(size)),
  ),
);
