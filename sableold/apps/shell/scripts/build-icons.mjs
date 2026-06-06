// Convert resources/icon.svg into the icon assets electron-builder needs.
// Outputs:
//   apps/shell/build/icon.png  (512x512, used by electron-builder for Linux/Mac)
//   apps/shell/build/icon.ico  (multi-size, used by electron-builder for Windows)
//
// Run: node scripts/build-icons.mjs
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'png-to-ico';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const iconSvg = join(repoRoot, 'resources', 'icon.svg');
const buildDir = join(here, '..', 'build');

await mkdir(buildDir, { recursive: true });

const svg = await readFile(iconSvg);

// 512x512 master PNG (electron-builder accepts this and derives the rest).
const png512 = await sharp(svg, { density: 384 }).resize(512, 512).png().toBuffer();
await writeFile(join(buildDir, 'icon.png'), png512);
console.log('wrote build/icon.png · 512×512');

// Generate a multi-size ICO for Windows (16/24/32/48/64/128/256).
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
);
const ico = await toIco(pngs);
await writeFile(join(buildDir, 'icon.ico'), ico);
console.log('wrote build/icon.ico · ' + sizes.join('/') + ' multi-size');
