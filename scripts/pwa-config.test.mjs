import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

test("PWA manifest supports an install under the GitHub Pages project path", async () => {
  const manifest = JSON.parse(
    await readFile(join(root, "public", "manifest.webmanifest"), "utf8"),
  );

  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.deepEqual(
    manifest.icons.map(({ src, sizes, type, purpose }) => ({
      src,
      sizes,
      type,
      purpose,
    })),
    [
      {
        src: "./icons/tadlam-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "./icons/tadlam-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  );
});

test("PWA icon files have the declared PNG dimensions", async () => {
  for (const size of [192, 512]) {
    const icon = await readFile(
      join(root, "public", "icons", `tadlam-${size}.png`),
    );
    assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
  }
});
